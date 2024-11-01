const expressAsyncHandler = require("express-async-handler");
const { Employee } = require("../models/index");
// create employee
const createEmployee = expressAsyncHandler(async (req, res) => {
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
    return res
      .status(400)
      .json({ success: false, message: "Missing input files!" });
  }
  req.body.images = req.files.map((el) => el.path);
  const newEmployee = await Employee.create(req.body);
  return res.status(200).json({
    success: newEmployee ? true : false,
    data: newEmployee ? newEmployee : "Cannot create new employee",
  });
});
// get list employee
const getListEmployee = expressAsyncHandler(async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 }).exec();
    return res.status(200).json({
      success: employees ? true : false,
      data: employees ? employees : "Cannot get list employees!",
    });
  } catch (error) {
    throw new Error(error);
  }
});
// find employee by name 
const findEmployeeByName = expressAsyncHandler(async (req, res) => {
  const { name } = req.body; // Lấy tên từ body

  if (!name) {
    return res.status(400).json({ message: 'Tên không được để trống!' });
  }

  try {
    // Tìm tất cả nhân viên có tên chứa chuỗi 'name'
    const employees = await Employee.find({ name: { $regex: name, $options: 'i' } });

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên nào!' });
    }

    return res.status(200).json(employees);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ!', error: error.message });
  }
});

module.exports = {
  createEmployee,
  getListEmployee,
  findEmployeeByName
};
