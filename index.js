const axios = require("axios");
const server = require("./src/server");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const cheerio = require("cheerio");
const base64url = require("base64url");

const { OAuth2Client } = require("google-auth-library");

const port = process.env.PORT;
const CONNECTION_STRING = process.env.CONNECTION_STRING;


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
