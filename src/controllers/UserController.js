const { User } = require("../models/index");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");
const jwt = require("jsonwebtoken");
const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");
// register
// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstname, lastname, username } = req.body;
//   if (!email || !password || !firstname || !lastname)
//     return res.status(400).json({
//       succuess: false,
//       mes: "Missing inputs",
//     });
//   const user = await User.findOne({ email });
//   if (user) throw new Error("User existed");
//   const newUser = await User.create(req.body);
//   return res.status(200).json({
//     success: user ? true : false,
//     mes: newUser ? "Register successfully!" : "Something went wrong!",
//     data: newUser,
//   });
// });
const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body;

  if (!email || !password || !firstname || !lastname) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }

  const user = await User.findOne({ email });
  if (user) throw new Error("User existed");

  // Tạo username
  const firstInitial = firstname.charAt(0).toUpperCase(); // Chữ cái đầu tiên của firstname
  const lastInitials = lastname.toUpperCase().split(' ').map(word => word.charAt(0)).join(''); // Chữ cái đầu tiên của từng từ trong lastname
  const baseUsername = firstInitial + lastInitials; // Kết hợp lại
  let username = baseUsername;
  let count = 1;

  // Kiểm tra trùng lặp và tạo username duy nhất
  while (await User.findOne({ username })) {
    username = `${baseUsername}${count}`;
    count++;
  }

  // Tạo user mới với username duy nhất
  const newUser = await User.create({ ...req.body, username });

  return res.status(200).json({
    success: newUser ? true : false,
    mes: newUser ? "Register successfully!" : "Something went wrong!",
    data: newUser,
  });
});

// login
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
    const accessToken = generateAccessToken(response._id, role);
    // create refresh token
    const refreshToken = generateRefreshToken(response._id);
    // save refresh token in database
    await User.findByIdAndUpdate(response._id, { refreshToken }, { new: true });
    // save refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error("Incorrect email or passord!");
  }
});
// get user by id
const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select("-refreshToken -password -role");
  return res.status(200).json({
    success: user ? true : false,
    rs: user ? user : "User not found",
  });
});
// refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie && !cookie.refreshToken) {
    throw new Error("No refresh token in cookies");
  }
  const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
  const response = await User.findOne({
    _id: rs._id,
    refreshToken: cookie.refreshToken,
  });
  return res.status(200).json({
    success: response ? true : false,
    newAccessToken: response
      ? generateAccessToken(response._id, response.role)
      : "Refresh token not matched",
  });
});
// logout
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken) {
    throw new Error("No refresh token in cookies!");
  }
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: "" },
    { new: true }
  );
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  return res.status(200).json({
    success: true,
    mes: "Logout success!",
  });
});
// Client gửi email
// Server check email có hợp lệ hay không => Gửi mail + kèm theo link (password change token)
// Client check mail => click link
// Client gửi api kèm token
// Check token có giống với token mà server gửi mail hay không
// Change password
//Gữi mail change password
// forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throwError(401, "Missing email !", res);
  const user = await User.findOne({ email });
  if (!user) throwError(400, "User not found !", res);
  const resetToken = user.createPasswordChangedToken();
  await user.save();

  const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=${process.env.URL_CLIENT}/reset-password/${resetToken}>Click here</a>`;

  const data = {
    email,
    html,
    subject: "Forgot password",
  };
  const rs = await sendMail(data);
  return res.status(200).json({
    success: true,
    rs,
  });
});
// reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  if (!password || !token) throwError(403, "Missing input !", res);
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throwError(400, "Invalid resetToken !", res);
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = Date.now();
  user.passwordResetExpires = undefined;
  await user.save();
  return res.status(200).json({
    success: user ? true : false,
    mes: user ? "Updated password" : "Something went wrong",
  });
});
// get all user
const getUsers = asyncHandler(async (req, res) => {
  const response = await User.find().select("-refreshToken -password -role");
  return res.status(200).json({
    success: response ? true : false,
    users: response,
  });
});
// delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) throw new Error("Missing inputs!");
  const response = await User.findByIdAndDelete(_id);
  return res.status(200).json({
    success: response ? true : false,
    deleteUser: response
      ? `User with email ${response.email} deleted`
      : "No user delete",
  });
});
// update user
const updateUser = asyncHandler(async (req, res) => {
  //
  const { _id } = req.user;
  // const { email, phone, name, address } = req.body;
  if (!_id || Object.keys(req.body).length === 0)
    throw new Error("Missing inputs");

  // const data = { email, phone, name, address };
  // if (req.file) data.avatar = req.file.path;
  const response = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  }).select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : "Some thing went wrong",
  });
});
// update user by admin
const updateUserByAdmin = asyncHandler(async(req, res) => {
  const {uid} = req.params
  if (!uid || Object.keys(req.body).length === 0)
    throw new Error("Missing inputs");

  // const data = { email, phone, name, address };
  // if (req.file) data.avatar = req.file.path;
  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : "Some thing went wrong",
  });
})
module.exports = {
  register,
  login,
  getCurrent,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin
};
