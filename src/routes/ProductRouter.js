const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers/index");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
// crate product
router.post("/", [verifyAccessToken, isAdmin], ProductController.createProduct);
// get product by id
router.get("/:pid", ProductController.getProduct);
module.exports = router;
