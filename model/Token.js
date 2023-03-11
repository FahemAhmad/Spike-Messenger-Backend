const mongoose = require("mongoose");
const { Schema } = mongoose;

const TokenSchema = new Schema({
  access_token: String,
  refresh_token: String,
  expiry_date: Date,
  id_token: String,
});

exports.Token = mongoose.model("Token", TokenSchema);
