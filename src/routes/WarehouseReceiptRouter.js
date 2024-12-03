const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {WarehouseReceiptController} = require("../controllers/index")
// create warehosue receipt
router.post("/create-warehouse-receipt", [verifyAccessToken, isAdmin], WarehouseReceiptController.createWarehouseReceipt)
// 
router.post("/search-product-id", [verifyAccessToken], WarehouseReceiptController.searchProductById)
router.post("/search-product-name", [verifyAccessToken], WarehouseReceiptController.searchProductByName)
router.post("/filter-product-by-category-name-in-recepit", [verifyAccessToken, isAdmin], WarehouseReceiptController.filterProductByCategoryNameInReceipt)
// get all warehouse receipt 
router.get("/", [verifyAccessToken, isAdmin], WarehouseReceiptController.getAllWarehouseReceipt)
// 
router.post("/filter-receipt-by-date", [verifyAccessToken, isAdmin], WarehouseReceiptController.filterReceiptByDate)
// 
router.get("/sum", [verifyAccessToken, isAdmin], WarehouseReceiptController.sumTotalAmountReceipt)
//
router.post("/filter-by-condition", [verifyAccessToken, isAdmin], WarehouseReceiptController.getFilteredWarehouseReceipts)
router.post("/filter-id-PNK", [verifyAccessToken, isAdmin], WarehouseReceiptController.filterByIdPNK)
router.post("/:id", [verifyAccessToken, isAdmin], WarehouseReceiptController.changeIsDisplay)
// last id receipt
router.get("/last-id", [verifyAccessToken, isAdmin], WarehouseReceiptController.lastIdReceipt)

module.exports = router