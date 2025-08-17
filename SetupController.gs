/**
 * @fileoverview Main controller for setting up and initializing the game sheets and menus.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🏈 Football Sim')
    .addItem('1. Initialize Full Project', 'initializeProject')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('▶️ Roster')
      .addItem('Update Active Lineup', 'updateActiveLineup'))
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('▶️ Run Game')
      .addItem('Run Next Play', 'runNextPlay')
      .addItem('Simulate Next Quarter', 'simulateNextQuarter')
      .addItem('Simulate Full Game (AUTO)', 'startSimulation')
      .addItem('Cancel Simulation', 'deleteTriggers')
      .addItem('Reset Game', 'resetGame'))
    .addToUi();
}

function initializeProject() {
  const ui = SpreadsheetApp.getUi();
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Starting Project Initialization...', 'AMSIM Engine', 5);
    setupDatabaseSheets();
    setupInterfaceSheets();
    SpreadsheetApp.getActiveSpreadsheet().toast('Populating starter lineups...', 'Final Step', 5);
    updateActiveLineup();
    resetGame();
    ui.alert("✅ Project setup complete. All sheets have been initialized successfully!");
  } catch (e) {
    const errorMsg = `An error occurred during setup: ${e.message}\n\nFile: ${e.fileName}\nLine: ${e.lineNumber}`;
    Logger.log(errorMsg + "\n" + e.stack);
    ui.alert(errorMsg);
  }
}

function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupTeamsSheet(ss);
  setupPlayersSheet(ss);
  setupPenaltySheet(ss);
}

function setupInterfaceSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupActiveLineupSheet(ss);
    setupPlaySimSheet(ss);
    setupGameStateSheet(ss);
    setupGameLogSheet(ss);
    setupStrategySheet(ss);
}

function prepareSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { sheet = ss.insertSheet(sheetName); }
  
  const requiredCols = 130;
  const currentCols = sheet.getMaxColumns();
  if (currentCols < requiredCols) {
    sheet.insertColumnsAfter(currentCols, requiredCols - currentCols);
  }

  sheet.getRange("A1:DU500").clear({contentsOnly: true, formatOnly: true, validationsOnly: true});
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  Utilities.sleep(100);
  return sheet;
}

function setupTeamsSheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.TEAMS);
    sheet.setFrozenRows(1);
    const headers = ['team_id', 'city', 'team_name', 'abbr', 'timeouts_remaining', 'challenges_remaining'];
    const data = [
        [1, 'Bangkok', 'Dragons', 'BKK', 3, 2],
        [2, 'Chiang Mai', 'Tigers', 'CNX', 3, 2]
    ];
    const values = [headers, ...data];
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground(CONFIG.colors.HOME_TEAM_BG).setFontColor(CONFIG.colors.HEADER_FONT);
    sheet.autoResizeColumns(1, headers.length);
}

function setupPlayersSheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.PLAYERS);
    sheet.setFrozenRows(1);

    const headers = ["player_id", "first_name", "last_name", "team_id", "age", "position", "position_group", "depth_chart_rank", "status", "overall", "jersey_num", "speed", "strength", "agility", "stamina", "injury_resistance", "discipline", "awareness", "throwing_power", "throwing_accuracy", "carrying", "catching", "route_running", "run_block", "pass_block", "tackling", "man_coverage", "zone_coverage", "pass_rush", "block_shedding", "kick_power", "kick_accuracy", "punt_power", "punt_accuracy", "kick_return"];

    const firstNames = ["สมชาย", "อาทิตย์", "ปรีชา", "เอกพล", "จักริน", "ณรงค์", "ธนากร", "วรวุฒิ", "ศุภชัย", "กิตติศักดิ์", "มนตรี", "พิชิต", "วีระ", "ธีรศิลป์", "ชนาธิป", "ธนบูรณ์", "สารัช", "ทริสตอง"];
    const lastNames = ["ทองดี", "ใจงาม", "ศรีสุข", "บุญมา", "จันทวงศ์", "แก้วใส", "มณีรัตน์", "สิงห์โต", "รุ่งเรือง", "ชูใจ", "สุขใจ", "มีชัย", "โพธิ์ศรี", "แสงดาว"];
    
    const rosterComposition = { 'QB': 3, 'RB': 4, 'WR': 8, 'TE': 3, 'OL': 9, 'DL': 7, 'LB': 6, 'DB': 9, 'K': 1, 'P': 1, 'LS': 2 };
    const numStarters = { 'QB': 1, 'RB': 1, 'WR': 3, 'TE': 1, 'OL': 5, 'DL': 4, 'LB': 3, 'DB': 4, 'K': 1, 'P': 1, 'LS': 1 };

    // [FIX] Mapped short stat names to full header names for correct data assignment.
    const statMap = { spd: 'speed', str: 'strength', agi: 'agility', th_p: 'throwing_power', th_a: 'throwing_accuracy', awr: 'awareness', car: 'carrying', cat: 'catching', rr: 'route_running', rb: 'run_block', pb: 'pass_block', tkl: 'tackling', pr: 'pass_rush', bs: 'block_shedding', m_cov: 'man_coverage', z_cov: 'zone_coverage', k_p: 'kick_power', k_a: 'kick_accuracy', p_p: 'punt_power', p_a: 'punt_accuracy' };
    const baseStats = { 'QB': { spd: 75, str: 65, agi: 80, th_p: 85, th_a: 85, awr: 85 }, 'RB': { spd: 90, str: 80, agi: 90, car: 90, cat: 70, awr: 75 }, 'WR': { spd: 92, str: 68, agi: 92, car: 60, cat: 90, rr: 90 }, 'TE': { spd: 82, str: 83, agi: 80, cat: 85, rb: 70, pb: 65 }, 'OL': { spd: 65, str: 92, agi: 65, awr: 80, rb: 90, pb: 90 }, 'DL': { spd: 75, str: 90, agi: 75, tkl: 85, pr: 88, bs: 88 }, 'LB': { spd: 85, str: 83, agi: 85, tkl: 90, z_cov: 80, pr: 75 }, 'DB': { spd: 93, str: 68, agi: 91, tkl: 70, m_cov: 90, z_cov: 90 }, 'K': { k_p: 90, k_a: 90 }, 'P': { p_p: 90, p_a: 90 }, 'LS': { pb: 70, rb: 70 } };
    
    const getPosGroup = (pos) => {
        if (['QB', 'RB', 'WR', 'TE', 'OL'].includes(pos)) return 'Offense';
        if (['DL', 'LB', 'DB'].includes(pos)) return 'Defense';
        return 'Special Teams';
    };

    const generatePlayer = (playerId, teamId, pos, rank) => {
        const player = Array(headers.length).fill(50);
        const base = baseStats[pos] || {};
        player[headers.indexOf('player_id')] = playerId;
        player[headers.indexOf('first_name')] = firstNames[Math.floor(Math.random() * firstNames.length)];
        player[headers.indexOf('last_name')] = lastNames[Math.floor(Math.random() * lastNames.length)];
        player[headers.indexOf('team_id')] = teamId;
        player[headers.indexOf('age')] = Math.floor(21 + 15 * Math.random());
        player[headers.indexOf('position')] = pos;
        player[headers.indexOf('position_group')] = getPosGroup(pos);
        player[headers.indexOf('depth_chart_rank')] = rank;
        player[headers.indexOf('status')] = 'Active';
        player[headers.indexOf('jersey_num')] = Math.floor(1 + 99 * Math.random());

        for (const statKey in base) {
            const headerName = statMap[statKey];
            const headerIndex = headers.indexOf(headerName);
            if (headerIndex !== -1) {
                const baseValue = base[statKey];
                const finalValue = baseValue + (Math.floor(Math.random() * 11) - 5) - (rank * 3); // Starters are better
                player[headerIndex] = Math.min(99, Math.max(40, finalValue));
            }
        }
        
        const keyStatIndices = Object.keys(base).map(statKey => headers.indexOf(statMap[statKey])).filter(index => index !== -1);
        const keyStatValues = keyStatIndices.map(index => player[index]);
        const overall = keyStatValues.length > 0 ? keyStatValues.reduce((a, b) => a + b, 0) / keyStatValues.length : 50;
        player[headers.indexOf('overall')] = Math.round(overall);
        return player;
    };

    let playerData = [];
    let currentPlayerId = 1001;
    for (let teamId = 1; teamId <= 2; teamId++) {
        for (const pos in rosterComposition) {
            const totalAtPos = rosterComposition[pos];
            const startersAtPos = numStarters[pos] || 0;
            for (let i = 1; i <= totalAtPos; i++) {
                const rank = (i <= startersAtPos) ? 1 : 2;
                playerData.push(generatePlayer(currentPlayerId++, teamId, pos, rank));
            }
        }
    }

    const values = [headers, ...playerData];
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground(CONFIG.colors.HEADER_BG).setFontColor(CONFIG.colors.HEADER_FONT);
    sheet.autoResizeColumns(1, headers.length);
    sheet.setFrozenColumns(9);
}

function setupPenaltySheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.PENALTIES);
    sheet.setFrozenRows(1);
    const headers = ['foul_code', 'foul_name', 'penalty_yards', 'is_automatic_first_down', 'is_loss_of_down'];
    const penaltyData = [
        ['FS', 'False Start', 5, false, false],
        ['DOG', 'Delay of Game', 5, false, false],
        ['OH', 'Offensive Holding', 10, false, false],
        ['DPI', 'Defensive Pass Interference', 'Spot Foul', true, false],
        ['RTP', 'Roughing the Passer', 15, true, false]
    ];
    const values = [headers, ...penaltyData];
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground(CONFIG.colors.PENALTY_BG).setFontColor(CONFIG.colors.HEADER_FONT);
    sheet.getRange(2, 4, penaltyData.length, 2).insertCheckboxes();
    sheet.autoResizeColumns(1, headers.length);
}

function setupActiveLineupSheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.ACTIVE_LINEUP);
    sheet.setFrozenRows(2);
    sheet.getRange('B1:F1').merge().setValue('ACTIVE LINEUP (STARTERS)').setHorizontalAlignment('center').setFontWeight('bold').setBackground(CONFIG.colors.HEADER_BG).setFontColor(CONFIG.colors.HEADER_FONT);
    sheet.getRange('B2').setValue('Team 1 - Offense').setBackground(CONFIG.colors.HOME_TEAM_BG);
    sheet.getRange('C2').setValue('Team 1 - Defense').setBackground(CONFIG.colors.HOME_TEAM_BG);
    sheet.getRange('E2').setValue('Team 2 - Offense').setBackground(CONFIG.colors.AWAY_TEAM_BG);
    sheet.getRange('F2').setValue('Team 2 - Defense').setBackground(CONFIG.colors.AWAY_TEAM_BG);
    sheet.getRange('B2:F2').setFontColor(CONFIG.colors.HEADER_FONT).setFontWeight('bold').setHorizontalAlignment('center');
    const positions = [['QB'], ['RB'], ['WR1'], ['WR2'], ['WR3'], ['TE'], ['LT'], ['LG'], ['C'], ['RG'], ['RT']]; // Simplified
    sheet.getRange('A3:A13').setValues(positions).setFontWeight('bold');
    sheet.getRange('D3:D13').setValues(positions).setFontWeight('bold');
    sheet.getRange('A1:F13').setVerticalAlignment('middle');
    sheet.autoResizeColumns(1, 6);
}

/**
 * [REVISED] Adds new play calls and the new score fields to the state.
 */
