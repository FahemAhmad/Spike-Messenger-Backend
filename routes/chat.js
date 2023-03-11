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
  REDIRECT_URI,
  SCOPES
);

router.get("/frequent_users", authenticateToken, async (req, res) => {
  try {
    const { access_token } = req.user.tokens;
    // create a new Google Chat client
    oauth2Client.setCredentials({
      access_token,
    });

    const chat = google.chat({ version: "v1", auth: oauth2Client });

    // get a list of all the spaces that the authenticated user has access to
    const spacesResponse = await chat.spaces.list();
    const spaces = spacesResponse.data.spaces;

    // get the frequent users for each space and store them in an array
    const frequentUsers = [];
    for (const space of spaces) {
      const response = await chat.spaces.get({
        name: space.name,
        view: "FULL",
      });
      const members = response.data.memberships.filter(
        (membership) => membership.type === "ROOM"
      );
      members.forEach((member) => {
        if (frequentUsers.includes(member.member.name)) {
          frequentUsers.push(member.member.name);
        }
      });
    }

    // return the list of frequent users for all spaces
    res.status(200).json({ frequentUsers });
  } catch (err) {
    // handle errors
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
