const express = require("express");
const router = express.Router();
const { UserController } = require("../controllers/index");
const { verifyAccessToken } = require("../middlewares/verifyToken");
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", verifyAccessToken, UserController.getCurrent);
module.exports = router;
