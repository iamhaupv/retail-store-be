const express = require("express")
const router = express.Router()
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
const {EmployeeController} = require("../controllers/index")
const uploader = require("../config/cloudinary.config")
router.post("/", [verifyAccessToken, isAdmin], uploader.array("images", 10),EmployeeController.createEmployee)
router.get("/", [verifyAccessToken, isAdmin], EmployeeController.getListEmployee)
module.exports = router