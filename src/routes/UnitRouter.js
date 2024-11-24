const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {UnitController} = require("../controllers/index")
router.post("/create-unit", [verifyAccessToken, isAdmin], UnitController.createUnit)
router.post("/filter-unit-by-name", [verifyAccessToken, isAdmin], UnitController.filterUnitByName)
router.post("/filter-convert-quantity-by-unit-name", [verifyAccessToken], UnitController.filterConvertQuantityByUnitName)
router.get("/", [verifyAccessToken, isAdmin], UnitController.getAllUnit)
module.exports = router