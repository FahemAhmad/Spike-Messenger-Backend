const { google } = require("googleapis");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  SCOPES
);

const topicName = `projects/spike-messenger/topics/gmail-push`;

function setupPushNotifications(token) {
  // Set up push notifications for the user's mailbox
  oauth2Client.setCredentials(token);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  gmail.users.watch(
    {
      userId: "me",
      requestBody: {
        topicName: topicName,
        labelIds: ["INBOX"],
      },
    },
    (err, res) => {
      if (err) {
        return;
      }

      console.log("New email received", res);
    }
  );
}

module.exports = { setupPushNotifications };
