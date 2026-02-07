// 1️⃣ Import dependencies
const express = require("express");
const cors = require("cors");
const path = require("path");
const todosRouter = require("./routes/todos");
const authRouter = require("./routes/auth");
const projectsRouter = require("./routes/projects");

// 2️⃣ Initialize Express app
const app = express();

// 3️⃣ Middleware
app.use(cors());           // allow frontend on different port to talk
app.use(express.json());   // parse JSON request bodies
app.use(express.static(path.join(__dirname, '../../frontend')));

// 4️⃣ Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/todo.html'));
});
app.use("/auth", authRouter);
app.use("/todos", todosRouter);
app.use("/projects", projectsRouter);

// 5️⃣ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});