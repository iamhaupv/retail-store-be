const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
// create product
const createProduct = asyncHandler(async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing inputs!" });
  }
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  } else {
    return res.status(400).json({ success: false, message: "Title is required!" });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "Missing input files!" });
  }
  req.body.images = req.files.map(el => el.path);
  const newProduct = await Product.create(req.body);
  return res.status(201).json({
    success: true,
    createdProduct: newProduct,
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
// const getProducts = asyncHandler(async (req, res) => {
//   const queries = { ...req.query };
//   // Tach cac truong dac biet ra khoi queries
//   const excludeFields = ["limit", "sort", "page", "fields"];
//   excludeFields.forEach((el) => delete queries[el]);
//   // format sang mongose
//   let queryString = JSON.stringify(queries);
//   queryString =  queryString.replace(
//     /\b(gte|gt|lt|lte)\b/g,
//     (macthedEl) => `$${macthedEl}`
//   );
//   const formatQueries = JSON.parse(queryString);
//   console.log(queryString);
//   if (queries?.title)
//     formatQueries.title = { $regex: queries.title, $options: "i" };

//   let queryCommand = Product.find(queries);
//   queryCommand.exec(async (err, response) => {
//     if (err) throw new Error(err.message);
//     const counts = await Product.find(formatQueries).countDocuments();
//     return res.status(200).json({
//       success: response ? true : false,
//       products: response ? response : "Cannot get products",
//       counts,
//     });
//   });
// });
// Filtering, sorting & pagination
const getProducts = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  // Tach cac truong dac biet ra khoi queries
  const excludeFields = ["limit", "sort", "page", "fields"];
  excludeFields.forEach((el) => delete queries[el]);
  // format sang mongose
  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(
    /\b(gte|gt|lt|lte)\b/g,
    (macthedEl) => `$${macthedEl}`
  );
  const formatQueries = JSON.parse(queryString);
  let colorqueryOj = {};
  // Filter
  if (queries?.title)
    formatQueries.title = { $regex: queries.title, $options: "i" };
  if (queries?.category)
    formatQueries.category = {
      $regex: queries.category,
      $options: "i",
    };
  if (queries?.subcategory)
    formatQueries.subcategory = {
      $regex: queries.subcategory,
      $options: "i",
    };
  if (queries?.color) {
    delete formatQueries.color;
    const colorArr = queries.color?.split(",");
    const colorQuery = colorArr.map((el) => ({
      color: { $regex: el, $options: "i" },
    }));
    colorqueryOj = { $or: colorQuery };
  }
  if (req.query.q) {
    delete formatQueries.q;
    formatQueries["$or"] = [
      { title: { $regex: req.query.q, $options: "i" } },
      { brand: { $regex: req.query.q, $options: "i" } },
      { category: { $regex: req.query.q, $options: "i" } },
    ];
  }
  const q = { ...colorqueryOj, ...formatQueries };
  formatQueries.color = { $regex: queries.color, $options: "i" };
  let queryCommand = Product.find(q);

  // 2) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    queryCommand = queryCommand.sort(sortBy);
  }

  // Filter limit
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    queryCommand = queryCommand.select(fields);
  }

  // Pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || process.env.LIMIT_PRODUCTS;
  const skip = (page - 1) * limit;
  queryCommand.skip(skip).limit(limit);
  //Excute query
  queryCommand.exec(async (err, response) => {
    if (err) throw new Error(err.message);
    const counts = await Product.find(q).countDocuments();
    return res.status(200).json({
      success: response ? true : false,
      products: response ? response : "Cannot get products",
      counts,
    });
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
const deleteProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const deleteProduct = await Product.findByIdAndDelete(pid);
  return res.status(200).json({
    success: deleteProduct ? true : false,
    deleteProduct: deleteProduct ? deleteProduct : "Cannot delete product!",
  });
});
//  upload img
const uploadImageProduct = asyncHandler(async(req, res) => {
  const {pid} = req.params
  if(!req.files) throw new Error("Missing input!")
  const response = await Product.findByIdAndUpdate(pid, {$push: {images: {$each: req.files.map(el => el.path)}}}, {new: true})
  return res.status(200).json({
    status: response ? true : false,
    updateProduct: response ? response : "Cannot upload image product"
  })
})
module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  uploadImageProduct
};
