const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { google } = require("googleapis");
const app = express();
require("dotenv").config();
const gmail = google.gmail({ version: "v1" });

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(morgan("tiny"));
app.use(express.json());

// const { PubSub } = require("@google-cloud/pubsub");

// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;
// const REDIRECT_URI = process.env.REDIRECT_URI;
// const SCOPES = process.env.SCOPES;

// const oauth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI,
//   SCOPES
// );

// const pubsub = new PubSub({
//   projectId: "spike-messenger"
// });

// const subscription = pubsub.subscription(
//   "projects/spike-messenger/subscriptions/gmail-push-sub"
// );

// subscription.on("message", async (message) => {
//   const emailId = message.json().message.data.emailId;

//   const auth = new google.auth.GoogleAuth({
//     credentials: {
//       client_email: "spike-messenge@spike-messenger.iam.gserviceaccount.com",
//       private_key:
//         "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC6MhYcxGfHPa3W\ntILTnSyfmZ4l5ImirssmuE/lCQRsZRcGjuXpr2ZM9pjlBqwmesBji+ROz5o0SaPs\n0Wg/RskrOJxi3mAwGV2Ngvi8IlgC2jAtvw7/lu8UX0Flge7sNGTLs6FA88lKVmke\nu0pp+aGguckTWmdMjio/JNkgAgmTcXmsxLwWBWff0fcSiF1p4nToX6xmOPUa3CUP\nhdZPX3MN5E8NSUajpHrmz+rL2lQ52CxAX4KaJX5U7y7u08OqTezvYowYys10hCKh\nv8bC/IhF0OFPmraOxN479QFD8sjCO//RetfazpWKPaz4PSU34TysDU9s59c6wOyV\nd7UfVfiFAgMBAAECggEAFXL9pHS6YR5phJP+L4h/V9ISK4VR7Fa8el+90cGh1nwo\nFI5ToqxHrv1dYaIiJLtRUbu6IkYSGoySgLki4Yndqh1MZACquKpuDNuV8dOhqzpy\nqw0ZGjfLSjUq9cRBFMl4WcBTXDB5SMH+5sERR8yvt4c6HaugE2vxJp2vvDCKj9x4\nveOq1Jh75TKSHoZJQdGuUUq+fCWkaGSblJeH9b/AHo2s+W+ruQ1eeVCgoz7bF7Z6\nwaPC1h8CultVMQk3LwxvEtjgWtxS2EvAsnGK6nOcm706QSQUbgcZe1Ha2Z8mmHha\nbhbfzYthrCuMolp4Xnwqo6sC9ejg4KIuddPis8sbxQKBgQD+KlSQWYIi82KhlaZu\nUmdnL9GjkLBF2trF1ZqVziQooNCphB/q9nq8zE2l/yqFxpcFqrWVvsxp9rMBlkMI\nEVwEQ++3JdWVYzx+Ky+yxAPyGORj3rS3mswOr9uuea36+CP5xVp6jIpkczpKIsh6\ngvPdgIPG/qWroxES3oE5/ij3FwKBgQC7iifOxa4aG4p+1Kic55HV7jr3LsFCb3/u\nh3+bVkGi2ZG2f2hpaFYfZggV8SIc340RYFSPiFVJcgwKvxpfVYCGakcPXxqYsqSN\ngA949xj9dgZ/ja/bryoTAA432bJ9zNeZrrhTHm/7tccl6hGYQwsbBN7WYNvRdPk/\nnDsg12WOwwKBgCD761eEVjAk98LSgfPFO+gXO5SHfWjDWyrbaqFQTD79h7bID8BV\nVl5UASuurp0HxaeVnNUfGrYRru9gybgtUIy5KE3TWiF17G7POfRwHbb4ZgNT7o35\nR8wMJG1DG0H7m+eZJgHLZVZd4c2nL+8+OVmgiPl1KJjao6eYOpsFEdnnAoGAd5AO\n7P6Ojsp8M3v0u4PPMCqfoTNHtslLMJFmQ2xskBxRj54OvRTtwzrTcNm4u9uyHh/i\nCVgLt7VkA/3uHFVwiUF8aEpjtHJAAo5gTuiKIB186xkzwsUb990TM3wxFY7g7XO8\nxBElp74uZvehnAcyL1mdj+NUgWcn+OvrrnZkou0CgYAe94rCK5ovULphZ+exisP2\nz5um/f9IyszId8wg5iJ/tPawkzLBinxtHy9eiHDBxHaBpBCZsV6efkJ0ZouRUvdr\ndCOSjJzNRCw0KBzDeuI/j8KBo4nhE6QGE2Vq0iYLgTfEAAvPJQkfjSSx8oFpR4y2\nPXJU1gQuQBJWBjOqfg9wqA==\n-----END PRIVATE KEY-----\n",
//     },
//     scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
//   });
//   const response = await gmail.users.messages.get({
//     auth,
//     userId: "me",
//     id: emailId,
//   });
//   // Send the email data to your React app using socket.io or another method you prefer
//   console.log(response.data);
//   message.ack();
// });

// const topicName = `projects/spike-messenger/topics/gmail-push`;

// const watchRequest = {
//   labelIds: ["INBOX"],
//   topicName: topicName,
//   expiration: 86400,
// };

// gmail.users
//   .watch({
//     auth: oauth2Client,
//     userId: "me",
//     resource: watchRequest,
//   })
//   .then((response) => {
//     console.log("gmail watch", response.data);
//   })
//   .catch((error) => {
//     console.log(error);
//   });

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

app.post("/setup-push-notifications", (req, res) => {
  res.status(201).send("New email recieved", req);
  // const data = req.body.message.data;
  // const decodedData = Buffer.from(data, "base64").toString();
  // console.log("Received notification:", decodedData);

  // // Parse the notification
  // const notification = google.gmail_v1.users.messages.parseHistory({
  //   history: JSON.parse(decodedData),
  // });
  // const message = notification.messages[0];

  // // Handle the notification
  // console.log("Message:", message);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

module.exports = app;
