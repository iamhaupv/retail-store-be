const { User } = require("../models/index");
const asyncHandler = require("express-async-handler");
const jwt = require("../middlewares/jwt");
const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  if (!email || !password || !firstname || !lastname)
    return res.status(400).json({
      succuess: false,
      mes: "Missing inputs",
    });
  const user = await User.findOne({ email });
  if (user) throw new Error("User existed");
  const newUser = await User.create(req.body);
  return res.status(200).json({
    success: user ? true : false,
    mes: newUser ? "Register successfully!" : "Something went wrong!",
    data: newUser,
  });
});
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      succuess: false,
      mes: "Missing inputs",
    });
  const response = await User.findOne({ email });
  if (response && (await response.isCorrectPassword(password))) {
    // detach password, role
    const { password, role, ...userData } = response.toObject();
    // create access token
    const accessToken = jwt.generateAccessToken(response._id, role);
    // create refresh token
    const refreshToken = jwt.generateRefreshToken(response._id);
    // save refresh token in database
    await User.findByIdAndUpdate(response._id, { refreshToken }, { new: true });
    // save refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      sucess: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error("Incorrect email or passord!");
  }
});
const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id);
  return res.status(200).json({
    success: false,
    rs: user ? user : "User not found",
  });
});
module.exports = {
  register,
  login,
  getCurrent,
};
