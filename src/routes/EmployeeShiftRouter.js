const {EmployeeShiftController} = require("../controllers/index")
const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
router.post("/add-emp-to-shi", [verifyAccessToken, isAdmin], EmployeeShiftController.addEmployeeToShift)
router.get("/", [verifyAccessToken, isAdmin], EmployeeShiftController.getAllEmployeeShift)

module.exports = router