const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers/index");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config")
// crate product
router.post("/", [verifyAccessToken, isAdmin], ProductController.createProduct);
// get all product
router.get("/", ProductController.getProducts)
// delete product
router.delete("/:pid", [verifyAccessToken, isAdmin], ProductController.deleteProduct)
// update product
router.put("/:pid", [verifyAccessToken, isAdmin], ProductController.updateProduct)
// get product by id
router.get("/:pid", ProductController.getProduct);
// upload image
router.put("/upload-image/:pid", [verifyAccessToken, isAdmin], uploader.array('images', 10),ProductController.uploadImageProduct)
module.exports = router;
