const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {UnitController} = require("../controllers/index")
router.post("/create-unit", [verifyAccessToken, isAdmin], UnitController.createUnit)
router.get("/", [verifyAccessToken, isAdmin], UnitController.getAllUnit)
module.exports = router