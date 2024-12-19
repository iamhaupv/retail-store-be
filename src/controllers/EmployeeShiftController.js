const {EmployeeShift, Employee, Shift} = require("../models/index")
const expressAsyncHandler = require("express-async-handler");

const getAllEmployeeShift = expressAsyncHandler(async (req, res) => {
    const emp_shi = await EmployeeShift.find().populate({
        path: "employee",
        select: "name"
    }).populate({
        path: "shift",
        select: "name"
    });
    return res.status(200).json({
        success: emp_shi ? true : false,
        emp_shi: emp_shi ? emp_shi : "Cannot get emp_shi",
    });
});
const addEmployeeToShift = expressAsyncHandler(async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0)
      throw new Error("Missing input");
    const { employee, shift } = req.body;
    const emp = await Employee.findById(employee);
    if (!emp) throw new Error("Employee is not exist!");
    const shi = await Shift.findById(shift);
    if (!shi) throw new Error("Shift is not exist!");
    const emp_shi = await EmployeeShift.create(req.body)
    return res.status(200).json({
      success: emp_shi ? true : false,
      emp_shi: emp_shi ? emp_shi : "Cannot add employee to shift"
    });
  });
module.exports = {
    getAllEmployeeShift,
    addEmployeeToShift
}

