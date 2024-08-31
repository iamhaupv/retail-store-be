const jwt = require("jsonwebtoken");
const generateAccessToken = (uid, role) => {
  return jwt.sign(
    {
      _id: uid,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10s" }
  );
};
const generateRefreshToken = (uid) => {
  return jwt.sign(
    {
      _id: uid,
    },
    process.env.JWT_SECRET,
    { expiresIn: "50s" }
  );
};
module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
