const EmployeeShift = require("../models/EmployeeShift");
const { Shift, Employee } = require("../models/index");
const asyncHandler = require("express-async-handler");
// create shift
const createShift = asyncHandler(async (req, res) => {
  if (!req.body && Object.keys(req.body).length === 0)
    throw new Error("Missing input!");
  const { name } = req.body;
  const shiftName = await Shift.findOne({ name: name });
  if (shiftName) throw new Error("Shift name is exist!");
  const newShift = await Shift.create(req.body);

  return res.status(201).json({
    success: newShift ? true : false,
    newShift: newShift ? newShift : "Cannot create shift!",
  });
});
// delete shift
const deleteShift = asyncHandler(async (req, res) => {
  const { sid } = req.params;
  const delShift = await Shift.findOneAndDelete(sid);
  return res.status(201).json({
    success: delShift ? true : false,
    delShift: delShift ? delShift : "Cannot delete shift!",
  });
});
// get list shift
const getShifts = asyncHandler(async (req, res) => {
  const shifts = await Shift.find();
  return res.status(200).json({
    success: shifts ? true : false,
    shifts: shifts ? shifts : "Cannot get list shifts!",
  });
});

module.exports = {
  createShift,
  deleteShift,
  getShifts,
};
