const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'todos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create table if not exists
        const sqlCreate = `
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                priority TEXT,
                dueDate TEXT,
                completed INTEGER DEFAULT 0
            )
        `;

        db.run(sqlCreate, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            }
        });
    }
});

module.exports = db;
