const { Brand } = require("../models/index");
const asyncHandle = require("express-async-handler");
// create Brand
const createBrand = asyncHandle(async (req, res) => {
  // Kiểm tra xem có dữ liệu trong req.body không
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing input!" });
  }
  const { name } = req.body;
  const isBrand = await Brand.findOne({ name: name });
  if (isBrand) {
    return res.status(400).json({
      success: false,
      message: "Brand name already exists!",
    });
  }
  const newBrand = await Brand.create(req.body);
  return res.status(201).json({
    success: true,
    newBrand: newBrand,
  });
});

// get list brand
const getBrans = async (req, res) => {
  try {
    const brands = await Brand.find();
    return res.status(200).json({
      success: brands ? true : false,
      brands: brands ? brands : "Cannot get brand!"
    })
  } catch (error) {
    throw new Error(error)
  }
}
module.exports = {
  createBrand,
  getBrans
};
