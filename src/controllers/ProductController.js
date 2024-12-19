const Product = require("../models/Product");
const expressAsyncHandler = require("express-async-handler");
const asyncHandler = require("express-async-handler");
const { Brand, Shelf, WarehouseReceipt, Category } = require("../models");
const { default: mongoose } = require("mongoose");
// create product
const createProduct = asyncHandler(async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing inputs!" });
  }
  // if (req.body.title) {
  //   req.body.slug = slugify(req.body.title);
  // } else {
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "Title is required!" });
  // }
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
  const { pid } = req.body;
  const updateProduct = await Product.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updateProduct ? true : false,
    updateProduct: updateProduct ? updateProduct : "Cannot update product!",
  });
});
// update product by id body
const updatePriceProduct = asyncHandler(async (req, res) => {
  const { id, price } = req.body;

  // Kiểm tra đầu vào
  if (!id || price == null) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields!" });
  }

  // Kiểm tra giá trị price hợp lệ
  if (typeof price !== "number" || price <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid price value!" });
  }

  try {
    // Cập nhật giá sản phẩm
    const product = await Product.findOneAndUpdate(
      { _id: id },
      { price: price },
      { new: true } // Trả về sản phẩm sau khi cập nhật
    );

    // Kiểm tra sản phẩm có tồn tại hay không
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or cannot update product!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product price updated successfully!",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating product price.",
      error: error.message,
    });
  }
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
  const products = await Product.find({ isDisplay: true })
    .populate("brand")
    .populate("category")
    .populate("unit")
    .sort({ id: -1 })
    .exec();

  const totalProducts = await Product.countDocuments(); // Tổng số sản phẩm

  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Cannot get products!",
    totalProducts,
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
const changeIsDisplay = expressAsyncHandler(async (req, res) => {
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
//   try {
//     // Lấy tất cả các phiếu nhập kho và populate thông tin sản phẩm
//     const receipts = await WarehouseReceipt.find()
//       .populate({
//         path: "products.product",
//         populate: [
//           { path: "brand", select: "name" },
//           { path: "category", select: "name" },
//           { path: "unit", select: "name" }
//         ],
//       })
//       .populate({
//         path: "products.unit",
//         select: "convertQuantity",
//       })
//       .sort({ createdAt: -1 })
//       .exec();
//     // Lọc và tính toán số lượng sản phẩm từ các phiếu
//     const products = receipts.flatMap((receipt) =>
//       receipt.products.map((item) => {
//         const convertQuantity = item.unit?.convertQuantity || 1; // Lấy hệ số quy đổi
//         const calculatedQuantity = item.quantityDynamic
//           ? item.quantity * convertQuantity
//           : 0; // Tính toán số lượng

//         const product = item.product || {};
//         const price = product.price || 0; // Giá sản phẩm từ product

//         // Lấy importPrice từ item
//         const importPrice = item.importPrice || 0; // Giá nhập vào

//         return {
//           unit: product?.unit?.name,
//           expires: item.expires,
//           idPNK: receipt.idPNK,
//           images: product.images || [], // Nếu không có hình ảnh, trả về mảng rỗng
//           title: product.title || "N/A", // Tiêu đề mặc định nếu không có
//           category: product.category?.name || "N/A",
//           brand: product.brand?.name || "N/A",
//           quantity: calculatedQuantity, // Số lượng đã quy đổi
//           price: price, // Giá bán
//           importPrice: importPrice, // Thêm importPrice vào kết quả
//           _id: product._id,
//           warehouseReceipt: receipt._id,
//           quantityDynamic: item.quantityDynamic || 0,
//           id: product.id,
//           sumQuantity: product.sumQuantity,
//           discount: product.discount || 0
//         };
//       })
//     );

//     // Trả về kết quả
//     return res.status(200).json({
//       success: products.length > 0,
//       products: products.length > 0 ? products : "Không có sản phẩm nào.",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
//     });
//   }
// });

const filterProductByName = expressAsyncHandler(async (req, res) => {
  const { title } = req.body;

  // Kiểm tra xem title có rỗng hoặc chỉ chứa khoảng trắng không
  if (!title || title.trim() === "") {
    return res.status(200).json({
      success: false,
      products: [],
    });
  }

  const products = await Product.find({
    title: { $regex: title, $options: "i" },
    isDisplay: true,
  }).populate("brand");

  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : "Cannot get products",
  });
});

