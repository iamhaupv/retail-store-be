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
router.put("/", [verifyAccessToken, isAdmin], uploader.array("images", 10), ProductController.updateProduct)
// change is display
router.put("/is-display/:pid", [verifyAccessToken, isAdmin], ProductController.changeIsDisplay)
// get list products
router.get("/products", [verifyAccessToken], ProductController.getAllProducts)
// get list product with status in_stock
router.get("/in_stock", [verifyAccessToken], ProductController.getAllProductWithStatus_IN_STOCK)
// get list product with status out_of_stock
router.get("/out_of_stock", [verifyAccessToken], ProductController.getAllProductWithStatus_OUT_OF_STOCK)
// get list product by brand
router.post("/filter-by-brand", [verifyAccessToken], ProductController.productFilterByBrandName)
// 
router.get("/filter-all-product-by-receipt", [verifyAccessToken], ProductController.productByAllReceipt)
//
router.post("/filter-product-multi-condition", [verifyAccessToken], ProductController.filterProductMultiCondition)
// 
router.post("/filter-product-by-status", [verifyAccessToken], ProductController.filterProductByStatus)
//
router.patch("/update-price", [verifyAccessToken, isAdmin], ProductController.updatePriceProduct)
//
router.get("/product-sumquantity", [verifyAccessToken], ProductController.filterProductSumQuantity)
router.get("/last-id-number", [verifyAccessToken, isAdmin], ProductController.lastIdNumber)
router.post("/add-discount", [verifyAccessToken, isAdmin], ProductController.addDiscount)
//
router.post("/filter-id", [verifyAccessToken], ProductController.filterProductById)
//
router.post("/filter-product-by-name", [verifyAccessToken], ProductController.filterProductByName) 
// 
router.post("/filter-product-by-brand", [verifyAccessToken], ProductController.filterProductByBrand) 
//
router.post("/list-receipts", [verifyAccessToken], ProductController.filterReceiptByProduct)
//
router.post("/filter-price-by-product-name", [verifyAccessToken], ProductController.filterPriceByProductName)
//
router.post("/product-pagination", [verifyAccessToken], ProductController.getAllProductsPagination) 
//
router.post("/add-product-to-shelf", [verifyAccessToken, isAdmin], ProductController.addProductToShelf)
// get product by id
router.get("/:pid", ProductController.getProduct);
// upload image
router.put("/upload-image/:pid", [verifyAccessToken, isAdmin], uploader.array('images', 10),ProductController.uploadImageProduct)
module.exports = router;
