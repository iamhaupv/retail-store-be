const Product = require("../models/Product");
const expressAsyncHandler = require("express-async-handler");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const { Brand, Shelf, WarehouseReceipt } = require("../models");
const { default: mongoose } = require("mongoose");
// create product
const createProduct = asyncHandler(async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing inputs!" });
  }
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Title is required!" });
  }
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Missing input files!" });
  }
  req.body.images = req.files.map((el) => el.path);
  req.body.status = "out_of_stock";
  req.body.isDisplay = true;
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
const uploadImageProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (!req.files) throw new Error("Missing input!");
  const response = await Product.findByIdAndUpdate(
    pid,
    { $push: { images: { $each: req.files.map((el) => el.path) } } },
    { new: true }
  );
  return res.status(200).json({
    status: response ? true : false,
    updateProduct: response ? response : "Cannot upload image product",
  });
});
// pagination
const getAllProducts = asyncHandler(async (req, res) => {
  // req.query là đối tượng chứa tham số được gửi qua url vd: page, limit
  // /api/products?page=2&limit=5
  const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
  const limit = parseInt(req.query.limit) || 5; // Số sản phẩm mỗi trang, mặc định là 5
  const skip = (page - 1) * limit; // Số lượng sản phẩm cần bỏ qua

  const products = await Product.find({ isDisplay: true })
    .populate("brand")
    .populate("category")
    .sort({ createdAt: -1 })
    .exec();
  // const products = await Product.find({isDisplay: true}).populate("brand").skip(skip).limit(limit);
  // const products = await WarehouseReceipt.find().populate({
  //   path: "products.product",
  //   populate: [
  //     {path: "brand", select: "name",},
  //     {path: "category", select: "name"}
  //   ],
  // });

  const totalProducts = await Product.countDocuments(); // Tổng số sản phẩm

  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Cannot get products!",
    currentPage: page,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limit), // Làm tròn đến số nguyên gần nhất vd 4.3 ==> 5
  });
});

// get list product status in_stock
const getAllProductWithStatus_IN_STOCK = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "in_stock" });
  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Cannot get list products with status in",
  });
});
// get list product status out_of_stock
const getAllProductWithStatus_OUT_OF_STOCK = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "out_of_stock" });
  // const products = await Product.find({ isDisplay: true });
  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Cannot get list products with status in",
  });
});
//  change is display
const changeIsDisplay = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const isDisplay = await Product.findByIdAndUpdate(
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
// filter by brand
const productFilterByBrandName = expressAsyncHandler(async (req, res) => {
  const { name } = req.body;

  // Check if the name is empty
  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Brand name cannot be empty",
    });
  }

  try {
    // Use a regex to find brands matching the partial name (case-insensitive)
    const brand = await Brand.findOne({
      name: { $regex: name, $options: "i" },
    });
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Find products that belong to this brand
    const products = await Product.find({ brand: brand._id });

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found for this brand",
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Cannot get list of products!",
      error: error.message,
    });
  }
});
// fiter product by receipt in shelf
// const productByAllReceipt = expressAsyncHandler(async (req, res) => {
//   const products = await WarehouseReceipt.find()
//     .populate({
//       path: "products.product",
//       populate: [
//         { path: "brand", select: "name" },
//         { path: "category", select: "name" },
//       ],
//     })
//     .sort({ createdAt: -1 })
//     .exec();
//   return res.status(200).json({
//     success: products ? true : false,
//     products: products ? products : "Cannot get list products",
//   });
// });

