const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {ShelfController} = require("../controllers/index")
router.post("/", [verifyAccessToken, isAdmin], ShelfController.createShelf)
router.get("/", [verifyAccessToken, isAdmin], ShelfController.getListShelf)
module.exports = router