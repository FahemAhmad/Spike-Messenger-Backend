const { google } = require("googleapis");
const authenticateToken = require("../helpers/AuthenticateToken");

const router = require("express").Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

router.post("/", authenticateToken, async (req, res) => {
  oauth2Client.setCredentials(req.user.tokens);
  try {
    // Set the access token for the oAuth2Client

    // Create a new Google Meet event
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const meetEvent = {
      summary: "Automatically generated meeting",
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(2),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      start: {
        dateTime: new Date().toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(Date.now() + 3600000).toISOString(),
        timeZone: "UTC",
      },
    };

    // Add the event to the user's primary calendar
    const event = await calendar.events.insert({
      calendarId: "primary",
      resource: meetEvent,
      conferenceDataVersion: 1,
    });

    // Return the Google Meet link
    const meetLink = event.data.conferenceData.entryPoints[0].uri;
    res.status(200).json({ meetLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create meeting" });
  }
});

module.exports = router;
