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
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: req.body.summary,
    description: req.body.description,
    start: {
      dateTime: req.body.startDateTime,
      timeZone: req.body.timeZone,
    },
    end: {
      dateTime: req.body.endDateTime,
      timeZone: req.body.timeZone,
    },
    reminders: {
      useDefault: true,
    },
  };

  console.log("result", event);

  try {
    const result = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    console.log(`Event created: ${result.data.htmlLink}`);

    res.status(201).send({ message: "Event created successfully" });
  } catch (error) {
    console.error(`Error creating event: ${error}`);

    res.status(500).send({ message: "Internal server error" });
  }
});


router.get("/", authenticateToken, async (req, res) => {
  oauth2Client.setCredentials(req.user.tokens);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const eventItems = events.data.items.map((event) => {
      const { summary, description, start, end } = event;
      return {
        summary,
        description,
        start: start.dateTime,
        end: end.dateTime,
      };
    });

    res.status(200).send(eventItems);
  } catch (error) {
    console.error(`Error getting events: ${error}`);

    res.status(500).send({ message: "Internal server error" });
  }
});


module.exports = router;