function setupPlaySimSheet(ss){
  const sheet = prepareSheet(ss, CONFIG.sheets.PLAY_SIM);
  sheet.setFrozenRows(1);
  sheet.getRange("A1:B1").setValues([["Offense Playcall", "Defense Playcall"]]).setBackground(CONFIG.colors.HEADER_BG).setFontColor(CONFIG.colors.HEADER_FONT).setFontWeight("bold");
  
  // [NEW] Added Field Goal and Punt
  const offensePlays=["Inside Run", "Outside Run", "Short Pass", "Deep Pass", "Field Goal", "Punt"];
  sheet.getRange("A2").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(offensePlays, true).build());
  
  const defensePlays=["4-3 Cover 2", "3-4 Cover 3", "Man Blitz", "Zone Blitz", "Field Goal Block"];
  sheet.getRange("B2").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(defensePlays, true).build());
  
  // [NEW] Added home_score and away_score
  const stateHeaders = [
    "home_team_id", "away_team_id", "possession_team_id", "quarter", 
    "game_clock_sec", "down", "distance_to_go", "ball_on_yardline",
    "home_score", "away_score"
  ];
  sheet.getRange(4, 1, 1, stateHeaders.length).setValues([stateHeaders]).setBackground("#434343").setFontColor("#FFFFFF").setFontWeight("bold");
  sheet.getRange(5, 1, 1, stateHeaders.length).setBackground("#efefef");
}

function setupGameStateSheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.GAME_STATE);
    
    sheet.getRange("A1:G8").clear(); 
    sheet.getRange("A1:G1").merge().setValue("🏈 GAME DASHBOARD 🏈").setHorizontalAlignment("center").setFontWeight("bold").setBackground(CONFIG.colors.HEADER_BG).setFontColor(CONFIG.colors.HEADER_FONT);
    sheet.getRange("A3:C3").setValues([["HOME", "SCORE", "TIMEOUTS"]]).setFontWeight("bold");
    sheet.getRange("A4:C4").setBackground("#e9effb");
    sheet.getRange("E3:G3").setValues([["AWAY", "SCORE", "TIMEOUTS"]]).setFontWeight("bold");
    sheet.getRange("E4:G4").setBackground("#fbe9e9");
    sheet.getRange("A6:F6").setValues([["POSSESSION", "BALL ON", "DOWN", "TO GO", "QUARTER", "GAME CLOCK"]]).setFontWeight("bold");
    sheet.getRange("A7:F7").setBackground("#efefef");

    sheet.getRange("A9").setValue("📜 PLAY-BY-PLAY LOG").setFontWeight("bold");
    sheet.getRange("A10:G10").setValues([["Clock", "Poss", "Down", "To Go", "Ball On", "Play Call", "Result"]]).setFontWeight("bold");

    sheet.setFrozenRows(10);
}

