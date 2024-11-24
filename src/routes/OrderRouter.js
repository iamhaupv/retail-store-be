const OrderController = require("../controllers/OrderController")

const express = require("express")
const router = express.Router()
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken], OrderController.createOrder)
router.get("/", [verifyAccessToken], OrderController.getAllOrder)
module.exports = router