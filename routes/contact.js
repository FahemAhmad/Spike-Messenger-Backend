const router = require("express").Router();
const { google } = require("googleapis");

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

router.get("/frequent-contacts", async (req, res) => {
  try {
    // Replace with your own access and refresh tokens
    const { access_token } = req.user.tokens;
    oauth2Client.setCredentials({ access_token });

    // Set up the Gmail API client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Retrieve the user's email address and profile picture
    const userProfile = await gmail.users.getProfile({ userId: "me" });
    const { emailAddress, photoUrl } = userProfile.data;

    const sentMessages = await gmail.users.messages.list({
      userId: "me",
      q: "in:sent",
      format: "full", // Include the message payload
    });

    // Fetch the full message for each sent message
    const fullMessages = await Promise.all(
      sentMessages.data.messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });
        return fullMessage.data;
      })
    );

    // Extract the recipient email addresses from the full messages
    const recipients = fullMessages
      .map((message) => {
        const headers = message.payload.headers;
        const toHeaders = headers.filter(
          (header) => header.name === "To" || header.name === "Cc"
        );
        const toAddresses = toHeaders.map((header) => header.value);
        return toAddresses;
      })
      .flat();

    // Count the frequency of each recipient email address
    const frequencyCount = recipients.reduce((counts, email) => {
      counts[email] = (counts[email] || 0) + 1;
      return counts;
    }, {});

    // Sort the recipient email addresses by frequency in descending order
    const frequentContacts = Object.keys(frequencyCount)
      .sort((a, b) => frequencyCount[b] - frequencyCount[a])
      .map((email) => ({ email, frequency: frequencyCount[email] }));

    // Use the Google People API to fetch the user's profile information for each email address
    const people = google.people({ version: "v1", auth: oauth2Client });
    const contactList = await Promise.all(
      frequentContacts.map(async (contact) => {
        const email = contact.email;
        try {
          const res = await people.people.get({
            resourceName: `people/${email}`,
            personFields: "names,photos",
          });
          const profile = res.data;
          const name = profile.names[0].displayName;
          const pictureUrl = profile.photos[0].url;
          // Create an object for each contact that includes the email address, name, and profile picture
          return {
            email,
            name,
            pictureUrl,
            frequency: contact.frequency,
          };
        } catch (err) {
          console.log(`Could not fetch profile for ${email}. Error: ${err}`);
          // Return an empty object if the profile could not be fetched
          return {};
        }
      })
    );

    // Filter out the empty objects (i.e., the profiles that could not be fetched)
    const filteredContacts = contactList.filter(
      (contact) => Object.keys(contact).length !== 0
    );

    // Return the list of contact objects
    res.json(filteredContacts);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

module.exports = router;
