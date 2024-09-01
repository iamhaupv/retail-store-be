const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
// create product
const createProduct = asyncHandler(async (req, res) => {
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs!");
  if (req.body && req.body.title) req.body.slug = slugify(req.body.title);
  const newProduct = await Product.create(req.body);
  return res.status(200).json({
    success: newProduct ? true : false,
    createdProduct: newProduct ? newProduct : "Cannot create new product!s",
  });
});
// get product by id
const getProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const product = await Product.findById(pid);
  return res.status(200).json({
    success: product ? true : false,
    productData: product ? product : "Cannot get product!",
  });
});
// get all product
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  return res.status(200).json({
    success: products ? true : false,
    productData: products ? products : "Cannot get products!",
  });
});
// update product by id
const updateProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (req.body && req.body.title) req.body.slug = slugify(req.body.title);
  const updateProduct = await Product.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updateProduct ? true : false,
    updateProduct: updateProduct ? updateProduct : "Cannot update product!",
  });
});
// delete product by id
const deleteProduct = asyncHandler(async(req, res) => {
    const {pid} = req.params
    const deleteProduct = await Product.findByIdAndDelete(pid)
    return res.status(200).json({
        success: deleteProduct ? true : false,
        deleteProduct: deleteProduct ? deleteProduct : "Cannot delete product!"
    })
})
module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct
};