const filterProductByStatus = expressAsyncHandler(async (req, res) => {
  const { status } = req.body;

  // Kiểm tra xem title có rỗng hoặc chỉ chứa khoảng trắng không
  if (!status || status.trim() === "") {
    return res.status(200).json({
      success: false,
      products: [],
    });
  }

  const products = await Product.find({ status: status })
    .populate("brand")
    .populate("category");

  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : "Cannot get products",
  });
});

const filterProductByBrand = expressAsyncHandler(async (req, res) => {
  const { brandName } = req.body;

  // Kiểm tra xem title có rỗng hoặc chỉ chứa khoảng trắng không
  if (!brandName || brandName.trim() === "") {
    return res.status(200).json({
      success: false,
      products: [],
    });
  }
  const brand = await Brand.findOne({ name: brandName });
  const products = await Product.find({ brand: brand._id })
    .populate("brand")
    .populate("category");

  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : "Cannot get products",
  });
});
//
const filterProductMultiCondition = expressAsyncHandler(async (req, res) => {
  const { title, status, brandName, categoryName, id } = req.body;

  // Initialize an empty query object
  const query = {};

  // Check for title and add to query if not empty
  if (title && title.trim() !== "") {
    // query.title = { $regex: title, $options: "i" };
    query.$and = [
      { title: { $regex: title, $options: "i" } },
      { isDisplay: true },
    ];
  }

  // Check for status and add to query if not empty
  if (status && status.trim() !== "") {
    query.status = status;
  }

  // Check for brandName and add to query if not empty
  if (brandName && brandName.trim() !== "") {
    const brand = await Brand.findOne({ name: brandName, isDisplay: true });
    if (brand) {
      query.brand = brand._id; // Add brand ID to query if brand exists
    } else {
      // If brand is not found, return empty results
      return res.status(200).json({
        success: true,
        products: [],
      });
    }
  }
  query.isDisplay = true;
  if (categoryName && categoryName.trim() !== "") {
    const category = await Category.findOne({
      name: categoryName,
      isDisplay: true,
    });
    if (category) {
      query.category = category._id; // Add brand ID to query if brand exists
    } else {
      // If brand is not found, return empty results
      return res.status(200).json({
        success: true,
        products: [],
      });
    }
  }
  if (id && id !== "") {
    const product = await Product.findOne({ id: id, isDisplay: true });
    if (product) {
      query.id = product.id; // Add brand ID to query if brand exists
    } else {
      // If brand is not found, return empty results
      return res.status(200).json({
        success: true,
        products: [],
      });
    }
  }
  // Check if at least one condition is provided
  if (Object.keys(query).length === 0) {
    return res.status(200).json({
      success: false,
      products: [],
      message: "No filter conditions provided.",
    });
  }

  // Fetch products based on constructed query
  const products = await Product.find(query)
    .populate("brand")
    .populate("category")
    .populate({
      path: "unit",
      select: "name",
    });

  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : [],
  });
});
// filter price by name
// const filterPriceByProductName = expressAsyncHandler(async (req, res) => {
//   const { title } = req.body;
//   const product = await Product.findOne({ title, isDisplay: true });
//   return res.status(200).json({
//     success: product ? true : false,
//     product: product ? product : "Cannot get product",
//   });
// });
const filterPriceByProductName = expressAsyncHandler(async (req, res) => {
  const { title } = req.body;

  try {
    // Tìm sản phẩm có `title`, `isDisplay = true`, và `quantity > 0`
    const product = await Product.findOne({
      title,
      isDisplay: true,
      quantity: { $gt: 0 },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available",
      });
    }

    // Tìm các WarehouseReceipt chứa sản phẩm
    const warehouseReceipts = await WarehouseReceipt.find({
      "products.product": product._id,
      "products.isDisplay": true,
    });

    // Kiểm tra nếu sản phẩm không có trong phiếu kho hiển thị
    const isDisplayInAnyReceipt = warehouseReceipts.some((receipt) =>
      receipt.products.some(
        (productInReceipt) =>
          productInReceipt.product.toString() === product._id.toString() &&
          productInReceipt.isDisplay === true
      )
    );

    if (!isDisplayInAnyReceipt) {
      return res.status(200).json({
        success: false,
        message: "Product is not available in any warehouse receipts",
      });
    }

    // Nếu hợp lệ, trả về toàn bộ thông tin của sản phẩm
    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// pagination product
const getAllProductsPagination = asyncHandler(async (req, res) => {
  try {
    const { page, limit } = req.body; // Lấy page và limit từ body

    // Chuyển đổi sang số và kiểm tra
    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 5;

    if (currentPage < 1 || currentLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be greater than 0",
      });
    }

    const skip = (currentPage - 1) * currentLimit;

    const products = await Product.find({ isDisplay: true })
      .populate("brand")
      .populate("category")
      .sort({ id: -1 })
      .skip(skip)
      .limit(currentLimit)
      .exec();

    const totalProducts = await Product.find({ isDisplay: true }).sort({
      id: -1,
    });

    return res.status(200).json({
      success: true,
      products,
      currentPage,
      totalProducts,
      totalPages: Math.ceil(totalProducts / currentLimit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// const addProductToShelf = expressAsyncHandler(async (req, res) => {
//   const { name, products } = req.body;

//   if (!name || !Array.isArray(products) || products.length === 0) {
//     return res.status(400).json({ message: "Tên kệ và sản phẩm là bắt buộc" });
//   }

//   const shelf = await Shelf.findOne({ name });
//   if (!shelf) {
//     return res.status(404).json({ message: "Không tìm thấy kệ" });
//   }

//   for (const { product, quantity, warehouseReceipt } of products) {
//     if (!mongoose.Types.ObjectId.isValid(product) || !mongoose.Types.ObjectId.isValid(warehouseReceipt)) {
//       return res.status(400).json({ message: `ID sản phẩm hoặc phiếu nhập kho không hợp lệ` });
//     }

//     const receipt = await WarehouseReceipt.findById(warehouseReceipt);
//     if (!receipt) {
//       return res.status(404).json({ message: `Không tìm thấy phiếu nhập kho: ${warehouseReceipt}` });
//     }

//     const productInReceipt = receipt.products.find(p => p.product.toString() === product);
//     if (!productInReceipt) {
//       return res.status(400).json({ message: `Sản phẩm không có trong phiếu nhập kho: ${product}` });
//     }

//     if (quantity > productInReceipt.quantityDynamic) {
//       return res.status(400).json({ message: "Số lượng yêu cầu vượt quá số lượng có sẵn" });
//     }

//     const existingProduct = shelf.products.find(
//       (p) => p.product.toString() === product && p.warehouseReceipt.toString() === warehouseReceipt
//     );

//     if (existingProduct) {
//       // Cập nhật quantity của phiếu nhập kho
//       existingProduct.quantity += quantity;

//       // Cập nhật sumQuantity cho tất cả các phiếu cùng sản phẩm
//       shelf.products.forEach(p => {
//         if (p.product.toString() === product) {
//           p.sumQuantity += quantity; // Cộng dồn vào sumQuantity
//         }
//       });
//     } else {
//       const productInfo = await Product.findById(product);
//       if (!productInfo) {
//         return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${product}` });
//       }

//       shelf.products.push({
//         product,
//         title: productInfo.title,
//         quantity,
//         warehouseReceipt,
//         sumQuantity: quantity, // Khởi tạo sumQuantity bằng quantity
//       });
//     }

//     // Cập nhật quantityDynamic của phiếu nhập kho
//     productInReceipt.quantityDynamic -= quantity;
//     if (productInReceipt.quantityDynamic < 0) {
//       return res.status(400).json({ message: "Số lượng động không thể âm" });
//     }
//     await receipt.save();
//   }

//   // Cập nhật tổng số lượng sản phẩm trên kệ
//   shelf.quantity = shelf.products.reduce(
//     (total, p) => total + (p.quantity || 0),
//     0
//   );

//   // Cập nhật tổng sumQuantity cho kệ
//   shelf.sumQuantity = shelf.products.reduce(
//     (total, p) => total + (p.sumQuantity || 0),
//     0
//   );

//   await shelf.save();

//   const updatedShelf = await Shelf.findById(shelf._id).populate({
//     path: "products.product",
//   });

//   res.status(200).json({
//     success: true,
//     message: "Sản phẩm đã được thêm vào kệ thành công với sumQuantity được đồng bộ",
//     shelf: updatedShelf,
//   });
// });

const addProductToShelf = expressAsyncHandler(async (req, res) => {
  const { name, products } = req.body;

  if (!name || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Tên kệ và sản phẩm là bắt buộc" });
  }

  const shelf = await Shelf.findOne({ name });
  if (!shelf) {
    return res.status(404).json({ message: "Không tìm thấy kệ" });
  }

  for (const { product, quantity, warehouseReceipt } of products) {
    if (
      !mongoose.Types.ObjectId.isValid(product) ||
      !mongoose.Types.ObjectId.isValid(warehouseReceipt)
    ) {
      return res
        .status(400)
        .json({ message: `ID sản phẩm hoặc phiếu nhập kho không hợp lệ` });
    }

    const receipt = await WarehouseReceipt.findById(warehouseReceipt);
    if (!receipt) {
      return res.status(404).json({
        message: `Không tìm thấy phiếu nhập kho: ${warehouseReceipt}`,
      });
    }

    const productInReceipt = receipt.products.find(
      (p) => p.product.toString() === product
    );
    if (!productInReceipt) {
      return res.status(400).json({
        message: `Sản phẩm không có trong phiếu nhập kho: ${product}`,
      });
    }

    if (quantity > productInReceipt.quantityDynamic) {
      return res
        .status(400)
        .json({ message: "Số lượng yêu cầu vượt quá số lượng có sẵn" });
    }

    const existingProduct = shelf.products.find(
      (p) =>
        p.product.toString() === product &&
        p.warehouseReceipt.toString() === warehouseReceipt
    );

    if (existingProduct) {
      // Cập nhật quantity của phiếu nhập kho
      existingProduct.quantity += quantity;

      // Cập nhật sumQuantity cho tất cả các phiếu cùng sản phẩm
      shelf.products.forEach((p) => {
        if (p.product.toString() === product) {
          p.sumQuantity += quantity; // Cộng dồn vào sumQuantity
        }
      });
    } else {
      const productInfo = await Product.findById(product);
      if (!productInfo) {
        return res
          .status(404)
          .json({ message: `Không tìm thấy sản phẩm: ${product}` });
      }

      shelf.products.push({
        product,
        title: productInfo.title,
        quantity,
        warehouseReceipt,
        sumQuantity: quantity, // Khởi tạo sumQuantity bằng quantity
      });
    }

    // Cập nhật quantityDynamic của phiếu nhập kho
    productInReceipt.quantityDynamic -= quantity;
    if (productInReceipt.quantityDynamic < 0) {
      return res.status(400).json({ message: "Số lượng động không thể âm" });
    }
    await receipt.save();

    // Cập nhật quantity trong Product
    const productInStore = await Product.findById(product);
    if (productInStore) {
      productInStore.quantity -= quantity;
      if (productInStore.quantity < 0) {
        return res
          .status(400)
          .json({ message: `Số lượng sản phẩm trong kho không đủ` });
      }
      await productInStore.save();
    }
  }

  // Cập nhật tổng số lượng sản phẩm trên kệ
  shelf.quantity = shelf.products.reduce(
    (total, p) => total + (p.quantity || 0),
    0
  );

  // Cập nhật tổng sumQuantity cho kệ
  shelf.sumQuantity = shelf.products.reduce(
    (total, p) => total + (p.sumQuantity || 0),
    0
  );

  await shelf.save();

  const updatedShelf = await Shelf.findById(shelf._id).populate({
    path: "products.product",
  });

  res.status(200).json({
    success: true,
    message:
      "Sản phẩm đã được thêm vào kệ thành công với sumQuantity được đồng bộ",
    shelf: updatedShelf,
  });
});

// const filterProductSumQuantity = expressAsyncHandler(async (req, res) => {
//   const products = await Product.find({ quantity: { $gte: 1 } , isDisplay: true});
//   return res.status(200).json({
//     success: products ? true : false,
//     products: products ? products : "Cannot get products",
//   });
// });

const filterProductSumQuantity = expressAsyncHandler(async (req, res) => {
  try {
    // Lọc các sản phẩm có quantity > 0 và isDisplay là true trong Product
    const products = await Product.find({
      quantity: { $gte: 1 },
      isDisplay: true,
    });

    const filteredProducts = [];

    // Duyệt qua từng sản phẩm trong danh sách
    for (let product of products) {
      // Kiểm tra các phiếu kho có chứa sản phẩm này
      let isDisplayInAnyReceipt = false;

      // Tìm các WarehouseReceipt có chứa sản phẩm này
      const warehouseReceipts = await WarehouseReceipt.find({
        "products.product": product._id,
      });

      // Kiểm tra các phiếu kho này để tìm xem có bất kỳ sản phẩm nào có isDisplay là true
      for (let receipt of warehouseReceipts) {
        // Duyệt qua tất cả sản phẩm trong phiếu kho để kiểm tra isDisplay
        for (let productInReceipt of receipt.products) {
          if (
            productInReceipt.product.toString() === product._id.toString() &&
            productInReceipt.isDisplay
          ) {
            isDisplayInAnyReceipt = true;
            break;
          }
        }
        if (isDisplayInAnyReceipt) {
          break; // Nếu tìm thấy, không cần kiểm tra thêm các phiếu kho khác
        }
      }

      // Nếu có ít nhất một sản phẩm có isDisplay là true trong các phiếu kho, thêm sản phẩm vào kết quả
      if (isDisplayInAnyReceipt) {
        filteredProducts.push(product);
      }
    }

    return res.status(200).json({
      success: filteredProducts.length > 0,
      products:
        filteredProducts.length > 0 ? filteredProducts : "No products found",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

const filterProductById = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input");
  const { id } = req.body;
  const products = await Product.find({ id });
  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Cannot get products",
  });
});

const lastIdNumber = expressAsyncHandler(async (req, res) => {
  try {
    // Truy vấn sản phẩm có id cao nhất
    const lastProduct = await Product.findOne().sort({ id: -1 }).limit(1);

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

// const filterReceiptByProduct = expressAsyncHandler(async (req, res) => {
//   // Kiểm tra input
//   if (!req.body || !req.body.title) {
//     return res
//       .status(400)
//       .json({ success: false, mes: "Product title is required!" });
//   }

//   const { title } = req.body;

//   // Tìm sản phẩm theo tên
//   const product = await Product.findOne({ title: title, isDisplay: true });

//   // Kiểm tra nếu sản phẩm không tồn tại
//   if (!product) {
//     return res.status(404).json({
//       success: false,
//       mes: "Product not found",
//     });
//   }

//   // Lấy ngày hiện tại
//   const currentDate = new Date();
//   console.log("Current date: ", currentDate);  // Debug log ngày hiện tại

//   // Tính ngày hiện tại cộng thêm 10 ngày
//   const tenDaysLater = new Date();
//   // tenDaysLater.setDate(currentDate.getDate() + 10);
//   tenDaysLater.setDate(currentDate.getDate());
//   console.log("Ten days later: ", tenDaysLater);  // Debug log ngày hiện tại cộng 10 ngày

//   // Lấy tất cả các phiếu nhập kho có chứa sản phẩm này
//   const warehouseReceipts = await WarehouseReceipt.find({
//     "products.product": product._id, // Lọc theo sản phẩm này trong các phiếu nhập kho
//   }).populate({
//     path: "products.product", // Lọc thông tin sản phẩm trong phiếu nhập kho
//     select: "_id title expires", // Lấy thông tin cần thiết từ sản phẩm, bao gồm expires
//   });

//   // Lọc các phiếu nhập kho có quantity > 0 và sản phẩm có ngày hết hạn > ngày hiện tại + 10 ngày
//   const filteredReceipts = warehouseReceipts.filter((receipt) => {
//     return receipt.products.some((productItem) => {
//       let expires = productItem.expires;  // Lấy giá trị expires
//       console.log("Expires value for product:", expires);  // Debug log giá trị expires
//       console.log(productItem.importPrice);

//       // Kiểm tra nếu expires là một giá trị hợp lệ
//       const expiresDate = expires && !isNaN(new Date(expires).getTime())
//                           ? new Date(expires)
//                           : null;

//       if (!expiresDate) {
//         console.log("Invalid expires date for product:", productItem.product.title);  // Debug log khi có lỗi
//         return false;  // Trả về false nếu expires không hợp lệ
//       }

//       console.log("Expires Date: ", expiresDate); // Debug log ngày hết hạn của sản phẩm

//       // Kiểm tra ngày hết hạn phải lớn hơn ngày hiện tại + 10 ngày
//       return (
//         productItem.product._id.toString() === product._id.toString() &&
//         productItem.quantityDynamic > 0 &&
//         expiresDate > tenDaysLater // Kiểm tra ngày hết hạn phải lớn hơn ngày hiện tại + 10 ngày
//       );
//     });
//   });

//   // Kiểm tra nếu có phiếu nhập kho thỏa mãn
//   if (filteredReceipts.length > 0) {
//     return res.status(200).json({
//       success: true,
//       receipts: filteredReceipts.map((receipt) => ({
//         _id: receipt._id,
//         idPNK: receipt.idPNK, // Trả về idPNK của phiếu nhập kho
//         products: receipt.products.filter(
//           (productItem) =>
//             productItem.product._id.toString() === product._id.toString()
//         ),
//       })),
//     });
//   } else {
//     return res.status(404).json({
//       success: false,
//       mes: "No receipts found with product quantity greater than 0 and expiration date after 10 days from now",
//     });
//   }
// });

const filterReceiptByProduct = expressAsyncHandler(async (req, res) => {
  // Kiểm tra input
  if (!req.body || !req.body.title) {
    return res
      .status(400)
      .json({ success: false, mes: "Product title is required!" });
  }

  const { title } = req.body;

  // Tìm sản phẩm theo tên và có isDisplay = true
  const product = await Product.findOne({ title: title, isDisplay: true });

  // Kiểm tra nếu sản phẩm không tồn tại
  if (!product) {
    return res.status(404).json({
      success: false,
      mes: "Product not found",
    });
  }

  // Lấy ngày hiện tại
  const currentDate = new Date();
  console.log("Current date: ", currentDate); // Debug log ngày hiện tại

  // Tính ngày hiện tại cộng thêm 10 ngày
  const tenDaysLater = new Date();
  tenDaysLater.setDate(currentDate.getDate() + 10);
  console.log("Ten days later: ", tenDaysLater); // Debug log ngày hiện tại cộng 10 ngày

  // Lấy tất cả các phiếu nhập kho có chứa sản phẩm này
  const warehouseReceipts = await WarehouseReceipt.find({
    "products.product": product._id, // Lọc theo sản phẩm này trong các phiếu nhập kho
  }).populate({
    path: "products.product", // Lọc thông tin sản phẩm trong phiếu nhập kho
    select: "_id title expires isDisplay quantityDynamic", // Lấy thông tin cần thiết từ sản phẩm
  });

  // Lọc các phiếu nhập kho có quantityDynamic > 0 và sản phẩm có ngày hết hạn > ngày hiện tại + 10 ngày và isDisplay là true
  const filteredReceipts = warehouseReceipts.filter((receipt) => {
    return receipt.products.some((productItem) => {
      let expires = productItem.expires; // Lấy giá trị expires
      console.log("Expires value for product:", expires); // Debug log giá trị expires
      console.log("QuantityDynamic: ", productItem.quantityDynamic);

      // Kiểm tra nếu expires là một giá trị hợp lệ
      const expiresDate =
        expires && !isNaN(new Date(expires).getTime())
          ? new Date(expires)
          : null;

      if (!expiresDate) {
        console.log(
          "Invalid expires date for product:",
          productItem.product.title
        ); // Debug log khi có lỗi
        return false; // Trả về false nếu expires không hợp lệ
      }

      console.log("Expires Date: ", expiresDate); // Debug log ngày hết hạn của sản phẩm

      // Kiểm tra ngày hết hạn phải lớn hơn ngày hiện tại + 10 ngày và isDisplay phải là true
      return (
        productItem.product._id.toString() === product._id.toString() &&
        productItem.quantityDynamic > 0 &&
        expiresDate > tenDaysLater && // Kiểm tra ngày hết hạn phải lớn hơn ngày hiện tại + 10 ngày
        productItem.isDisplay === true // Kiểm tra isDisplay là true
      );
    });
  });

  // Kiểm tra nếu có phiếu nhập kho thỏa mãn
  if (filteredReceipts.length > 0) {
    return res.status(200).json({
      success: true,
      receipts: filteredReceipts.map((receipt) => ({
        _id: receipt._id,
        idPNK: receipt.idPNK, // Trả về idPNK của phiếu nhập kho
        products: receipt.products.filter(
          (productItem) =>
            productItem.product._id.toString() === product._id.toString()
        ),
      })),
    });
  } else {
    return res.status(404).json({
      success: false,
      mes: "No receipts found with product quantity greater than 0, expiration date after 10 days from now, and isDisplay true",
    });
  }
});

const addDiscount = expressAsyncHandler(async (req, res) => {
  const { id, discount } = req.body;

  // Kiểm tra xem ID và discount có được cung cấp hay không
  if (!id || discount === undefined) {
    return res.status(400).json({
      success: false,
      message: "ID and discount are required",
    });
  }

  // Tìm sản phẩm theo id
  const product = await Product.findOne({ id: id });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Cập nhật trường discount vào sản phẩm
  product.discount = discount;

  // Lưu lại thay đổi vào cơ sở dữ liệu
  await product.save();

  return res.status(200).json({
    success: true,
    message: "Discount added successfully",
    product, // Trả về sản phẩm đã được thêm trường discount
  });
});

const productByAllReceipt = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy tất cả các phiếu nhập kho và populate thông tin sản phẩm
    const receipts = await WarehouseReceipt.find()
      .populate({
        path: "products.product",
        populate: [
          { path: "brand", select: "name" },
          { path: "category", select: "name" },
          { path: "unit", select: "name" },
        ],
      })
      .populate({
        path: "products.unit",
        select: "convertQuantity",
      })
      .sort({ createdAt: -1 })
      .exec();

    // Lọc và tính toán số lượng sản phẩm từ các phiếu
    const products = receipts.flatMap((receipt) =>
      receipt.products
        .filter((item) => item.isDisplay) // Chỉ giữ các sản phẩm có isDisplay: true
        .map((item) => {
          const convertQuantity = item.unit?.convertQuantity || 1; // Lấy hệ số quy đổi
          const calculatedQuantity = item.quantityDynamic
            ? item.quantity * convertQuantity
            : 0; // Tính toán số lượng

          const product = item.product || {};
          const price = product.price || 0; // Giá sản phẩm từ product

          // Lấy importPrice từ item
          const importPrice = item.importPrice || 0; // Giá nhập vào

          return {
            unit: product?.unit?.name,
            expires: item.expires,
            idPNK: receipt.idPNK,
            images: product.images || [], // Nếu không có hình ảnh, trả về mảng rỗng
            title: product.title || "N/A", // Tiêu đề mặc định nếu không có
            category: product.category?.name || "N/A",
            brand: product.brand?.name || "N/A",
            quantity: calculatedQuantity, // Số lượng đã quy đổi
            price: price, // Giá bán
            importPrice: importPrice, // Thêm importPrice vào kết quả
            _id: product._id,
            warehouseReceipt: receipt._id,
            quantityDynamic: item.quantityDynamic || 0,
            id: product.id,
            sumQuantity: product.sumQuantity,
            discount: product.discount || 0,
          };
        })
    );

    // Trả về kết quả
    return res.status(200).json({
      success: products.length > 0,
      products: products.length > 0 ? products : "Không có sản phẩm nào.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
    });
  }
});
const getInforProduct = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input!");
  
  const { product, receipt } = req.body;

  // Tìm sản phẩm dựa trên `id`
  const pro = await Product.findOne({ id: product })
    .populate({
      path: "brand",
      select: "name"
    })
    .populate({
      path: "category",
      select: "name"
    });
  if (!pro) throw new Error("Product does not exist!");

  // Tìm phiếu nhập kho theo `idPNK`
  const rec = await WarehouseReceipt.findOne({ idPNK: receipt }).lean();
  if (!rec) throw new Error("Receipt does not exist!");

  // Lọc sản phẩm trong `products` của phiếu nhập kho
  const matchingProduct = rec.products.find(p => p.product.toString() === pro._id.toString());
  if (!matchingProduct) throw new Error("Product is not associated with this receipt!");

  // Cập nhật thông tin `receipt` chỉ chứa sản phẩm phù hợp
  rec.products = [matchingProduct];

  return res.status(200).json({
    success: true,
    item: {
      product: pro,
      receipt: rec,
    },
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
  filterProductByStatus,
  filterProductByBrand,
  filterProductMultiCondition,
  filterPriceByProductName,
  getAllProductsPagination,
  updatePriceProduct,
  filterProductSumQuantity,
  filterProductById,
  filterReceiptByProduct,
  lastIdNumber,
  addDiscount,
  getInforProduct,
};
