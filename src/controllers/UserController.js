const { User, Employee } = require("../models/index");
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
// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstname, lastname } = req.body;

//   if (!email || !password || !firstname || !lastname) {
//     return res.status(400).json({
//       success: false,
//       mes: "Missing inputs",
//     });
//   }

//   const user = await User.findOne({ email });
//   if (user) throw new Error("User existed");

//   // Tạo username
//   const firstInitial = firstname.charAt(0).toUpperCase(); // Chữ cái đầu tiên của firstname
//   const lastInitials = lastname
//     .toUpperCase()
//     .split(" ")
//     .map((word) => word.charAt(0))
//     .join(""); // Chữ cái đầu tiên của từng từ trong lastname
//   const baseUsername = firstInitial + lastInitials; // Kết hợp lại
//   let username = baseUsername;
//   let count = 1;

//   // Kiểm tra trùng lặp và tạo username duy nhất
//   while (await User.findOne({ username })) {
//     username = `${baseUsername}${count}`;
//     count++;
//   }

//   // Tạo user mới với username duy nhất
//   const newUser = await User.create({ ...req.body, username });

//   return res.status(200).json({
//     success: newUser ? true : false,
//     mes: newUser ? "Register successfully!" : "Something went wrong!",
//     data: newUser,
//   });
// });

const register = asyncHandler(async (req, res) => {
  const { email, name, phone } = req.body;
  if (!email || !name || !phone) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  const password = 1
  const user = await User.findOne({ $or: [{ email: email }, { phone: phone }] });
  if (user) throw new Error("User existed");
  const newUser = await User.create({password, ...req.body });

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
      role,
    });
  } else {
    throw new Error("Incorrect email or passord!");
  }
});
// get user by id
const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select("-refreshToken").populate("employee");
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
  if (!user) throwError(400, "User not f00o0und !", res);
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
    resetToken,
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
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
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
});
// check pass
const checkPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing email or password",
    });
  }
  const user = await User.findOne({ email });
  if (user && await user.isCorrectPassword(password)) {
    return res.status(200).json({
      success: true,
      message: "Password is valid",
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Your current password is not valid",
    });
  }
});


// const updateInfor = asyncHandler(async (req, res) => {
//   const { id, name, email, phone, address, birthday, gender, image } = req.body;

//   try {
//     // Tìm người dùng theo ID
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Cập nhật thông tin User
//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.phone = phone || user.phone;
//     user.address = address || user.address;
//     user.birthday = birthday || user.birthday;
//     user.gender = gender || user.gender;

//     // Cập nhật hình ảnh nếu có
//     if (req.file && req.file.path) {
//       user.image = req.file.path;
//     }

//     // Lưu User
//     await user.save();

//     console.log("User after update:", user);

//     // Cập nhật thông tin Employee (nếu có)
//     if (user.employee) {
//       const updatedEmployeeData = {
//         name: name || user.name,  // Sử dụng thông tin từ user nếu có thay đổi
//         email: email || user.email,
//         phone: phone || user.phone,
//         address: address || user.address
//       };

//       // Debug: Kiểm tra dữ liệu trước khi cập nhật
//       console.log("Current Employee ID:", user.employee);
//       const employee = await Employee.findById(user.employee);
//       if (!employee) {
//         return res.status(404).json({
//           success: false,
//           message: "Employee not found",
//         });
//       }

//       console.log("Current Employee Data:", employee);
//       console.log("Updated Employee Data:", updatedEmployeeData);

//       // Cập nhật thông tin của Employee liên kết với User
//       const updatedEmployee = await Employee.findByIdAndUpdate(
//         user.employee,
//         updatedEmployeeData,
//         { new: true }
//       );

//       // Debug: In ra Employee đã được cập nhật
//       console.log("Updated Employee:", updatedEmployee);

//       // Kiểm tra nếu Employee không được cập nhật (sự thay đổi không được lưu)
//       if (!updatedEmployee) {
//         return res.status(500).json({
//           success: false,
//           message: "Failed to update employee information",
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Error updating user information:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update user information",
//       error: error.message,
//     });
//   }
// });



// const updateInfor = asyncHandler(async (req, res) => {
//   const { id, name, phone, email, address, birthday, gender } = req.body;
//   try {
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     if (user.employee) {
//       const updatedEmployeeData = {
//         name: name,  
//         email: email,
//         phone: phone,
//         address: address,
//         birthday: birthday,
//         gender: gender
//       };
//       if (req.file && req.file.path) {
//         updatedEmployeeData.images = [req.file.path];
//       }
//       const employee = await Employee.findById(user.employee);
//       if (!employee) {
//         return res.status(404).json({
//           success: false,
//           message: "Employee not found",
//         });
//       }
//       const updatedEmployee = await Employee.findByIdAndUpdate(
//         user.employee,
//         updatedEmployeeData,
//         { new: true }
//       );
//       if (!updatedEmployee) {
//         return res.status(500).json({
//           success: false,
//           message: "Failed to update employee information",
//         });
//       }
//     }
//     return res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Error updating user information:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update user information",
//       error: error.message,
//     });
//   }
// });

const updateInfor = asyncHandler(async (req, res) => {
  const { id, name, phone, email, address, birthday, gender } = req.body;

  try {
    // Step 1: Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Step 2: Check if the user has an associated employee
    if (user.employee) {
      // Step 3: Prepare the updated employee data
      const updatedEmployeeData = {
        name,
        email,
        phone,
        address,
        birthday,
        gender
      };

      // Step 4: Handle the uploaded file (image) if exists
      if (req.file && req.file.path) {
        updatedEmployeeData.images = [req.file.path]; // Assuming you want to store images as an array
      }

      // Step 5: Find and update the employee document
      const employee = await Employee.findById(user.employee);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Step 6: Update the employee record with the new data
      const updatedEmployee = await Employee.findByIdAndUpdate(
        user.employee,
        updatedEmployeeData,
        { new: true } // Return the updated employee document
      );

      if (!updatedEmployee) {
        return res.status(500).json({
          success: false,
          message: "Failed to update employee information",
        });
      }

      // Step 7: Update the user's email if necessary
      user.email = email;  // Update the user's email with the new email
      await user.save();   // Save the updated user

      // Step 8: Return the updated user and employee data in the response
      return res.status(200).json({
        success: true,
        user: {
          ...user.toObject(),
          employee: updatedEmployee,  // Include the updated employee data
        },
      });
    }

    // Step 9: If user does not have an associated employee, handle accordingly
    return res.status(400).json({
      success: false,
      message: "User has no associated employee.",
    });

  } catch (error) {
    console.error("Error updating user information:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user information",
      error: error.message,
    });
  }
});




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
  updateUserByAdmin,
  checkPassword,
  updateInfor
};
