/**
 * @fileoverview Controller for handling game flow, state transitions, and user actions.
 */

/**
 * Executes a single play, calculates the result, and updates the game state.
 * This is the main "game loop" function.
 */
function runNextPlay() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();

    try {
        // --- 1. Get Sheets and Data ---
        const simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM);
        const playersSheet = ss.getSheetByName(CONFIG.sheets.PLAYERS);
        const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
        
        // Read all player data once for efficiency
        const playerHeaders = playersSheet.getRange(1, 1, 1, playersSheet.getLastColumn()).getValues()[0];
        const allPlayersData = playersSheet.getRange(2, 1, playersSheet.getLastRow() - 1, playersSheet.getLastColumn()).getValues();
        const allPlayers = allPlayersData.map(row => createObjectFromRow(row, playerHeaders));

        // --- 2. Get Current State & User Input ---
        const offensePlayCall = simSheet.getRange("A2").getValue();
        const stateValues = simSheet.getRange("A5:J5").getValues()[0];
        const currentState = {
            homeTeamId: stateValues[0],
            awayTeamId: stateValues[1],
            possession: stateValues[2],
            quarter: stateValues[3],
            clock: stateValues[4],
            down: stateValues[5],
            distance: stateValues[6],
            ballOn: stateValues[7],
            home_score: stateValues[8],
            away_score: stateValues[9]
        };

        // --- 3. Determine Teams and Get Active Lineups ---
        const offenseTeamId = currentState.possession;
        const defenseTeamId = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
        
        const getLineup = (teamId) => allPlayers.filter(p => p.team_id == teamId && p.depth_chart_rank == 1);
        const offensiveLineup = getLineup(offenseTeamId);
        const defensiveLineup = getLineup(defenseTeamId);

        // --- 4. Call Services to Simulate the Play ---
        const { offenseStrength, defenseStrength } = GameLogicService.calculateMatchupStrength(offensePlayCall, offensiveLineup, defensiveLineup);
        const outcome = GameLogicService.calculatePlayOutcome(offenseStrength, defenseStrength, currentState);
        
        // --- 5. Calculate New State and Update Game ---
        const newState = GameStateService.calculateNextState(currentState, outcome);
        updateDashboard(newState);
        logPlay(currentState, offensePlayCall, newState.resultText || outcome.resultText);

        // --- [NEW] Drive Trail Logic ---
        const driveLogRange = gameStateSheet.getRange("A101:A150");
        if (newState.isNewDrive) {
            driveLogRange.clearContent(); // Start a new trail
        }
        
        const newBallPos = (newState.possession === newState.homeTeamId) ? newState.ballOn : 100 - newState.ballOn;
        // Find the next empty row in the log and add the new position
        const lastRow = driveLogRange.getValues().filter(String).length;
        gameStateSheet.getRange(101 + lastRow, 1).setValue(newBallPos);
        
        updateDashboard(newState);
        logPlay(currentState, offensePlayCall, newState.resultText || outcome.resultText);

    } catch (e) {
        ui.alert(`An error occurred during play simulation: ${e.message}\n${e.stack}`);
    }
}

/**
 * Resets the game to its initial kickoff state, including a coin toss.
 */
function resetGame() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Perform a coin toss to decide who receives the ball
    const coinTossWinner = (Math.random() < 0.5) ? CONFIG.initialState.HOME_TEAM_ID : CONFIG.initialState.AWAY_TEAM_ID;
    
    const teamsData = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();
    const winnerName = teamsData.find(t => t[0] == coinTossWinner)[2];
    ss.toast(`${winnerName} won the coin toss and will receive!`, "🏈 Kickoff!", 10);

    const initialState = {
        homeTeamId: CONFIG.initialState.HOME_TEAM_ID,
        awayTeamId: CONFIG.initialState.AWAY_TEAM_ID,
        possession: coinTossWinner,
        quarter: CONFIG.initialState.QUARTER,
        clock: CONFIG.initialState.GAME_CLOCK_SECONDS,
        down: CONFIG.initialState.DOWN,
        distance: CONFIG.initialState.DISTANCE,
        ballOn: CONFIG.initialState.BALL_ON_YARD_LINE,
        home_score: 0,
        away_score: 0
    };

    updateDashboard(initialState);

    // Clear the play-by-play log
    const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
    if (gameStateSheet && gameStateSheet.getMaxRows() > 14) {
        gameStateSheet.getRange("A15:G" + gameStateSheet.getMaxRows()).clearContent();
    }
}

/**
 * [REVISED] This function now writes the ball position directly to the helper cell J3.
 */
function updateDashboard(state) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM);
    const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
    const teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();

    // 1. Update the "Source of Truth" in play_sim
    const newStateValues = [[
      state.homeTeamId, state.awayTeamId, state.possession, state.quarter,
      state.clock, state.down, state.distance, state.ballOn
    ]];
    simSheet.getRange("A5:H5").setValues(newStateValues);

    // 2. Update the visual dashboard
    const homeTeam = teams.find(t => t[0] == state.homeTeamId);
    const awayTeam = teams.find(t => t[0] == state.awayTeamId);
    const possTeam = teams.find(t => t[0] == state.possession);

    gameStateSheet.getRange("A4").setValue(homeTeam[2]);
    gameStateSheet.getRange("C4").setValue(homeTeam[4]);
    gameStateSheet.getRange("E4").setValue(awayTeam[2]);
    gameStateSheet.getRange("G4").setValue(awayTeam[4]);
    // Score update logic will be added later
    // gameStateSheet.getRange("B4, F4").setValue(0);

    gameStateSheet.getRange("A7").setValue(possTeam[3]);
    gameStateSheet.getRange("B7").setValue(`on the ${state.ballOn}`);
    gameStateSheet.getRange("C7").setValue(state.down);
    gameStateSheet.getRange("D7").setValue(state.distance);
    gameStateSheet.getRange("E7").setValue(state.quarter);
    gameStateSheet.getRange("F7").setValue(Time.fromSeconds(state.clock).toMilitary());
}


/**
 * Writes the result of a single play to the play-by-play log.
 * @param {object} currentState The state of the game *before* the play.
 * @param {string} playCall The offensive play that was called.
 * @param {string} resultText The outcome of the play.
 */
function logPlay(currentState, playCall, resultText) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
    const teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues();
    const offenseAbbr = teams.find(t => t[0] == currentState.possession)[3];

    const logRow = [[
        Time.fromSeconds(currentState.clock).toMilitary(),
        offenseAbbr,
        currentState.down,
        currentState.distance,
        currentState.ballOn,
        playCall,
        resultText
    ]];

    gameStateSheet.insertRowAfter(14);
    gameStateSheet.getRange("A15:G15").setValues(logRow);
}
