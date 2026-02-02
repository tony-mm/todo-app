// 1️⃣ Import dependencies
const express = require("express");
const cors = require("cors");
const todosRouter = require("./routes/todos");

// 2️⃣ Initialize Express app
const app = express();

// 3️⃣ Middleware
app.use(cors());           // allow frontend on different port to talk
app.use(express.json());   // parse JSON request bodies

// 4️⃣ Routes
app.use("/todos", todosRouter);

// 5️⃣ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});