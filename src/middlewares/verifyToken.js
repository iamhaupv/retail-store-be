const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const logger = require("./logger");

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        logger.error(`Invalid access token attempt from ${req.ip}`);
        return res.status(401).json({
          success: false,
          mes: "Invalid access token",
        });
      }
      logger.info(`User ${decode._id} role ${decode.role} authenticated successfully from ${req.ip}`);
      console.log(decode);
      req.user = decode;
      next();
    });
  } else {
    logger.warn(`Authentication attempt without token from ${req.ip}`);
    return res.status(401).json({
      success: false,
      mes: "Require authentication!",
    });
  }
});
const isAdmin = asyncHandler((req, res, next) => {
  const { role } = req.user;

  if (role !== "admin"){
    logger.warn(`Unauthorized access attempt by user ${req.user._id} from ${req.ip}`);
    return res.status(401).json({
      success: false,
      mes: " REQUIRE ADMIN ROLE",
    });}
    logger.info(`User ${req?.user?._id} granted admin access from ${req.ip}`);
  next();
});
module.exports = {
  verifyAccessToken,
  isAdmin,
};
