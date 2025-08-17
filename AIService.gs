/**
 * @fileoverview A service to make play-calling decisions.
 * It now acts as a "coach" for both the user's team (in auto-sim) and the opponent.
 */
const AIService = {

  /**
   * Gets the appropriate play call based on who is on offense.
   * @param {object} currentState The current state of the game.
   * @param {boolean} isForHumanTeam True if we are getting a call for the human's team.
   * @returns {string} The chosen play call.
   */
  getPlayCall: function(currentState, isForHumanTeam) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const strategySheet = ss.getSheetByName(CONFIG.sheets.STRATEGY);
    
    // --- Determine which strategy to read ---
    const isOffense = isForHumanTeam ? 
      (currentState.possession === CONFIG.initialState.HOME_TEAM_ID) :
      (currentState.possession !== CONFIG.initialState.HOME_TEAM_ID);

    // --- OFFENSIVE AI ---
    if (isOffense) {
      const gameplan = isForHumanTeam ? strategySheet.getRange("B4").getValue() : "Balanced"; // AI opponent is always balanced for now
      
      // Basic situational logic
      if (currentState.down >= 3 && currentState.distance >= 7) return "Deep Pass";
      if (currentState.down >= 3 && currentState.distance >= 4) return "Short Pass";
      if (currentState.distance <= 2) return "Inside Run";

      // Follow the gameplan
      if (gameplan === "Pass Heavy") return (Math.random() < 0.7) ? "Short Pass" : "Deep Pass";
      if (gameplan === "Run Heavy") return (Math.random() < 0.7) ? "Inside Run" : "Outside Run";
      
      // Balanced approach
      return ["Inside Run", "Short Pass"][Math.floor(Math.random() * 2)];
    } 
    // --- DEFENSIVE AI ---
    else {
      const gameplan = isForHumanTeam ? strategySheet.getRange("E4").getValue() : "Standard"; // AI opponent is standard
      
      if (currentState.down >= 3 && currentState.distance >= 7) return "Zone Blitz";
      
      if (gameplan === "Aggressive (Blitz Heavy)") return (Math.random() < 0.6) ? "Man Blitz" : "Zone Blitz";
      if (gameplan === "Conservative") return "3-4 Cover 3";
      
      return "4-3 Cover 2";
    }
  }
};