const express = require("express");
const router = express.Router();
const db = require("../db/database");
const verifyToken = require("../middleware/authMiddleware");

// Apply middleware to all routes in this router
router.use(verifyToken);

// Get all projects for the logged-in user with task counts
router.get("/", (req, res) => {
    const sql = `
        SELECT p.*, 
        (SELECT COUNT(*) FROM todos WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM todos WHERE project_id = p.id AND completed = 1) as completed_count
        FROM projects p 
        WHERE p.user_id = ? 
        ORDER BY p.id DESC
    `;
    db.all(sql, [req.userId], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Add a project
router.post("/", (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Project name is required" });
    }
    const sql = "INSERT INTO projects (name, description, user_id) VALUES (?,?,?)";
    const params = [name, description, req.userId];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: {
                id: this.lastID,
                name,
                description,
                user_id: req.userId
            }
        });
    });
});

// Delete a project
router.delete("/:id", (req, res) => {
    const sql = "DELETE FROM projects WHERE id = ? AND user_id = ?";
    db.run(sql, [req.params.id, req.userId], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Project not found or unauthorized" });
        }
        res.json({
            message: "deleted",
            changes: this.changes
        });
    });
});

// Export all user data
router.get("/export-data", (req, res) => {
    const data = {};
    db.all("SELECT * FROM projects WHERE user_id = ?", [req.userId], (err, projects) => {
        data.projects = projects || [];
        db.all("SELECT * FROM todos WHERE user_id = ?", [req.userId], (err, todos) => {
            data.todos = todos || [];
            res.json({ message: "success", data });
        });
    });
});

// Clear all data
router.post("/clear-data", (req, res) => {
    const { type } = req.body; // 'tasks', 'projects', or 'all'
    if (type === 'tasks' || type === 'all') {
        db.run("DELETE FROM todos WHERE user_id = ?", [req.userId]);
    }
    if (type === 'projects' || type === 'all') {
        db.run("DELETE FROM projects WHERE user_id = ?", [req.userId]);
    }
    res.json({ message: "Data cleared successfully" });
});

module.exports = router;
