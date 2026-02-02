const express = require("express");
const router = express.Router();
const db = require("../db/database");

// Get all todos
router.get("/", (req, res) => {
    const sql = "SELECT * FROM todos ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Add a todo
router.post("/", (req, res) => {
    const { title, priority, dueDate, completed } = req.body;
    const sql = "INSERT INTO todos (title, priority, dueDate, completed) VALUES (?,?,?,?)";
    const params = [title, priority, dueDate, completed ? 1 : 0];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: {
                id: this.lastID,
                title,
                priority,
                dueDate,
                completed
            }
        });
    });
});

// Update a todo
router.put("/:id", (req, res) => {
    const { title, priority, dueDate, completed } = req.body;
    const sql = "UPDATE todos SET title = COALESCE(?, title), priority = COALESCE(?, priority), dueDate = COALESCE(?, dueDate), completed = COALESCE(?, completed) WHERE id = ?";
    const params = [title, priority, dueDate, completed !== undefined ? (completed ? 1 : 0) : undefined, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

// Delete a todo
router.delete("/:id", (req, res) => {
    const sql = "DELETE FROM todos WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: "deleted",
            changes: this.changes
        });
    });
});

module.exports = router;