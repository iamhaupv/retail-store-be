const expressAsyncHandler = require("express-async-handler");
const { Employee } = require("../models/index");
// create employee
const createEmployee = expressAsyncHandler( async(req, res) => {
    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(400).json({
        success: false,
        mes: "Missing input!",
      });
    const { email } = req.body;
    const employeeExist = await Employee.findOne({ email: email });
    if (employeeExist) {
      throw new Error("Cannot create new employee!");
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "Missing input files!" });
    }
    req.body.images = req.files.map(el => el.path);
    const newEmployee = await Employee.create(req.body);
    return res.status(200).json({
      success: newEmployee ? true : false,
      data: newEmployee ? newEmployee : "Cannot create new employee",
    });
});
// get list employee
const getListEmployee = expressAsyncHandler(async (req, res) => {
    try {
      const employees = await Employee.find();
      return res.status(200).json({
        success: employees ? true : false,
        data: employees ? employees : "Cannot get list employees!",
      });
    } catch (error) {
      throw new Error(error);
    }
  })
module.exports = {
  createEmployee,
  getListEmployee,
};
