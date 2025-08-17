/**
 * @fileoverview Service for managing game state calculations.
 * [REVISED] This version includes robust clock and quarter management.
 */
const GameStateService = {

  calculateNextState: function(currentState, outcome) {
    const newState = { ...currentState, isNewDrive: false };

    // 1. Handle Clock (before anything else)
    newState.clock = Math.max(0, currentState.clock - outcome.clockRunoff);

    // --- [THE FIX] QUARTER END LOGIC ---
    if (newState.clock <= 0 && newState.quarter < 4) {
        newState.quarter += 1; // Advance to the next quarter
        newState.clock = CONFIG.initialState.GAME_CLOCK_SECONDS; // Reset the clock to 15:00
        newState.isNewDrive = true; // A new quarter forces a new "drive" (kickoff)
        
        // The team that was on defense will receive the ball
        newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
        newState.down = 1;
        newState.distance = 10;
        newState.ballOn = 25;
        newState.resultText = `END OF QUARTER ${currentState.quarter}.`;
        return newState;
    }


    // --- SCORING EVENT: TOUCHDOWN ---
    if (newState.ballOn + outcome.yardsGained >= 100) {
      newState.isNewDrive = true;
      newState.resultText = `TOUCHDOWN! ${outcome.resultText}`;
      if (newState.possession === newState.homeTeamId) {
        newState.home_score += 6;
      } else {
        newState.away_score += 6;
      }
      newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
      newState.down = 1;
      newState.distance = 10;
      newState.ballOn = 25;
      return newState;
    }

    // --- SCORING EVENT: SAFETY ---
    if (newState.ballOn + outcome.yardsGained <= 0) {
        newState.isNewDrive = true;
        newState.resultText = `SAFETY! ${outcome.resultText}`;
        if (newState.possession === newState.homeTeamId) {
          newState.away_score += 2;
        } else {
          newState.home_score += 2;
        }
        newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
        newState.down = 1;
        newState.distance = 10;
        newState.ballOn = 35;
        return newState;
    }


    // --- TURNOVER ---
    if (outcome.isTurnover || (currentState.down >= 4 && outcome.yardsGained < currentState.distance)) {
      newState.isNewDrive = true;
      newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
      newState.down = 1;
      newState.distance = 10;
      newState.ballOn = 100 - (currentState.ballOn + outcome.yardsGained);
      return newState;
    }
    
    // --- NORMAL PLAY ---
    newState.ballOn += outcome.yardsGained;
    
    if (outcome.yardsGained >= currentState.distance) { // First Down
      newState.down = 1;
      newState.distance = Math.min(10, 100 - newState.ballOn);
    } else { // Not a first down
      newState.down = currentState.down + 1;
      newState.distance -= outcome.yardsGained;
    }

    return newState;
  }
};