const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'todos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create table if not exists
        // Create Users table
        const sqlCreateUsers = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.run(sqlCreateUsers, (err) => {
            if (err) {
                console.error("Error creating users table:", err.message);
            } else {
                // Create Todos table (with user_id)
                // Note: Ideally we would migrate, but for this task we might just check if it exists
                // For now, let's keep it simple. If we need to add user_id to existing, we might need an ALTER
                // But simply creating if not exists won't add the column.
                // Let's try to add the column if the table exists, just to be safe without dropping data if possible,
                // or just CREATE IF NOT EXISTS with the new schema for fresh setups.

                const sqlCreateTodos = `
                    CREATE TABLE IF NOT EXISTS todos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        project_id INTEGER,
                        title TEXT NOT NULL,
                        priority TEXT,
                        dueDate TEXT,
                        completed INTEGER DEFAULT 0,
                        FOREIGN KEY(user_id) REFERENCES users(id),
                        FOREIGN KEY(project_id) REFERENCES projects(id)
                    )
                `;

                db.run(sqlCreateTodos, (err) => {
                    if (err) {
                        console.error("Error creating todos table:", err.message);
                    } else {
                        // Attempt to add user_id column if it doesn't exist
                        db.run("ALTER TABLE todos ADD COLUMN user_id INTEGER references users(id)", (err) => { });
                        // Add project_id column if it doesn't exist
                        db.run("ALTER TABLE todos ADD COLUMN project_id INTEGER references projects(id)", (err) => { });
                    }
                });

                // ... (preference columns logic stays same)
                const userPreferenceColumns = [
                    "ALTER TABLE users ADD COLUMN profile_pic TEXT",
                    "ALTER TABLE users ADD COLUMN notify_push INTEGER DEFAULT 0",
                    "ALTER TABLE users ADD COLUMN notify_email INTEGER DEFAULT 0",
                    "ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'",
                    "ALTER TABLE users ADD COLUMN default_view TEXT DEFAULT 'all'",
                    "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'"
                ];

                userPreferenceColumns.forEach(sql => {
                    db.run(sql, (err) => { });
                });

                // Create Projects table
                const sqlCreateProjects = `
                    CREATE TABLE IF NOT EXISTS projects (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        name TEXT NOT NULL,
                        description TEXT,
                        completed INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(user_id) REFERENCES users(id)
                    )
                `;
                db.run(sqlCreateProjects, (err) => {
                    if (err) {
                        console.error("Error creating projects table:", err.message);
                    } else {
                        // Add completed column if it doesn't exist
                        db.run("ALTER TABLE projects ADD COLUMN completed INTEGER DEFAULT 0", (err) => { });
                    }
                });
            }
        });


    }
});

module.exports = db;
