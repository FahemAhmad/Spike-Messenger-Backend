const router = require("express").Router();
const { google } = require("googleapis");
const authenticateToken = require("../helpers/AuthenticateToken");

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
  const newNote = {
    title: req.body.title,
    textContent: req.body.textContent,
  };

  try {
    // Get the access token from the request user object
    const accessToken = req.user.accessToken;

    // Set the access token on the OAuth2 client
    oauth2Client.setCredentials({ access_token: accessToken });

    const keep = google.keep({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await keep.notes.create({ requestBody: newNote });
    console.log(`New note created with ID: ${response.data.name}`);

    // Share the note with multiple Gmail users if `sharedWith` is present
    if (req.body.sharedWith && Array.isArray(req.body.sharedWith)) {
      const noteId = response.data.name.split("/")[1];

      // Search for the email addresses in the Google directory
      const emailAddresses = await Promise.all(
        req.body.sharedWith.map(async (email) => {
          const result = await google.admin("directory_v1").users.list({
            domain: "yourdomain.com",
            query: `email=${email}`,
            auth: oauth2Client,
          });
          return result.data.users[0].primaryEmail;
        })
      );

      // Add the email addresses as writers to the note
      const newPermissions = emailAddresses.map((emailAddress) => {
        return { role: "writer", emailAddress };
      });

      // Add permissions for each email address
      await Promise.all(
        newPermissions.map(async (permission) => {
          await keep.permissions.addPermissions({
            parent: `notes/${noteId}`,
            requestBody: permission,
          });
          console.log(`Note shared with user: ${permission.emailAddress}`);
        })
      );
    }

    res.status(201).send({
      message: "Note created successfully",
      noteId: response.data.name.split("/")[1],
    });
  } catch (error) {
    console.error(`Error creating new note: ${error}`);
    res.status(500).send({
      message: "Internal server error",
    });
  }
});

module.exports = router;