/**
 * [NEW] Creates the game_log sheet.
 */
function setupGameLogSheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.GAME_LOG);
    sheet.setFrozenRows(1);
    const headers = [["Game Date", "Home Team", "Home Score", "Away Team", "Away Score", "Result"]];
    sheet.getRange("A1:F1").setValues(headers).setFontWeight("bold").setBackground(CONFIG.colors.HEADER_BG).setFontColor(CONFIG.colors.HEADER_FONT);
    sheet.autoResizeColumns(1, headers.length);
}

function setupStrategySheet(ss) {
    const sheet = prepareSheet(ss, CONFIG.sheets.STRATEGY);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:F1").merge().setValue("📋 TEAM STRATEGY & GAMEPLAN 📋").setHorizontalAlignment("center").setFontWeight("bold").setBackground(CONFIG.colors.HEADER_BG).setFontColor(CONFIG.colors.HEADER_FONT);

    // --- Offensive Strategy ---
    sheet.getRange("A3").setValue("Offensive Gameplan").setFontWeight("bold");
    sheet.getRange("A4:B4").setValues([["Play Style:", "Balanced"]]);
    const offStyles = ["Balanced", "Pass Heavy", "Run Heavy"];
    const offRule = SpreadsheetApp.newDataValidation().requireValueInList(offStyles, true).build();
    sheet.getRange("B4").setDataValidation(offRule);

    // --- Defensive Strategy ---
    sheet.getRange("D3").setValue("Defensive Gameplan").setFontWeight("bold");
    sheet.getRange("D4:E4").setValues([["Aggressiveness:", "Standard"]]);
    const defStyles = ["Conservative", "Standard", "Aggressive (Blitz Heavy)"];
    const defRule = SpreadsheetApp.newDataValidation().requireValueInList(defStyles, true).build();
    sheet.getRange("E4").setDataValidation(defRule);

    // --- Substitutions (Placeholder) ---
    sheet.getRange("A6").setValue("Substitutions (Depth Chart Management)").setFontWeight("bold");
    sheet.getRange("A7:C7").setValues([["Position", "Current Starter", "Substitute With..."]]).setFontWeight("bold");
    sheet.getRange("A8:B10").setValues([
      ["QB", `=IFERROR(FILTER(players!B2:B & " " & players!C2:C, players!D2:D = 1, players!F2:F="QB", players!H2:H=1), "N/A")`],
      ["RB", `=IFERROR(FILTER(players!B2:B & " " & players!C2:C, players!D2:D = 1, players!F2:F="RB", players!H2:H=1), "N/A")`],
      ["WR", `=IFERROR(FILTER(players!B2:B & " " & players!C2:C, players!D2:D = 1, players!F2:F="WR", players!H2:H=1), "N/A")`]
    ]);

    sheet.getRange("A4:E10").setBorder(true, true, true, true, null, null, null, SpreadsheetApp.BorderStyle.SOLID);
    sheet.autoResizeColumns(1, 5);
}