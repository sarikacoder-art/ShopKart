const jwt = require("jsonwebtoken");

function generateToken(customerId) {
  return jwt.sign(
    { customerId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

module.exports = generateToken;
