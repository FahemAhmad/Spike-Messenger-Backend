const router = require("express").Router();
const axios = require("axios");
const { Token } = require("../model/Token");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;

// Define a route to initiate the Google Sign-In flow
router.get("/", (req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: "random_state_string",
    access_type: "offline",
  }).toString();

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Define a route to exchange the authorization code for access token and refresh token
router.post("/callback", async (req, res) => {
  const { code } = req.body;

  const params = new URLSearchParams({
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
    access_type: "offline",
  }).toString();

  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const expiry_date = new Date().getTime() + response.data.expires_in * 1000;
    const refresh_token = response.data.refresh_token;
    const access_token = response.data.access_token;
    const id_token = response.data.id_token;

    // Store the refresh token, expiry date, and ID token in MongoDB
    const token = new Token({
      refresh_token,
      expiry_date,
      id_token,
      access_token,
    });

    await token.save();

    res.json({ access_token, expiry_date, refresh_token });
  } catch (error) {
    console.error(error);
    res.status(400).send("Invalid request");
  }
});

module.exports = router;
