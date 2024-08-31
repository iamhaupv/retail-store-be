const { User } = require("../models/index");
const asyncHandler = require("express-async-handler");
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
    data: newUser
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
  if (response && await response.isCorrectPassword(password)) {
    return res.status(200).json({
      sucess: true,
      data: response
    });
  } else {
    throw new Error("Incorrect email or passord!");
  }
});
module.exports = {
  register,
  login,
};
