const router = require("express").Router();
const authenticateToken = require("../helpers/AuthenticateToken");
const { google } = require("googleapis");
const cheerio = require("cheerio");
const base64url = require("base64url");
const base64 = require("base-64");
const base64js = require("base64-js");
const multer = require("multer");
const upload = multer();

const { OAuth2Client } = require("google-auth-library");

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

const options = {
  expiresIn: "5m",
};
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { access_token } = req.user.tokens;
    const headers = {
      Authorization: `Bearer ${access_token}`,
    };
    const params = {
      userId: "me",
      maxResults: 50,
    };
    oauth2Client.setCredentials({
      access_token,
    });
    google.options({ auth: oauth2Client });

    // Get the first 50 emails for the authenticated user
    const response = await google.gmail("v1").users.messages.list(params, {
      headers,
      auth: oauth2Client,
    });

    // Map the emails to an array of objects with email details
    const emails = response.data.messages.slice(0, 50).map(async (message) => {
      const { data } = await google.gmail("v1").users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
        auth: oauth2Client,
      });

      const headers = data.payload.headers;
      const subject =
        headers.find((header) => header.name === "Subject")?.value || "";
      const from =
        headers.find((header) => header.name === "From")?.value || "";
      const date =
        headers.find((header) => header.name === "Date")?.value || "";
      const to = headers.find((header) => header.name === "To")?.value || "";
      const htmlPart = data.payload.parts?.find(
        (part) => part.mimeType === "text/html"
      );
      const html = htmlPart ? base64url.decode(htmlPart.body.data) : "";

      const $ = cheerio.load(html);
      $("img").each((i, elem) => {
        const src = $(elem).attr("src");
        if (src && src.startsWith("cid:")) {
          const attachmentId = src.substr(4);
          const attachment = data.payload.parts.find(
            (part) => part.body.attachmentId === attachmentId
          );
          if (attachment) {
            const d = attachment.body.data;
            const mimeType = attachment.mimeType;
            const cid = `cid:${attachmentId}`;
            $(elem)
              .attr("src", `data:${mimeType};base64,${d}`)
              .attr("cid", cid);
          }
        }
      });

      const htmlWithInlineImages = $.html();
      const attachments =
        data.payload.parts
          ?.filter((part) => part.filename && part.body?.attachmentId)
          ?.map((part) => {
            const filename = part.filename;
            const attachmentId = part.body.attachmentId;
            const attachment = data.payload.parts.find(
              (part) => part.body?.attachmentId === attachmentId
            );
            const d = attachment?.body?.data || "";
            const mimeType = attachment?.mimeType || "";
            return { filename, d, mimeType };
          }) || [];

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        body: htmlWithInlineImages,
        attachments,
      };
    });

    const results = await Promise.all(emails);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

const sendEmail = async (
  to,
  subject,
  body,
  attachments,
  from,
  access_token
) => {
  const message = {
    to,
    subject,
    body,
    attachments,
    from,
  };

  console.log("message", message);

  const headers = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  };

  // Construct the message payload
  const messageParts = [
    `To: ${message.to}`,
    `From: ${message.from}`,
    `Subject: ${message.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="boundary1"`,
    "",
    `--boundary1`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    `${message.body}`,
    "",
  ];

  // Add attachments to the message payload
  if (message.attachments.length > 0) {
    message.attachments.forEach((attachment) => {
      const bytes = Buffer.from(attachment.buffer);
      const data = base64js.fromByteArray(bytes);

      messageParts.push(
        `--boundary1`,
        `Content-Type: ${attachment.mimetype}`,
        `Content-Disposition: attachment; filename="${attachment.originalname}"`,
        `Content-Transfer-Encoding: base64`,
        "",
        `${data}`,
        ""
      );
    });
  }

  messageParts.push(`--boundary1--`, "");

  const messageRaw = messageParts.join("\n");
  const encodedMessage = base64.encode(messageRaw);

  const response = await google.gmail("v1").users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
    headers,
  });

  return response.data;
};

router.post(
  "/send",
  authenticateToken,
  upload.array("attachments"),
  async (req, res) => {
    try {
      const { to, subject = "", body = "" } = req.body;
      const attachments = req.files;
      const { access_token } = req.user.tokens;
      oauth2Client.setCredentials({ access_token });

      const profile = await google.oauth2("v2").userinfo.get({
        auth: oauth2Client,
      });
      const from = profile.data.email;

      await sendEmail(to, subject, body, attachments, from, access_token);

      res.json({
        message: "Email sent successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

module.exports = router;
