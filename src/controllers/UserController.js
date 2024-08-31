const { User } = require("../models/index");
const asyncHandler = require("express-async-handler");
const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  if (!email || !password || !firstname || !lastname)
    return res.status(400).json({
      succuess: false,
      mes: "Missing inputs",
    });
    const response = await User.create(req.body)
    return res.status(200).json({
      success: response ? true : false,
      response
    })
});

module.exports = {
  register,
};
