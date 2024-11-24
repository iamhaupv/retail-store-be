const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {EmployeeController} = require("../controllers/index")
const uploader = require("../config/cloudinary.config")
router.post("/", [verifyAccessToken, isAdmin], uploader.array("images"),EmployeeController.createEmployee)
router.get("/", [verifyAccessToken, isAdmin], EmployeeController.getListEmployee)
router.post("/filter-by-name", [verifyAccessToken, isAdmin], EmployeeController.findEmployeeByName)
module.exports = router