//
const productByAllReceipt = expressAsyncHandler(async (req, res) => {
  try {
    const receipts = await WarehouseReceipt.find()
      .populate({
        path: 'products.product',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    // Lọc thông tin sản phẩm từ các phiếu
    const products = receipts.map(receipt => {
      return receipt.products.map(item => {
        return {
          idPNK: receipt.idPNK,
          images: item.product.images,
          title: item.product.title,
          category: item.product.category?.name, // Sử dụng toán tử optional chaining
          brand: item.product.brand?.name, // Sử dụng toán tử optional chaining
          quantity: item.quantity,
          _id: item.product._id,
          warehouseReceipt: receipt._id
        };
      });
    }).flat(); // Làm phẳng mảng để có cấu trúc tốt hơn

    return res.status(200).json({
      success: products.length > 0,
      products: products.length > 0 ? products : 'Cannot get list of products',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
const filterProductByName = expressAsyncHandler(async (req, res) => {
  const { title } = req.body;

  // Kiểm tra xem title có rỗng hoặc chỉ chứa khoảng trắng không
  if (!title || title.trim() === "") {
    return res.status(200).json({
      success: false,
      products: []
    });
  }

  const products = await Product.find({ title: { $regex: title, $options: "i" } }).populate("brand");
  
  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : "Cannot get products"
  });
});

const addProductToShelf = expressAsyncHandler(async (req, res) => {
  const { name, products } = req.body;

  if (!name || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Shelf name and products are required" });
  }

  // Tìm kệ theo tên
  const shelf = await Shelf.findOne({ name });
  if (!shelf) {
      return res.status(404).json({ message: "Shelf not found" });
  }

  // Duyệt qua các sản phẩm và thêm vào kệ
  for (const { product, quantity, warehouseReceipt } of products) {
      // Kiểm tra tính hợp lệ của productId
      if (!mongoose.Types.ObjectId.isValid(product)) {
          return res.status(400).json({ message: `Invalid product ID: ${product}` });
      }

      // Kiểm tra tính hợp lệ của receiptId
      if (!mongoose.Types.ObjectId.isValid(warehouseReceipt)) {
          return res.status(400).json({ message: `Invalid warehouse receipt ID: ${warehouseReceipt}` });
      }

      // Tìm sản phẩm trong kệ
      const existingProduct = shelf.products.find(p => 
          p.product.toString() === product && p.warehouseReceipt.toString() === warehouseReceipt
      );

      if (existingProduct) {
          // Cập nhật số lượng nếu sản phẩm và phiếu nhập kho đã tồn tại
          existingProduct.quantity += quantity;
      } else {
          // Thêm sản phẩm mới nếu chưa tồn tại
          shelf.products.push({ product: product, quantity, warehouseReceipt: warehouseReceipt });
      }

      // Cập nhật số lượng trong phiếu nhập kho
      const receipt = await WarehouseReceipt.findById(warehouseReceipt);
      if (!receipt) {
          return res.status(404).json({ message: `Warehouse receipt not found: ${warehouseReceipt}` });
      }

      const productInReceipt = receipt.products.find(p => p.product.toString() === product);
      if (productInReceipt) {
          // Trừ số lượng trong phiếu nhập kho
          productInReceipt.quantity -= quantity;

          // Nếu số lượng trong phiếu nhập kho bằng 0, có thể xóa sản phẩm khỏi phiếu nhập kho
          if (productInReceipt.quantity <= 0) {
              receipt.products = receipt.products.filter(p => p.product.toString() !== product);
          }
          await receipt.save(); // Lưu thay đổi vào phiếu nhập kho
      } else {
          return res.status(400).json({ message: `Product not found in warehouse receipt: ${product}` });
      }
  }

  // Tính toán tổng số lượng sản phẩm trên kệ
  shelf.quantity = shelf.products.reduce((total, p) => total + (p.quantity || 0), 0);

  // Lưu các thay đổi vào cơ sở dữ liệu
  await shelf.save();

  // Trả về kệ đã cập nhật
  const updatedShelf = await Shelf.findById(shelf._id).populate({
      path: 'products.product',
  });

  res.status(200).json({
      success: true,
      message: "Products added to shelf successfully and updated in warehouse receipts",
      shelf: updatedShelf,
  });
});

const filterProductByStatus = expressAsyncHandler(async (req, res) => {
  const { status } = req.body;

  // Kiểm tra xem title có rỗng hoặc chỉ chứa khoảng trắng không
  if (!status || status.trim() === "") {
    return res.status(200).json({
      success: false,
      products: []
    });
  }

  const products = await Product.find({ status: status }).populate("brand");
  
  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : "Cannot get products"
  });
});
module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  uploadImageProduct,
  getAllProducts,
  getAllProductWithStatus_IN_STOCK,
  getAllProductWithStatus_OUT_OF_STOCK,
  changeIsDisplay,
  productFilterByBrandName,
  productByAllReceipt,
  addProductToShelf,
  filterProductByName,
  filterProductByStatus
};
