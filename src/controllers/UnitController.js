const expressAsyncHandler = require("express-async-handler");
const { Unit } = require("../models/index");
// create unit
const createUnit = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing input!" });
  }
  const unit = await Unit.findOne({ name: req.body.name });
  if (unit) {
    return res
      .status(400)
      .json({ success: false, message: "Unit name already exists!" });
  }
  req.body.isDisplay = true;
  const newUnit = await Unit.create(req.body);
  return res.status(201).json({
    success: true,
    newUnit: newUnit,
  });
});

// get all unit
const getAllUnit = expressAsyncHandler(async (req, res) => {
  const units = await Unit.find({ isDisplay: true });
  return res.status(200).json({
    success: units ? true : false,
    units: units ? units : "Cannot get list unit!",
  });
});
const filterUnitByName = expressAsyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên đơn vị không được để trống",
    });
  }

  try {
    // Tìm kiếm đơn vị theo tên với regex
    const units = await Unit.find({ name: { $regex: name, $options: "i" } });

    return res.status(200).json({
      success: true,
      units: units.length > 0 ? units : "Không tìm thấy đơn vị nào",
    });
  } catch (error) {
    console.error("Error fetching units:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đơn vị",
    });
  }
});
const filterConvertQuantityByUnitName = expressAsyncHandler(
  async (req, res) => {
    const { name } = req.body;
    const unit = await Unit.findOne({ name });
    return res.status(200).json({
      success: unit ? true : false,
      unit: unit ? unit : "Cannot get unit",
    });
  }
);
const updateUnit = expressAsyncHandler(async (req, res) => {
  const { pid } = req.body;
  const updateUnit = await Unit.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updateUnit ? true : false,
    updateUnit: updateUnit ? updateUnit : "Cannot update unit!",
  });
});
const isDisplay = expressAsyncHandler(async(req, res) => {
    if(!req.body || Object.keys(req.body).length === 0) throw new Error("Missing input!")
    const {id} = req.body
    const unit = await Unit.findOneAndUpdate({_id: id}, {isDisplay: false}, {new: true})
    return res.status(200).json({
        success: isDisplay ? true : false,
        unit: unit ? unit : "Cannot is display unit!"
    })
})
module.exports = {
  createUnit,
  getAllUnit,
  filterUnitByName,
  filterConvertQuantityByUnitName,
  updateUnit,
  isDisplay
};
