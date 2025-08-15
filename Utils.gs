/**
 * @fileoverview Utility functions used across the project.
 */

function createObjectFromRow(row, headers) {
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = row[i];
  });
  return obj;
}

const Time = {
  fromMilitary: (timeStr) => {
    if (typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
  },
  fromSeconds: (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      toMilitary: () => `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }
};