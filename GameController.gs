/**
 * @fileoverview Controller for handling game flow.
 * This is the final, stable version that works with all systems.
 */

const SIMULATION_TRIGGER_ID_KEY = 'simulationTriggerId';
const GAME_ENDED_KEY = 'isGameEnded';

/**
 * A function to be run MANUALLY ONCE from the editor to grant permissions for triggers.
 */
function authorizeTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    Logger.log(`Authorization check complete. Found ${triggers.length} triggers.`);
    SpreadsheetApp.getUi().alert('Permissions for managing triggers have been successfully authorized!');
}

/**
 * Starts the automated game simulation process by creating a time-based trigger.
 */
function startSimulation() {
    PropertiesService.getUserProperties().deleteProperty(GAME_ENDED_KEY);
    const ui = SpreadsheetApp.getUi();
    deleteTriggers(false);
    const trigger = ScriptApp.newTrigger('continueSimulation').timeBased().everyMinutes(1).create();
    PropertiesService.getUserProperties().setProperty(SIMULATION_TRIGGER_ID_KEY, trigger.getUniqueId());
    ui.alert("✅ Full Game Simulation Started!", "The game will now play automatically in the background. You will be notified by email when it is complete.", ui.ButtonSet.OK);
}

/**
 * This function is run by a trigger to simulate a chunk of the game.
 */
function continueSimulation() {
    let currentState = {};
    const playsToSimulate = 40;
    for (let i = 0; i < playsToSimulate; i++) {
        currentState = runNextPlay(true);
        if (currentState === null || currentState.quarter > 4 || (currentState.quarter === 4 && currentState.clock <= 0)) {
            endGame(currentState);
            return;
        }
    }
}

/**
 * Executes a single play, calculates the result, and updates the game state.
 */
function runNextPlay(isAutoSim = false) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    try {
        const simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM);
        const playersSheet = ss.getSheetByName(CONFIG.sheets.PLAYERS);

        const stateValues = simSheet.getRange("A5:J5").getValues()[0];
        const currentState = {
            homeTeamId: stateValues[0], awayTeamId: stateValues[1], possession: stateValues[2], quarter: stateValues[3],
            clock: stateValues[4], down: stateValues[5], distance: stateValues[6], ballOn: stateValues[7],
            home_score: stateValues[8] || 0, away_score: stateValues[9] || 0
        };
        
        // --- [THE FIX] Determine Play Calls for BOTH teams based on game mode ---
        let offensePlayCall, defensePlayCall;
        const isHumanTeamOnOffense = (currentState.possession === currentState.homeTeamId);

        if (isAutoSim) {
            // In AUTO SIM, the AI plays for both sides based on their strategy
            offensePlayCall = AIService.getPlayCall(currentState, isHumanTeamOnOffense);
            defensePlayCall = AIService.getPlayCall(currentState, !isHumanTeamOnOffense);
        } else {
            // In manual play, use the dropdowns from play_sim
            offensePlayCall = simSheet.getRange("A2").getValue();
            defensePlayCall = simSheet.getRange("B2").getValue();
        }

        // --- The rest of the simulation logic remains the same ---
        const playerHeaders = playersSheet.getRange(1, 1, 1, playersSheet.getLastColumn()).getValues()[0];
        const allPlayersData = playersSheet.getRange(2, 1, playersSheet.getLastRow() - 1, playersSheet.getLastColumn()).getValues();
        const allPlayers = allPlayersData.map(row => createObjectFromRow(row, playerHeaders));
        const offenseTeamId = currentState.possession;
        const defenseTeamId = (offenseTeamId === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
        const getLineup = (teamId) => allPlayers.filter(p => p.team_id == teamId && p.depth_chart_rank == 1);
        const offensiveLineup = getLineup(offenseTeamId);
        const defensiveLineup = getLineup(defenseTeamId);
        const { offenseStrength, defenseStrength } = GameLogicService.calculateMatchupStrength(offensePlayCall, offensiveLineup, defensiveLineup);
        const outcome = GameLogicService.calculatePlayOutcome(offenseStrength, defenseStrength, currentState);
        const newState = GameStateService.calculateNextState(currentState, outcome);
        updateDashboard(newState);
        logPlay(currentState, offensePlayCall, newState.resultText || outcome.resultText);

        if (newState.quarter > 4 || (newState.quarter === 4 && newState.clock <= 0)) {
            if (isAutoSim) endGame(newState);
        }
        return newState;

    } catch (e) {
        if (!isAutoSim) { SpreadsheetApp.getUi().alert(`An error occurred: ${e.message}\n${e.stack}`); }
        Logger.log(e);
        return null;
    }
}

