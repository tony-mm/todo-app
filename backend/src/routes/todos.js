const express = require("express");
const router = express.Router();
const db = require("../db/database");
const verifyToken = require("../middleware/authMiddleware");

// Apply middleware to all routes in this router
router.use(verifyToken);

// Get all todos for relevant user (optional filter by project_id)
router.get("/", (req, res) => {
    let projectId = req.query.project_id;
    let sql = `
        SELECT t.*, p.name as project_name 
        FROM todos t 
        LEFT JOIN projects p ON t.project_id = p.id 
        WHERE t.user_id = ?
    `;
    let params = [req.userId];

    // If a specific project_id is provided, filter by it.
    // Otherwise, show ALL tasks (unified dashboard)
    if (projectId !== undefined && projectId !== 'null' && projectId !== 'undefined' && projectId !== '') {
        sql += " AND t.project_id = ?";
        params.push(projectId);
    }

    sql += " ORDER BY t.id DESC";

    db.all(sql, params, (err, rows) => {
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
    const { title, priority, dueDate, completed, project_id } = req.body;

    const sql = "INSERT INTO todos (title, priority, dueDate, completed, user_id, project_id) VALUES (?,?,?,?,?,?)";
    const params = [
        title,
        priority || 'low',
        dueDate || null,
        completed ? 1 : 0,
        req.userId,
        (project_id && project_id !== 'null') ? project_id : null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        const newTodoId = this.lastID;

        // If it's a project task, update the project status
        if (project_id && project_id !== 'null') {
            updateProjectStatus(project_id);
        }

        res.json({
            message: "success",
            data: {
                id: newTodoId,
                title,
                priority: priority || 'low',
                dueDate: dueDate || null,
                completed: !!completed,
                user_id: req.userId,
                project_id: (project_id && project_id !== 'null') ? project_id : null
            }
        });
    });
});

// Update a todo
router.put("/:id", (req, res) => {
    const { title, priority, dueDate, completed } = req.body;

    const sql = "UPDATE todos SET title = COALESCE(?, title), priority = COALESCE(?, priority), dueDate = COALESCE(?, dueDate), completed = COALESCE(?, completed) WHERE id = ? AND user_id = ?";
    const params = [title, priority, dueDate, completed !== undefined ? (completed ? 1 : 0) : undefined, req.params.id, req.userId];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Todo not found or unauthorized" });
        }

        // Always check if we need to update a project status
        db.get("SELECT project_id FROM todos WHERE id = ? AND user_id = ?", [req.params.id, req.userId], (err, row) => {
            if (row && row.project_id) {
                updateProjectStatus(row.project_id);
            }
        });

        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

// Delete a todo
router.delete("/:id", (req, res) => {
    // Get project_id before deleting
    db.get("SELECT project_id FROM todos WHERE id = ? AND user_id = ?", [req.params.id, req.userId], (err, row) => {
        const projectId = row ? row.project_id : null;

        const sql = "DELETE FROM todos WHERE id = ? AND user_id = ?";
        db.run(sql, [req.params.id, req.userId], function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Todo not found or unauthorized" });
            }

            if (projectId) {
                updateProjectStatus(projectId);
            }

            res.json({
                message: "deleted",
                changes: this.changes
            });
        });
    });
});

// Helper function to update project completion status
function updateProjectStatus(projectId) {
    if (!projectId) return;

    db.all("SELECT completed FROM todos WHERE project_id = ?", [projectId], (err, tasks) => {
        if (err) return;

        let allCompleted = 0;
        if (tasks && tasks.length > 0) {
            allCompleted = tasks.every(t => t.completed === 1) ? 1 : 0;
        } else {
            // No tasks left? Reset to 0
            allCompleted = 0;
        }

        db.run("UPDATE projects SET completed = ? WHERE id = ?", [allCompleted, projectId]);
    });
}

module.exports = router;