const express = require("express")
const router = express.Router()
const {BrandController} = require("../controllers/index")
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const { route } = require("./UserRouter");

router.post("/", [verifyAccessToken, isAdmin], BrandController.createBrand)
router.get("/", BrandController.getBrans)
module.exports = router