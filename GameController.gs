/**
 * @fileoverview Controller for handling game flow.
 */
function runNextPlay() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(),
    ui = SpreadsheetApp.getUi();
  try {
    const simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM),
      playersSheet = ss.getSheetByName(CONFIG.sheets.PLAYERS),
      playerHeaders = playersSheet
        .getRange(1, 1, 1, playersSheet.getLastColumn())
        .getValues()[0],
      allPlayersData = playersSheet
        .getRange(
          2,
          1,
          playersSheet.getLastRow() - 1,
          playersSheet.getLastColumn()
        )
        .getValues(),
      allPlayers = allPlayersData.map((row) =>
        createObjectFromRow(row, playerHeaders)
      ),
      offensePlayCall = simSheet.getRange("A2").getValue(),
      stateValues = simSheet.getRange("A5:H5").getValues()[0],
      currentState = {
        homeTeamId: stateValues[0],
        awayTeamId: stateValues[1],
        possession: stateValues[2],
        quarter: stateValues[3],
        clock: stateValues[4],
        down: stateValues[5],
        distance: stateValues[6],
        ballOn: stateValues[7],
      },
      offenseTeamId = currentState.possession,
      defenseTeamId =
        currentState.possession === currentState.homeTeamId
          ? currentState.awayTeamId
          : currentState.homeTeamId,
      getLineup = (teamId) =>
        allPlayers.filter(
          (p) => p.team_id == teamId && 1 == p.depth_chart_rank
        ),
      offensiveLineup = getLineup(offenseTeamId),
      defensiveLineup = getLineup(defenseTeamId);
    const {
        offenseStrength: offenseStrength,
        defenseStrength: defenseStrength,
      } = GameLogicService.calculateMatchupStrength(
        offensePlayCall,
        offensiveLineup,
        defensiveLineup
      ),
      outcome = GameLogicService.calculatePlayOutcome(
        offenseStrength,
        defenseStrength
      ),
      newState = GameStateService.calculateNextState(currentState, outcome);
    updateDashboard(newState),
      logPlay(currentState, offensePlayCall, outcome.resultText);
  } catch (e) {
    ui.alert(
      `An error occurred during play simulation: ${e.message}\n${e.stack}`
    );
  }
}
function resetGame() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(),
    initialState = {
      homeTeamId: CONFIG.initialState.HOME_TEAM_ID,
      awayTeamId: CONFIG.initialState.AWAY_TEAM_ID,
      possession: CONFIG.initialState.HOME_TEAM_ID,
      quarter: CONFIG.initialState.QUARTER,
      clock: CONFIG.initialState.GAME_CLOCK_SECONDS,
      down: CONFIG.initialState.DOWN,
      distance: CONFIG.initialState.DISTANCE,
      ballOn: CONFIG.initialState.BALL_ON_YARD_LINE,
    };
  updateDashboard(initialState);
  const gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE);
  gameStateSheet &&
    gameStateSheet.getMaxRows() > 14 &&
    gameStateSheet
      .getRange("A15:G" + gameStateSheet.getMaxRows())
      .clearContent();
}
function updateDashboard(state) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(),
    simSheet = ss.getSheetByName(CONFIG.sheets.PLAY_SIM),
    gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE),
    teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues(),
    newStateValues = [
      [
        state.homeTeamId,
        state.awayTeamId,
        state.possession,
        state.quarter,
        state.clock,
        state.down,
        state.distance,
        state.ballOn,
      ],
    ];
  simSheet.getRange("A5:H5").setValues(newStateValues);
  const homeTeam = teams.find((t) => t[0] == state.homeTeamId),
    awayTeam = teams.find((t) => t[0] == state.awayTeamId),
    possTeam = teams.find((t) => t[0] == state.possession);
  gameStateSheet.getRange("A4").setValue(homeTeam[2]),
    gameStateSheet.getRange("C4").setValue(homeTeam[4]),
    gameStateSheet.getRange("E4").setValue(awayTeam[2]),
    gameStateSheet.getRange("G4").setValue(awayTeam[4]),
    gameStateSheet.getRange("A7").setValue(possTeam[3]),
    gameStateSheet.getRange("B7").setValue(`on the ${state.ballOn}`),
    gameStateSheet.getRange("C7").setValue(state.down),
    gameStateSheet.getRange("D7").setValue(state.distance),
    gameStateSheet.getRange("E7").setValue(state.quarter),
    gameStateSheet
      .getRange("F7")
      .setValue(Time.fromSeconds(state.clock).toMilitary());
}
function logPlay(currentState, playCall, resultText) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(),
    gameStateSheet = ss.getSheetByName(CONFIG.sheets.GAME_STATE),
    teams = ss.getSheetByName(CONFIG.sheets.TEAMS).getDataRange().getValues(),
    offenseAbbr = teams.find((t) => t[0] == currentState.possession)[3],
    logRow = [
      [
        Time.fromSeconds(currentState.clock).toMilitary(),
        offenseAbbr,
        currentState.down,
        currentState.distance,
        currentState.ballOn,
        playCall,
        resultText,
      ],
    ];
  gameStateSheet.insertRowAfter(14),
    gameStateSheet.getRange("A15:G15").setValues(logRow);
}