function simulateNextQuarter() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM);

    const startQuarter = simSheet.getRange("D5").getValue();
    ss.toast(`Simulating Quarter ${startQuarter}...`, "AMSIM Engine", -1);

    // Safety break after 150 plays to prevent accidental infinite loops
    for (let i = 0; i < 150; i++) {
        const currentState = runNextPlay(true); // Run a single play

        if (currentState === null) { // An error occurred
            ss.toast("Simulation stopped due to an error.", "Error", 5);
            return;
        }

        // Check if the quarter has changed or the game has ended
        if (currentState.quarter > startQuarter || currentState.quarter > 4) {
            break; // Exit the loop
        }
        
        // Check for end of game specifically
        if (currentState.quarter === 4 && currentState.clock <= 0) {
            break;
        }
    }
    
    // Check if the whole game ended
    const finalStateValues = simSheet.getRange("A5:J5").getValues()[0];
    const finalState = { quarter: finalStateValues[3], clock: finalStateValues[4] };

    if (finalState.quarter > 4 || (finalState.quarter === 4 && finalState.clock <= 0)) {
        endGame(finalState); // Use the most recent state for the end game log
    } else {
        ss.toast(`Quarter ${startQuarter} simulation complete!`, "AMSIM Engine", 5);
    }
}

/**
 * Handles the end of the game, logs the result, and sends a notification.
 */
function endGame(finalState) {
    const gameEnded = PropertiesService.getUserProperties().getProperty(GAME_ENDED_KEY);
    if (gameEnded === 'true') {
        return;
    }
    PropertiesService.getUserProperties().setProperty(GAME_ENDED_KEY, 'true');
    deleteTriggers(false);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();
    const logSheet = ss.getSheetByName(CONFIG.sheets.GAME_LOG);

    const homeTeam = teams.find(t => t[0] == finalState.homeTeamId);
    const awayTeam = teams.find(t => t[0] == finalState.awayTeamId);

    const homeName = homeTeam[2], awayName = awayTeam[2], homeScore = finalState.home_score, awayScore = finalState.away_score;
    let result = `${homeName} ${homeScore} - ${awayName} ${awayScore}`;
    let winner = (homeScore > awayScore) ? `${homeName} WIN!` : (awayScore > homeScore) ? `${awayName} WIN!` : "TIE GAME!";
    
    logSheet.appendRow([new Date(), homeName, homeScore, awayName, awayScore, winner]);
    
    ss.toast(`${result} --- ${winner}`, 'FINAL SCORE', -1);
}

/**
 * Deletes the active simulation trigger.
 */
function deleteTriggers(showToast = true) {
    const triggerId = PropertiesService.getUserProperties().getProperty(SIMULATION_TRIGGER_ID_KEY);
    if (!triggerId) {
        if (showToast) SpreadsheetApp.getActiveSpreadsheet().toast('No active simulation to cancel.', 'AMSIM Engine', 5);
        return;
    }
    const allTriggers = ScriptApp.getProjectTriggers();
    for (const trigger of allTriggers) {
        if (trigger.getUniqueId() === triggerId) {
            ScriptApp.deleteTrigger(trigger);
            break;
        }
    }
    PropertiesService.getUserProperties().deleteProperty(SIMULATION_TRIGGER_ID_KEY);
    if (showToast) {
        SpreadsheetApp.getActiveSpreadsheet().toast('Simulation cancelled.', 'AMSIM Engine', 5);
    }
}

/**
 * Resets the game to its initial kickoff state.
 */
