const express = require("express");
const morgan = require("morgan");
const http = require("http");
const cors = require("cors");
const { google } = require("googleapis");
const app = express();
require("dotenv").config();

const initSocketIO = require("../helpers/socketio");

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(morgan("tiny"));
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;

const authRouter = require("../routes/auth");
const emailsRouter = require("../routes/emails");
const notesRouter = require("../routes/notes");
const tasksRouter = require("../routes/tasks");
const eventRouter = require("../routes/events");
const meetRouter = require("../routes/meet");
const chatRouter = require("../routes/chat");
const contactsRouter = require("../routes/contact");
const authenticateToken = require("../helpers/AuthenticateToken");
// Apply authentication middleware to all routes in emailsRouter except /google-auth

// Routes
app.use("/google-auth", authRouter);
app.use("/emails", authenticateToken, emailsRouter);
app.use("/notes", notesRouter);
app.use("/tasks", tasksRouter);
app.use("/events", eventRouter);
app.use("/meet", meetRouter);
app.use("/chat", chatRouter);
app.use("/contacts", authenticateToken, contactsRouter);

const server = http.createServer(app);

// ... other middleware and routes ...

initSocketIO(server);

app.post("/setup-push-notifications", async (req, res) => {
  try {
    const data = req.body.message.data;
    const decodedData = Buffer.from(data, "base64").toString();
    console.log("Received notification:", decodedData);

    res.status(201).send("Message delivered successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing notification");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

module.exports = app;
