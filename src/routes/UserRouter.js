const express = require("express");
const router = express.Router();
const { UserController } = require("../controllers/index");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config")
// register user
router.post("/register", UserController.register);
//  login user
router.post("/login", UserController.login);
// get user
router.get("/current", verifyAccessToken, UserController.getCurrent);
// refresh token
router.post("/refresh-token", UserController.refreshAccessToken);
// log out user
router.get("/logout", UserController.logout);
// check password
router.post("/check-password", [verifyAccessToken], UserController.checkPassword)
// forgot password
router.post("/forgotpassword", UserController.forgotPassword);
// update infor
router.put("/update-infor", [verifyAccessToken], uploader.single('image'), UserController.updateInfor)
// reset password
router.put("/resetpassword", UserController.resetPassword);
//  get all user
router.get("/", [verifyAccessToken, isAdmin], UserController.getUsers);
// delete user
router.delete("/", [verifyAccessToken, isAdmin], UserController.deleteUser);
// update user
router.put("/current", verifyAccessToken, UserController.updateUser);
// update user
router.put("/:uid", [verifyAccessToken, isAdmin], UserController.updateUserByAdmin);
module.exports = router;
