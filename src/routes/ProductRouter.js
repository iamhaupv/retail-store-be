const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers/index");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken, isAdmin], ProductController.createProduct);
module.exports = router;
