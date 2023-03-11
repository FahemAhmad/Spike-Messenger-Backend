const axios = require("axios");
const server = require("./src/server");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const cheerio = require("cheerio");
const base64url = require("base64url");

const { OAuth2Client } = require("google-auth-library");

const port = process.env.PORT;
const CONNECTION_STRING = process.env.CONNECTION_STRING;

// const CLIENT_ID =
//   "926975398170-p7g488cjlgtv4jptqilr5b5fiajd0lda.apps.googleusercontent.com";
// const CLIENT_SECRET = "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";
// const REDIRECT_URI = "http://localhost:5173/auth/google/callback";
// const SCOPES = "profile email https://www.googleapis.com/auth/gmail.readonly";

// const oauth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI,
//   SCOPES
// );
// const options = {
//   expiresIn: "5m",
// };

// // Middleware to check the access token expiration
// const checkAccessTokenExpiration = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (authHeader) {
//     const accessToken = authHeader.split(" ")[1];

//     try {
//       jwt.verify(accessToken, secretKey);
//       next();
//     } catch (error) {
//       if (error.name === "TokenExpiredError") {
//         res.status(401).send({ message: "Access token expired" });
//       } else {
//         res.status(403).send({ message: "Invalid access token" });
//       }
//     }
//   } else {
//     res.status(401).send({ message: "Access token missing" });
//   }
// };

// // Endpoint to refresh the access token
// app.post("/refresh-token", (req, res) => {
//   const refresh_token = req.body.refresh_token;

//   // Verify the refresh token and decode the payload
//   try {
//     const decoded = jwt.verify(refresh_token, secretKey);

//     // Generate a new access token and refresh token
//     const access_token = jwt.sign({ sub: decoded.sub }, secretKey, options);
//     const new_refresh_token = jwt.sign({ sub: decoded.sub }, secretKey, {
//       expiresIn: "1d",
//     });

//     // Respond with the new tokens
//     res.send({ access_token, refresh_token: new_refresh_token });
//   } catch (error) {
//     res.status(403).send({ message: "Invalid refresh token" });
//   }
// });

// // Define a route to initiate the Google Sign-In flow
// app.get("/google-auth", (req, res) => {
//   const { client_id, redirect_uri } = req.query;

//   const params = new URLSearchParams({
//     response_type: "code",
//     client_id: CLIENT_ID,
//     redirect_uri: REDIRECT_URI,
//     scope: SCOPES,
//     state: "random_state_string",
//     access_type: "offline",
//   }).toString();

//   res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
// });

// // Define a route to exchange the authorization code for access token and refresh token
// app.post("/google-auth/callback", async (req, res) => {
//   const { code } = req.body;

//   const params = new URLSearchParams({
//     code: code,
//     client_id: CLIENT_ID,
//     client_secret: CLIENT_SECRET,
//     redirect_uri: REDIRECT_URI,
//     grant_type: "authorization_code",
//     access_type: "offline",
//   }).toString();

//   try {
//     const response = await axios.post(
//       "https://oauth2.googleapis.com/token",
//       params,
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       }
//     );

//     const expiry_date = new Date().getTime() + response.data.expires_in * 1000;
//     const access_token = response.data.access_token;
//     const refresh_token = response.data.refresh_token;
//     const id_token = response.data.id_token;

//     // Store the tokens in your database or session
//     // ...

//     res.json({ access_token, refresh_token, expiry_date, id_token });
//   } catch (error) {
//     console.error(error);
//     res.status(400).send("Invalid request");
//   }
// });

// app.get("/user-data", authenticateToken, async (req, res) => {
//   try {
//     // Use the access token to fetch user data from Google
//     const { access_token } = req.user.tokens;

//     oauth2Client.setCredentials({ access_token });

//     // oauth2Client.setScopes(SCOPES);

//     const { data } = await google.oauth2("v2").userinfo.get({
//       headers: { Authorization: `Bearer ${access_token}` },
//     });

//     // Use the user's data
//     res.status(200).json(data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// app.get("/emails", authenticateToken, async (req, res) => {
//   try {
//     const { access_token } = req.user.tokens;
//     const headers = {
//       Authorization: `Bearer ${access_token}`,
//     };
//     const params = {
//       userId: "me",
//       maxResults: 50,
//     };
//     oauth2Client.setCredentials({
//       access_token,
//     });
//     google.options({ auth: oauth2Client });

//     // Get the first 50 emails for the authenticated user
//     const response = await google.gmail("v1").users.messages.list(params, {
//       headers,
//       auth: oauth2Client,
//     });

//     // Map the emails to an array of objects with email details
//     const emails = response.data.messages.slice(0, 50).map(async (message) => {
//       const { data } = await google.gmail("v1").users.messages.get({
//         userId: "me",
//         id: message.id,
//         format: "full",
//         auth: oauth2Client,
//       });

//       const headers = data.payload.headers;
//       const subject =
//         headers.find((header) => header.name === "Subject")?.value || "";
//       const from =
//         headers.find((header) => header.name === "From")?.value || "";
//       const date =
//         headers.find((header) => header.name === "Date")?.value || "";
//       const to = headers.find((header) => header.name === "To")?.value || "";
//       const htmlPart = data.payload.parts?.find(
//         (part) => part.mimeType === "text/html"
//       );
//       const html = htmlPart ? base64url.decode(htmlPart.body.data) : "";

//       const $ = cheerio.load(html);
//       $("img").each((i, elem) => {
//         const src = $(elem).attr("src");
//         if (src && src.startsWith("cid:")) {
//           const attachmentId = src.substr(4);
//           const attachment = data.payload.parts.find(
//             (part) => part.body.attachmentId === attachmentId
//           );
//           if (attachment) {
//             const data = attachment.body.data;
//             const mimeType = attachment.mimeType;
//             const cid = `cid:${attachmentId}`;
//             $(elem)
//               .attr("src", `data:${mimeType};base64,${data}`)
//               .attr("cid", cid);
//           }
//         }
//       });

//       const htmlWithInlineImages = $.html();
//       const attachments =
//         data.payload.parts
//           ?.filter((part) => part.filename && part.body?.attachmentId)
//           ?.map((part) => {
//             const filename = part.filename;
//             const attachmentId = part.body.attachmentId;
//             const attachment = data.payload.parts.find(
//               (part) => part.body?.attachmentId === attachmentId
//             );
//             const data = attachment?.body?.data || "";
//             const mimeType = attachment?.mimeType || "";
//             return { filename, data, mimeType };
//           }) || [];

//       return {
//         id: message.id,
//         threadId: message.threadId,
//         subject,
//         from,
//         to,
//         date,
//         body: htmlWithInlineImages,
//         attachments,
//       };
//     });

//     const results = await Promise.all(emails);

//     res.json(results);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

mongoose
  .connect(CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "spike",
  })
  .then(() => {
    console.log("Database is ready");
  })
  .catch((err) => {
    console.log("Somehthing is wrong", err);
  });

const startServer = () => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
