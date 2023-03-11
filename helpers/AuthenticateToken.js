const { OAuth2Client } = require("google-auth-library");
const { Token } = require("../model/Token");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (!accessToken) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const token = await Token.findOne({ access_token: accessToken });

    if (!token) {
      return res.status(401).send("Unauthorized");
    }

    if (token.expiry_date < Date.now()) {
      try {
        const { access_token, id_token, expiry_date } =
          await refreshAccessToken(token.refresh_token);

        const expiry_dates = Date.now() + expiry_date * 1000;

        // Update the token in the database
        await Token.findOneAndUpdate(
          { access_token: accessToken },
          { id_token, expiry_dates }
        );

        // Set the updated id_token in the req.user object
        const updatedUser = { ...req.user, tokens: { access_token } };
        req.user = updatedUser;
      } catch (error) {
        console.error(error);
        return res.status(401).send("Unauthorized");
      }
    }

    // Token is valid, retrieve the id_token
    const idToken = token.id_token;

    const client = new OAuth2Client(process.env.CLIENT_ID);

    // Verify the id_token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      id: payload.sub,
      email: payload.email,
      tokens: { access_token: accessToken },
    };
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).send("Unauthorized");
  }
}

async function refreshAccessToken(refreshToken) {
  const client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  const { tokens } = await client.refreshToken(refreshToken);
  return tokens;
}

module.exports = authenticateToken;
