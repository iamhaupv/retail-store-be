const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {WarehouseReceiptController} = require("../controllers/index")
// create warehosue receipt
router.post("/create-warehouse-receipt", [verifyAccessToken, isAdmin], WarehouseReceiptController.createWarehouseReceipt)
// get all warehouse receipt 
router.get("/", [verifyAccessToken, isAdmin], WarehouseReceiptController.getAllWarehouseReceipt)
router.post("/:id", [verifyAccessToken, isAdmin], WarehouseReceiptController.changeIsDisplay)
// last id receipt
router.get("/last-id", [verifyAccessToken, isAdmin], WarehouseReceiptController.lastIdReceipt)
module.exports = router