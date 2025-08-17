/**
 * @fileoverview Configuration file for the Football Simulation Game.
 */
const CONFIG = {
  sheets: {
    TEAMS: 'teams',
    PLAYERS: 'players',
    PENALTIES: 'penalty_table',
    PLAY_SIM: 'play_sim',
    GAME_STATE: 'game_state',
    ACTIVE_LINEUP: 'active_lineup',
    GAME_LOG: 'game_log',
    STRATEGY: 'strategy',
  },
initialState:{HOME_TEAM_ID:1,AWAY_TEAM_ID:2,QUARTER:1,GAME_CLOCK_SECONDS:300,DOWN:1,DISTANCE:10,BALL_ON_YARD_LINE:25},
mechanics:{YARDS_TO_GOAL_FOR_FIRST_DOWN:10,PENALTY_CHANCE:.15},
colors:{HEADER_BG:"#434343",HEADER_FONT:"#ffffff",HOME_TEAM_BG:"#4a86e8",AWAY_TEAM_BG:"#e06666",BALL_MARKER:"#ffff00"}
};
