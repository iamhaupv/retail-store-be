const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers/index");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config")
// crate product
router.post("/", [verifyAccessToken, isAdmin], uploader.array('images', 10), ProductController.createProduct);
// get all product
router.get("/", ProductController.getProducts)
// delete product
router.delete("/:pid", [verifyAccessToken, isAdmin], ProductController.deleteProduct)
// update product
router.put("/:pid", [verifyAccessToken, isAdmin], ProductController.updateProduct)
// change is display
router.put("/is-display/:pid", [verifyAccessToken, isAdmin], ProductController.changeIsDisplay)
// get list products
router.get("/products", [verifyAccessToken, isAdmin], ProductController.getAllProducts)
// get list product with status in_stock
router.get("/in_stock", [verifyAccessToken, isAdmin], ProductController.getAllProductWithStatus_IN_STOCK)
// get list product with status out_of_stock
router.get("/out_of_stock", [verifyAccessToken, isAdmin], ProductController.getAllProductWithStatus_OUT_OF_STOCK)
// get product by id
router.get("/:pid", ProductController.getProduct);
// upload image
router.put("/upload-image/:pid", [verifyAccessToken, isAdmin], uploader.array('images', 10),ProductController.uploadImageProduct)
module.exports = router;
