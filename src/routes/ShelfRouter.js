const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {ShelfController} = require("../controllers/index")
router.post("/", [verifyAccessToken, isAdmin], ShelfController.createShelf)
router.get("/", [verifyAccessToken, isAdmin], ShelfController.getListShelf)
router.post("/filter-product-by-name-in-shelf", [verifyAccessToken, isAdmin], ShelfController.filterProductByNameInShelf)
router.get("/filter-all-product-in-shelf", [verifyAccessToken, isAdmin], ShelfController.filterAllProductInShelf)
router.post("/filter-by-shelf", [verifyAccessToken, isAdmin], ShelfController.filterProductByShelf)
router.post("/filter-product-multi-condition", [verifyAccessToken, isAdmin], ShelfController.filterProductMultiCondition)
router.get("/get-sum-quantity-product-by-name-in-shelf", [verifyAccessToken], ShelfController.getSumQuantityProductInShelf)
router.get("/filter-category-by-product-in-shelf", [verifyAccessToken, isAdmin], ShelfController.filterCategoryByProductInShelf)
module.exports = router