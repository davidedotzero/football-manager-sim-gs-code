/**
 * @fileoverview Controller for managing team rosters and active lineups.
 */
function updateActiveLineup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const playersSheet = ss.getSheetByName(CONFIG.sheets.PLAYERS);
  const lineupSheet = ss.getSheetByName(CONFIG.sheets.ACTIVE_LINEUP);

  if (!playersSheet || !lineupSheet) throw new Error("Missing players or active_lineup sheet.");

  lineupSheet.getRange("B3:C13").clearContent();
  lineupSheet.getRange("E3:F13").clearContent();

  const allPlayersValues = playersSheet.getRange(2, 1, playersSheet.getLastRow() - 1, playersSheet.getLastColumn()).getValues();
  const headers = playersSheet.getRange(1, 1, 1, playersSheet.getLastColumn()).getValues()[0];

  const offensePositions = ['QB', 'RB', 'WR', 'WR', 'WR', 'TE', 'OL', 'OL', 'OL', 'OL', 'OL'];
  const defensePositions = ['DL', 'DL', 'DL', 'DL', 'LB', 'LB', 'LB', 'DB', 'DB', 'DB', 'DB'];

  const populateTeamLineup = (teamId, offenseCol, defenseCol) => {
    const teamStarters = allPlayersValues.filter(p => p[headers.indexOf('team_id')] == teamId && p[headers.indexOf('depth_chart_rank')] == 1);
    const starterObjects = teamStarters.map(p => createObjectFromRow(p, headers));

    const fillSlots = (positionOrder) => {
      const lineup = [];
      const usedPlayerIds = new Set();
      for (const pos of positionOrder) {
        const foundPlayer = starterObjects.find(p => p.position === pos && !usedPlayerIds.has(p.player_id));
        if (foundPlayer) {
          usedPlayerIds.add(foundPlayer.player_id);
          lineup.push([`${foundPlayer.first_name} ${foundPlayer.last_name} (${foundPlayer.overall})`]);
        } else {
          lineup.push(["-EMPTY SLOT-"]);
        }
      }
      return lineup;
    };
    
    const offenseLineup = fillSlots(offensePositions);
    const defenseLineup = fillSlots(defensePositions);
    
    lineupSheet.getRange(3, offenseCol, offenseLineup.length, 1).setValues(offenseLineup);
    lineupSheet.getRange(3, defenseCol, defenseLineup.length, 1).setValues(defenseLineup);
  };
  
  populateTeamLineup(1, 2, 3);
  populateTeamLineup(2, 5, 6);
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Active lineups have been updated.', 'Roster Update', 5);
}