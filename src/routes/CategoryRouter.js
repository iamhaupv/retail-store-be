const express = require("express");
const router = express.Router();
const { CategoryController } = require("../controllers/index");
const { isAdmin, verifyAccessToken } = require("../middlewares/verifyToken");
router.post(
  "/",
  [verifyAccessToken, isAdmin],
  CategoryController.createCategory
);
router.get("/", CategoryController.getListCategory)
module.exports = router;
