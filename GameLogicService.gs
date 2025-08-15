/**
 * @fileoverview Service layer for all core game simulation calculations.
 */
const GameLogicService = {
  calculateMatchupStrength: function(playCall, offensePlayers, defensePlayers) {
    let offenseStrength = 50, defenseStrength = 50;
    const getAvgStat = (players, position, stat) => {
      const relevantPlayers = players.filter(p => p.position === position);
      if (relevantPlayers.length === 0) return 50;
      const total = relevantPlayers.reduce((sum, p) => sum + (p[stat] || 50), 0);
      return total / relevantPlayers.length;
    };
    
    switch (playCall) {
      case "Short Pass": case "Deep Pass":
        const qb = offensePlayers.find(p => p.position === 'QB');
        const wrs = offensePlayers.filter(p => p.position === 'WR');
        if (!qb || wrs.length === 0) break;
        const ol_pass_block = getAvgStat(offensePlayers, 'OL', 'pass_block');
        const db_coverage = getAvgStat(defensePlayers, 'DB', 'zone_coverage');
        const dl_pass_rush = getAvgStat(defensePlayers, 'DL', 'pass_rush');
        offenseStrength = (qb.throwing_accuracy * 0.4) + (getAvgStat(wrs, 'WR', 'catching') * 0.3) + (ol_pass_block * 0.3);
        defenseStrength = (db_coverage * 0.6) + (dl_pass_rush * 0.4);
        break;
      
      case "Inside Run": case "Outside Run":
        const rb = offensePlayers.find(p => p.position === 'RB');
        if (!rb) break;
        const ol_run_block = getAvgStat(offensePlayers, 'OL', 'run_block');
        const dl_block_shed = getAvgStat(defensePlayers, 'DL', 'block_shedding');
        const lb_tackling = getAvgStat(defensePlayers, 'LB', 'tackling');
        offenseStrength = (rb.carrying * 0.4) + (rb.speed * 0.2) + (ol_run_block * 0.4);
        defenseStrength = (dl_block_shed * 0.5) + (lb_tackling * 0.5);
        break;
    }
    return { offenseStrength: offenseStrength || 50, defenseStrength: defenseStrength || 50 };
  },
  
  calculatePlayOutcome: function(offenseStrength, defenseStrength) {
    const statDifference = offenseStrength - defenseStrength;
    const randomRoll = Math.floor(Math.random() * 21) - 10;
    const baseResult = statDifference + randomRoll;
    let outcome;
    if (baseResult > 15) { const y = Math.floor(Math.random()*20)+15; outcome = { resultText: `BIG PLAY! Gain of ${y} yards.`, yardsGained: y, clockRunoff: 7, isTurnover: false };
    } else if (baseResult > 5) { const y = Math.floor(Math.random()*10)+5; outcome = { resultText: `Positive gain of ${y} yards.`, yardsGained: y, clockRunoff: 6, isTurnover: false };
    } else if (baseResult > -5) { const y = Math.floor(Math.random()*5); outcome = { resultText: `Short gain of ${y} yards.`, yardsGained: y, clockRunoff: 5, isTurnover: false };
    } else if (baseResult > -12) { const y = Math.floor(Math.random()*3)+1; outcome = { resultText: `Tackle for a loss of ${y} yards.`, yardsGained: -y, clockRunoff: 5, isTurnover: false };
    } else { outcome = { resultText: `TURNOVER! Interception!`, yardsGained: 0, clockRunoff: 5, isTurnover: true }; }
    if (Math.random() < CONFIG.mechanics.PENALTY_CHANCE) { return { ...outcome, resultText: "Play negated by PENALTY (Offensive Holding).", yardsGained: -10, isTurnover: false, penalty: "Offensive Holding" };}
    return { ...outcome, penalty: "Clean Play" };
  },
};