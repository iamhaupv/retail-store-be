const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {EmployeeController} = require("../controllers/index")
router.post("/", [verifyAccessToken, isAdmin], EmployeeController.createEmployee)
router.get("/", [verifyAccessToken, isAdmin], EmployeeController.getListEmployee)
module.exports = router