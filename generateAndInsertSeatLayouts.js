const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'cinema.db');
const db = new sqlite3.Database(dbPath);

const defaultLayout = JSON.stringify({
  regular: { rows: ['A', 'B', 'C', 'D'], seatsPerRow: 10 },
  premium: { rows: ['E', 'F'], seatsPerRow: 8 },
  recliner: { rows: ['G'], seatsPerRow: 6 }
});

function ensureSeatLayouts() {
  db.all('SELECT DISTINCT screen_id FROM shows', [], async (err, screens) => {
    if (err) throw err;
    let pending = screens.length;
    if (pending === 0) {
      db.close();
      return;
    }
    screens.forEach(({ screen_id }) => {
      db.get('SELECT * FROM seat_layouts WHERE screen_id = ?', [screen_id], (err, row) => {
        if (err) throw err;
        if (!row) {
          db.run('INSERT INTO seat_layouts (screen_id, layout_data) VALUES (?, ?)', [screen_id, defaultLayout], (err) => {
            if (err) throw err;
            console.log(`Inserted default seat layout for screen_id ${screen_id}`);
            if (--pending === 0) db.close();
          });
        } else {
          console.log(`Seat layout already exists for screen_id ${screen_id}`);
          if (--pending === 0) db.close();
        }
      });
    });
  });
}

ensureSeatLayouts(); 