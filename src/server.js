const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { google } = require("googleapis");
const app = express();
require("dotenv").config();
const gmail = google.gmail({ version: "v1" });
const credentials = require("../credentials.json");

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
// Apply authentication middleware to all routes in emailsRouter except /google-auth

// Routes
app.use("/google-auth", authRouter);
app.use("/emails", emailsRouter);
app.use("/notes", notesRouter);
app.use("/tasks", tasksRouter);
app.use("/events", eventRouter);
app.use("/meet", meetRouter);
app.use("/chat", chatRouter);

app.post("/setup-push-notifications", async (req, res) => {
  try {
    const data = req.body.message.data;
    const decodedData = Buffer.from(data, "base64").toString();
    console.log("Received notification:", decodedData);

    // Parse the notification
    const notification = google.gmail_v1.users.messages.parseHistory({
      history: JSON.parse(decodedData),
    });
    const message = notification.messages[0];

    // Retrieve the message using the Gmail API
    const auth = new google.auth.OAuth2({
      keyFile: credentials,
      scopes: "https://www.googleapis.com/auth/gmail.readonly",
    });
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });

    const email = response.data;
    console.log("Email:", email);

    res.status(201).send("New email received");
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
