// blockSeats.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/cinema.db');

const seatsToBlock = [
  { row: 'B', seat_number: 1 },
  { row: 'C', seat_number: 1 }
];

let completed = 0;
seatsToBlock.forEach(seat => {
  db.run(
    "UPDATE seat_layout SET is_blocked=1 WHERE screen_id=1 AND row=? AND seat_number=?",
    [seat.row, seat.seat_number],
    function(err) {
      if (err) {
        console.error(`Error blocking ${seat.row}${seat.seat_number}:`, err.message);
      } else {
        console.log(`Blocked ${seat.row}${seat.seat_number}`);
      }
      completed++;
      if (completed === seatsToBlock.length) db.close();
    }
  );
}); 