const OrderController = require("../controllers/OrderController")

const express = require("express")
const router = express.Router()
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken], OrderController.createOrder)
router.get("/", [verifyAccessToken], OrderController.getAllOrder)
router.post("/filter-by-emloyee-name", [verifyAccessToken, isAdmin], OrderController.filterOrderByEmployee)
router.post("/filter-by-date", [verifyAccessToken, isAdmin], OrderController.filterOrderByDate)
router.post("/filter-by-condition", [verifyAccessToken], OrderController.filterOrders)
router.get("/sum", [verifyAccessToken, isAdmin], OrderController.sumTotalAmount)
module.exports = router