require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

// Route imports
const attendanceRoutes = require("./routes/Attendance");
const employeeIDCardRoutes = require("./routes/EmployeeIDCard");
const leaveRoute = require("./routes/Leave");
const userRouter = require("./routes/User");
const orgRoute = require("./routes/Organisation");
const employeeRoute = require("./routes/Employee");
const departmentRoute = require("./routes/Department");
const docRoutes = require("./routes/Document");
const AnnouncementsRoute = require("./routes/Announements");
const ResetPassword = require("./routes/ResetPassword");
const ConactRoute = require("./routes/Contact");
const DATABASE = require("./database/database");


// Initialize Express app
const app = express();

// Express middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
DATABASE();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'SEMS API',
    uptime: process.uptime()
  });
});

// API routes
app.use("/api", userRouter);
app.use("/api/org", orgRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/depart", departmentRoute);
app.use("/api/id-cards", employeeIDCardRoutes);
app.use("/api/attend", attendanceRoutes);
app.use("/api/leave", leaveRoute);
app.use("/api/announcement", AnnouncementsRoute)
app.use("/api/doc", docRoutes);
app.use("/api/reset", ResetPassword);
app.use("/api/contact", ConactRoute);



// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});