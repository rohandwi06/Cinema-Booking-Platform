const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'cinema.db');
const db = new sqlite3.Database(dbPath);

const defaultLayout = JSON.stringify({
  regular: { rows: ['A', 'B', 'C', 'D'], seatsPerRow: 10 },
  premium: { rows: ['E', 'F'], seatsPerRow: 8 },
  recliner: { rows: ['G'], seatsPerRow: 6 }
});

function isValidJson(str) {
  try {
    const obj = JSON.parse(str);
    return typeof obj === 'object' && obj !== null;
  } catch (e) {
    return false;
  }
}

function fixSeatLayouts() {
  db.all('SELECT id as showId, screen_id as screenId FROM shows', [], (err, shows) => {
    if (err) throw err;
    let pending = shows.length;
    let inserted = 0;
    let updated = 0;
    let already = 0;
    const results = [];
    if (pending === 0) {
      console.log('No shows found.');
      db.close();
      return;
    }
    shows.forEach(({ showId, screenId }) => {
      db.get('SELECT layout_data FROM seat_layouts WHERE screen_id = ?', [screenId], (err, row) => {
        if (err) throw err;
        if (!row) {
          db.run('INSERT INTO seat_layouts (screen_id, layout_data) VALUES (?, ?)', [screenId, defaultLayout], (err) => {
            if (err) throw err;
            inserted++;
            results.push({ showId, screenId, action: 'INSERTED' });
            if (--pending === 0) finish();
          });
        } else if (!row.layout_data || !isValidJson(row.layout_data)) {
          db.run('UPDATE seat_layouts SET layout_data = ? WHERE screen_id = ?', [defaultLayout, screenId], (err) => {
            if (err) throw err;
            updated++;
            results.push({ showId, screenId, action: 'UPDATED' });
            if (--pending === 0) finish();
          });
        } else {
          already++;
          results.push({ showId, screenId, action: 'OK' });
          if (--pending === 0) finish();
        }
      });
    });
    function finish() {
      console.log('ShowId | ScreenId | Action');
      console.log('--------------------------');
      results.forEach(r => {
        console.log(`${r.showId}      | ${r.screenId}       | ${r.action}`);
      });
      console.log(`\nInserted: ${inserted}, Updated: ${updated}, Already OK: ${already}`);
      db.close();
    }
  });
}

fixSeatLayouts(); 