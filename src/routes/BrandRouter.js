const express = require("express")
const router = express.Router()
const {BrandController} = require("../controllers/index")
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config")

router.post("/", [verifyAccessToken, isAdmin], uploader.array("images", 10),BrandController.createBrand)
router.get("/", BrandController.getBrands)
module.exports = router