const router = require("express").Router();
const express = require("express");
const app = express();

const axios = require("axios");
const { Token } = require("../model/Token");
const { PubSub } = require("@google-cloud/pubsub");
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

    oauth2Client.setCredentials({
      access_token,
    });

    const pubsub = new PubSub({
      projectId: "spike-messenger",
      credentials: {
        type: "service_account",
        project_id: "spike-messenger",
        private_key_id: "83b50ea28be3b531c174beab6276a65dee56ab95",
        private_key:
          "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCL8OernjIA1SgS\n5FyRFopxFQWCIlLmRSljNj+jlKqW/AC9q9dARh0KBOUw+7ZApg+GSdGW0NYez28e\nIrnsTWBCpAWPBJ+wkVG1EU4fHRKj9GpfJP81d+dvqPfO6JHqVJq1yoJx6ywvW0lE\nSaZEqw1w1ajgkapoYY9+jnVoKTWGHUoitc42NEkKJm7ge0WU6rz40DLfmafHpcm4\nAFh9Pv+cnZgTMAEjcSaf2wzJQZlL7Oky5r/0WLwbL7Sc5QEswTuxpdim6k+ugeQH\nPVUR94zpnLPP6hb/3RgukfEMw7OWNK0XIjWBSSP6kgCG8hoE66y0UyYC8Cc3b2MV\ni7SmD+yJAgMBAAECggEAEHJ3YAG/Qb7Lr3C8embqTYEZfSJ4mMy/IQRytVCXPhiP\nI7urGEhFSHSr1TZ4RJ/fyjop0m5oBAYAOsv9CwtLCXoKlzUFabSipEPM6TY7Bx8G\nU3lfL1MQ1dxHh79oyuA3sK8E5surjUNO2KJJUt/BvCW4a/Bi1VLGEStAHEZfnovt\nMPb3tMwUhLcfB7cJWAYBYsfzL8BO3vnp5+q+CM5dDxz1K+2w/a3YE/bCQS/G/Fi5\nQFIJu8a7Yn6BW2UBWKL3zcS4fX4uuPBgvz6fHlb5unDYaijkkIjtDEOF2zbSyUv2\nEbe3S+R4pscSFWU8IHls6Qoc5oHxH06pL5KcBQFrQQKBgQDEs/dcl8DpP9dBg68o\n1CkxHHu2AXoS4s8ZMaVudZzlOOpKyaxjIFxAAMImuw6HNe0oBoSImsY8NoSAOfXS\n3Hj9QTLrfNu1op37dg1mLbKkXC7XBHdpyr2GO57hzxylXZBQdLDn5FzPL+WliCeB\nJM1kayo+kfNkRzuC97RfMZM+2QKBgQC2IHwMn2euZm46YTtq58NxnIF9hpR8LGtf\n4iXfBvBLkBYi3YB2ZindPRtASvysnMfQsW8o6j/i4Qh4PbKu9x3FNAZvhnbBj1oO\nXnT4BCfspKzdtWK7hJuBF5K4mnmBckPVG+TY97+HFgdG7ACjWr2aUDR9IdMUSqlZ\nIzcu6gLtMQKBgQC8MarijdZl00yxQ7ocCBB5ClVaJ0OSOioGYrdyXViE/tU6RIWI\nOXfJTHB0+dbGilOiTcoToHE1Pru6qrmEyqd/Nhfvsf/LYhBge+wJ7ILUOdYepglR\n0EVP3k7+oFc557ChKWPwGU6qc5r1qrSRHJLeFqHOR3lkYbqQbUnHIflM0QKBgF/j\noIxgzQzkfzqbgNYbaiqB9Sdq2Pi7xli4T6oqFBAkr5LxvjYYOghyqMtj777N2OJG\n2TjYhIRmaLgt+8rk7raqWo0TZakpWYfhMYJ3ZbHRTfZ5Dp+eBOWlzKkHI9wEljQ4\nuHeHkT6FWZV8oiVfnB4IBmqviVvQp3L3+JDpwlqxAoGADwPPkifjJLjIVhLUJn6c\ngGxH+LeDVu9DPpgONu97QBC25y/m+tNfSUTVDoyhjy1IQwgQ8rPDNJDW4vIXObT7\n/yfEGpDEDU0WlgKmAxPatoa985j2OiiVmBUKwbZpbdUUl+oVMaqVYfdidffhxG1q\nDKWqfLuEmWtIWQSVVakwOpM=\n-----END PRIVATE KEY-----\n",
        client_email: "spike-messenge@spike-messenger.iam.gserviceaccount.com",
        client_id: "111543132677583503623",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:
          "https://www.googleapis.com/robot/v1/metadata/x509/spike-messenge%40spike-messenger.iam.gserviceaccount.com",
      },
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const topicName = `projects/spike-messenger/topics/gmail-push`;

    const watchRequest = {
      topicName: topicName,
      labelIds: ["INBOX"],
      requestBody: {
        labelIds: ["INBOX"],
        topicName: topicName,
        labelFilterAction: "include",
      },
    };

    gmail.users.watch({ userId: "me", resource: watchRequest }, (err, res) => {
      if (err) {
        console.log("Error creating watch:", err);
      } else {
        console.log("Watch created successfully:", res.data);
      }
    });

    const options = {
      url: "http://localhost:4000/webhook",
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        // add your notification payload here
        title: "New message",
        body: "You have a new message in your inbox",
      },
    };

    axios(options)
      .then((res) => {
        console.log(`Push notification sent with status code ${res.status}`);
      })
      .catch((err) => {
        console.error(`Error sending push notification: ${err.message}`);
      });

    res.json({ access_token, expiry_date, refresh_token });
  } catch (error) {
    console.error(error);
    res.status(400).send("Invalid request");
  }
});

module.exports = router;