function resetGame() {
    PropertiesService.getUserProperties().deleteProperty(GAME_ENDED_KEY);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
    
    const coinTossWinner = Math.random() < 0.5 ? CONFIG.initialState.HOME_TEAM_ID : CONFIG.initialState.AWAY_TEAM_ID;
    const teamsData = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();
    const winnerName = teamsData.find(t => t[0] == coinTossWinner)[2];
    ss.toast(`${winnerName} won the coin toss and will receive!`, "🏈 Kickoff!", 10);

    const initialState = {
        homeTeamId: CONFIG.initialState.HOME_TEAM_ID, awayTeamId: CONFIG.initialState.AWAY_TEAM_ID,
        possession: coinTossWinner, quarter: CONFIG.initialState.QUARTER,
        clock: CONFIG.initialState.GAME_CLOCK_SECONDS, down: CONFIG.initialState.DOWN,
        distance: CONFIG.initialState.DISTANCE, ballOn: CONFIG.initialState.BALL_ON_YARD_LINE,
        home_score: 0, away_score: 0,
    };
    
    updateDashboard(initialState);
    
    if (gameStateSheet) {
        gameStateSheet.getRange("J1:J50").clearContent();
        if (gameStateSheet.getMaxRows() > 10) {
            gameStateSheet.getRange("A11:G" + gameStateSheet.getMaxRows()).clearContent();
        }
    }
}

/**
 * Writes the current game state to the sheets.
 */
function updateDashboard(state) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM);
    const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
    const teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();

    // [FIX] Ensure all 10 state values are written back to the source of truth.
    const newStateValues = [[
        state.homeTeamId, state.awayTeamId, state.possession, state.quarter,
        state.clock, state.down, state.distance, state.ballOn,
        state.home_score, state.away_score
    ]];
    simSheet.getRange("A5:J5").setValues(newStateValues);

    const homeTeam = teams.find(t => t[0] == state.homeTeamId);
    const awayTeam = teams.find(t => t[0] == state.awayTeamId);
    const possTeam = teams.find(t => t[0] == state.possession);

    // Scoreboard
    gameStateSheet.getRange("A4").setValue(homeTeam[2]);
    gameStateSheet.getRange("B4").setValue(state.home_score);
    gameStateSheet.getRange("C4").setValue(homeTeam[4]);
    gameStateSheet.getRange("E4").setValue(awayTeam[2]);
    gameStateSheet.getRange("F4").setValue(state.away_score);
    gameStateSheet.getRange("G4").setValue(awayTeam[4]);

    // Drive Status
    gameStateSheet.getRange("A7").setValue(possTeam[3]);
    gameStateSheet.getRange("B7").setValue(`on the ${state.ballOn}`);
    gameStateSheet.getRange("C7").setValue(state.down);
    gameStateSheet.getRange("D7").setValue(state.distance);
    gameStateSheet.getRange("E7").setValue(state.quarter);
    gameStateSheet.getRange("F7").setValue(Time.fromSeconds(state.clock).toMilitary());

    // Ball Marker Helper Cell
    const ballPos = (state.possession === state.homeTeamId) ? state.ballOn : 100 - state.ballOn;
    gameStateSheet.getRange("J3").setValue(ballPos);
}

/**
 * Writes the result of a single play to the play-by-play log.
 */
function logPlay(currentState, playCall, resultText) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
    
    const teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();
    const offenseAbbr = teams.find(t => t[0] == currentState.possession)[3];
    const newLogRow = [
        Time.fromSeconds(currentState.clock).toMilitary(),
        offenseAbbr,
        currentState.down,
        currentState.distance,
        currentState.ballOn,
        playCall,
        resultText
    ];

    let existingLogs = [];
    if (gameStateSheet.getLastRow() > 14) {
      existingLogs = gameStateSheet.getRange(15, 1, gameStateSheet.getLastRow() - 14, 7).getValues();
    }
    
    existingLogs.unshift(newLogRow);
    
    if (gameStateSheet.getLastRow() > 14) {
      gameStateSheet.getRange(15, 1, gameStateSheet.getLastRow() - 14, 7).clearContent();
    }
    
    gameStateSheet.getRange(15, 1, existingLogs.length, 7).setValues(existingLogs);
}