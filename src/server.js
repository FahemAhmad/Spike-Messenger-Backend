const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
require("dotenv").config();

const authenticateToken = require("../helpers/AuthenticateToken");

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(morgan("tiny"));
app.use(express.json());
const gmail = require("../push-notifications/gmail");

const authRouter = require("../routes/auth");
const emailsRouter = require("../routes/emails");
const notesRouter = require("../routes/notes");
const tasksRouter = require("../routes/tasks");
const eventRouter = require("../routes/events");
const meetRouter = require("../routes/meet");
const chatRouter = require("../routes/chat");
// Apply authentication middleware to all routes in emailsRouter except /google-auth

// Routes
app.use("/google-auth", authRouter);
app.use("/emails", emailsRouter);
app.use("/notes", notesRouter);
app.use("/tasks", tasksRouter);
app.use("/events", eventRouter);
app.use("/meet", meetRouter);
app.use("/chat", chatRouter);

app.post("/setup-push-notifications", authenticateToken, (req, res) => {
  const auth = req.user.tokens;
  gmail.setupPushNotifications(auth);
  res.send("Push notification set up successfully");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

module.exports = app;
