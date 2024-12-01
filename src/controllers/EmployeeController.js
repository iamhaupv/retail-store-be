const expressAsyncHandler = require("express-async-handler");
const { Employee } = require("../models/index");
// create employee
const createEmployee = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    return res.status(400).json({
      success: false,
      mes: "Missing input!",
    });
  const { email, phone } = req.body;
  const employeeExist = await Employee.findOne({ $or: [{ email: email }, { phone: phone }] });
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
    const employees = await Employee.find({isDisplay: true}).populate({
      path: "user",
      select: "email"
    }).sort({ createdAt: -1 }).exec();
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
    return res.status(400).json({ message: "Tên không được để trống!" });
  }
  const employees = await Employee.find({
    $and: [
      { name: { $regex: name, $options: "i" } }, // Điều kiện tìm theo tên
      { isDisplay: true },                       // Điều kiện isDisplay: true
    ],
  });

  return res.status(200).json({
    success: employees ? true : false,
    employees: employees ? employees : "Cannot get employees!",
  });
});

const changeIsDisplayEmployee = expressAsyncHandler(async (req, res) => {
  const { pid } = req.params;
  const isDisplay = await Employee.findByIdAndUpdate(
    pid,
    { isDisplay: req.body.isDisplay },
    { new: true }
  );
  return res.status(200).json({
    success: isDisplay ? true : false,
    isDisplay: isDisplay
      ? isDisplay
      : "Cannot change status is display product!",
  });
});


const updateEmployee = expressAsyncHandler(async (req, res) => {
  const { pid } = req.body;
  const updateProduct = await Employee.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updateProduct ? true : false,
    updateProduct: updateProduct ? updateProduct : "Cannot update product!",
  });
});

const lastIdNumber = expressAsyncHandler(async (req, res) => {
  try {
    // Truy vấn sản phẩm có id cao nhất
    const lastProduct = await Employee.findOne().sort({ id: -1 }).limit(1);
    // Nếu không có sản phẩm nào, đặt id đầu tiên là 1
    const newId = lastProduct ? lastProduct.id + 1 : 1;
    // Trả về id mới
    res.status(200).json({
      success: true,
      newId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy id cuối cùng: " + error.message,
    });
  }
});

module.exports = {
  createEmployee,
  getListEmployee,
  findEmployeeByName,
  changeIsDisplayEmployee,
  updateEmployee,
  lastIdNumber
};
