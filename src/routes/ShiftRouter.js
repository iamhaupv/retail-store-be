const express = require("express")
const router = express.Router()
const {ShiftController} = require("../controllers/index")
const {verifyAccessToken, isAdmin} = require("../middlewares/verifyToken")
// create shift
router.post("/create-shift", [verifyAccessToken, isAdmin], ShiftController.createShift)
// delete shift
router.delete("/:sid", [verifyAccessToken, isAdmin], ShiftController.deleteShift)
// get list shifts
router.get("/", [verifyAccessToken, isAdmin], ShiftController.getShifts)
module.exports = router