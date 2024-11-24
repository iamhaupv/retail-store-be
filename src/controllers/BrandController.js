const expressAsyncHandler = require("express-async-handler");
const { Brand, Product } = require("../models/index");
const asyncHandle = require("express-async-handler");
// create Brand
const createBrand = asyncHandle(async (req, res) => {
  // Kiểm tra xem có dữ liệu trong req.body không
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing input!" });
  }
  const { name } = req.body;
  const isBrand = await Brand.findOne({ name });
  console.log(isBrand);

  if (isBrand) {
    return res.status(400).json({
      success: false,
      message: "Brand name already exists!",
    });
  }
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Missing input files!" });
  }
  req.body.images = req.files.map((el) => el.path);
  const newBrand = await Brand.create(req.body);
  return res.status(201).json({
    success: true,
    newBrand: newBrand,
  });
});

// get list brand
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 }).exec();
    return res.status(200).json({
      success: brands ? true : false,
      brands: brands ? brands : "Cannot get brand!",
    });
  } catch (error) {
    throw new Error(error);
  }
};

// get category by brand
const filterCategoryByBrand = expressAsyncHandler(async (req, res) => {
  const { name } = req.body;

  // Tìm thương hiệu
  const brand = await Brand.findOne({ name });
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Brand not found",
    });
  }

  // Tìm tất cả các sản phẩm của thương hiệu đó
  const products = await Product.find({ brand: brand._id }).populate(
    "category"
  );

  // Lấy tất cả các danh mục từ sản phẩm
  const categories = products
    .map((product) => product.category)
    .filter(Boolean);

  // Loại bỏ các danh mục trùng lặp
  const uniqueCategories = Array.from(
    new Set(categories.map((cat) => cat._id))
  ).map((id) => categories.find((cat) => cat._id.equals(id)));

  return res.status(200).json({
    success: true,
    brand,
    categories: uniqueCategories, // Trả về danh mục không trùng lặp
  });
});
// filter brand by multi condition
const filterBrandByMultiCondition = expressAsyncHandler(async (req, res) => {
  const { name, phone, supplyName } = req.body;
  const query = {};
  if (name) {
    query.name = { $regex: name, $options: "i" };
  }
  if (phone) {
    query.phone = { $regex: phone, $options: "i" };
  }
  if (supplyName) {
    query.supplyName = { $regex: supplyName, $options: "i" };
  }
  const brands = await Brand.find(query);
  return res.status(200).json({
    success: true,
    brands: brands,
  });
});

module.exports = {
  createBrand,
  getBrands,
  filterCategoryByBrand,
  filterBrandByMultiCondition,
};
