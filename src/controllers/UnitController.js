const expressAsyncHandler = require("express-async-handler")
const {Unit} = require("../models/index")
// create unit
const createUnit = expressAsyncHandler(async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: "Missing input!" });
    }
    const unit = await Unit.findOne({ name: req.body.name }); 
    if (unit) {
        return res.status(400).json({ success: false, message: "Unit name already exists!" });
    }
    req.body.isDisplay = true;
    const newUnit = await Unit.create(req.body);
    return res.status(201).json({
        success: true,
        newUnit: newUnit,
    });
});

// get all unit
const getAllUnit = expressAsyncHandler(async(req, res) => {
    const units = await Unit.find({isDisplay: true})
    return res.status(200).json({
        success: units ? true : false,
        units: units ? units : "Cannot get list unit!"
    })
})
module.exports = {
    createUnit,
    getAllUnit
}