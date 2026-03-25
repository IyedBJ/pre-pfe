const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const uploadRouter = require("./routes/upload");
const fs = require('fs');
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const clientRoutes = require("./routes/clients");
const projectRoutes = require("./routes/projects");
const invoiceRoutes = require("./routes/invoices");
const { protect } = require('./middleware/authMiddleware');
if (!fs.existsSync("uploads/")) {
    fs.mkdirSync("uploads/");
}
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Hello World!'));
app.use("/api", uploadRouter);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/invoices", invoiceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
