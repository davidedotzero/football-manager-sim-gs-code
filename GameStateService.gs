/**
 * @fileoverview Service for managing game state calculations.
 */
const GameStateService = {

  calculateNextState: function(currentState, outcome) {
    const newState = { ...currentState };

    newState.clock = Math.max(0, currentState.clock - outcome.clockRunoff);

    if (outcome.isTurnover || (currentState.down >= 4 && outcome.yardsGained < currentState.distance)) {
      newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
      newState.down = 1;
      newState.distance = CONFIG.mechanics.YARDS_TO_GOAL_FOR_FIRST_DOWN;
      newState.ballOn = 100 - (currentState.ballOn + outcome.yardsGained);
      return newState;
    }
    
    newState.ballOn += outcome.yardsGained;
    
    if (outcome.yardsGained >= currentState.distance) { // First Down
      newState.down = 1;
      newState.distance = Math.min(CONFIG.mechanics.YARDS_TO_GOAL_FOR_FIRST_DOWN, 100 - newState.ballOn);
    } else { // Not a first down
      newState.down = currentState.down + 1;
      newState.distance -= outcome.yardsGained;
    }

    if (newState.ballOn >= 100) { // Touchdown
      newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
      newState.down = 1;
      newState.distance = CONFIG.mechanics.YARDS_TO_GOAL_FOR_FIRST_DOWN;
      newState.ballOn = 25;
    } else if (newState.ballOn <= 0) { // Safety
      newState.possession = (currentState.possession === currentState.homeTeamId) ? currentState.awayTeamId : currentState.homeTeamId;
      newState.down = 1;
      newState.distance = CONFIG.mechanics.YARDS_TO_GOAL_FOR_FIRST_DOWN;
      newState.ballOn = 25;
    }
    return newState;
  }
};