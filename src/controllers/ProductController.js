const Product = require("../models/Product");
const expressAsyncHandler = require("express-async-handler");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const { Brand, Shelf, WarehouseReceipt, Category } = require("../models");
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
    return res.status(400).json({ success: false, message: "Missing required fields!" });
  }

  // Kiểm tra giá trị price hợp lệ
  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ success: false, message: "Invalid price value!" });
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
const productByAllReceipt = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy tất cả các phiếu nhập kho và populate thông tin sản phẩm
    const receipts = await WarehouseReceipt.find()
      .populate({
        path: "products.product",
        populate: [
          { path: "brand", select: "name" },
          { path: "category", select: "name" },
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
      receipt.products.map((item) => {
        const convertQuantity = item.unit?.convertQuantity || 1; // Lấy hệ số quy đổi
        const calculatedQuantity = item.quantityDynamic ? item.quantity * convertQuantity : 0; // Tính toán số lượng

        const product = item.product || {};
        const price = product.price || 0; // Giá sản phẩm từ product

        // Lấy importPrice từ item
        const importPrice = item.importPrice || 0; // Giá nhập vào

        return {
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
          quantityDynamic: item.quantityDynamic || 0
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

// 

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
  const brand = await Brand.findOne({name: brandName})
  const products = await Product.find({brand: brand._id })
    .populate("brand")
    .populate("category");

  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : "Cannot get products",
  });
});
// 
const filterProductMultiCondition = expressAsyncHandler(async (req, res) => {
  const { title, status, brandName, categoryName } = req.body;

  // Initialize an empty query object
  const query = {};

  // Check for title and add to query if not empty
  if (title && title.trim() !== "") {
    query.title = { $regex: title, $options: "i" };
  }

  // Check for status and add to query if not empty
  if (status && status.trim() !== "") {
    query.status = status;
  }

  // Check for brandName and add to query if not empty
  if (brandName && brandName.trim() !== "") {
    const brand = await Brand.findOne({ name: brandName });
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
  if (categoryName && categoryName.trim() !== "") {
    const category = await Category.findOne({ name: categoryName });
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
    .populate("category");

  return res.status(200).json({
    success: true,
    products: products.length > 0 ? products : [],
  });
});
// filter price by name
const filterPriceByProductName = expressAsyncHandler(async(req, res) => {
  const {title} = req.body
  const product = await Product.findOne({title})
  return res.status(200).json({
    success: product ? true : false,
    product: product ? product : "Cannot get product"
  })
})


// pagination product
const getAllProductsPagination = asyncHandler(async (req, res) => {
  try {
    const { page, limit } = req.body; // Lấy page và limit từ body

    // Chuyển đổi sang số và kiểm tra
    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 5;

    if (currentPage < 1 || currentLimit < 1) {
      return res.status(400).json({ success: false, message: 'Page and limit must be greater than 0' });
    }

    const skip = (currentPage - 1) * currentLimit;

    const products = await Product.find({ isDisplay: true })
      .populate("brand")
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(currentLimit)
      .exec();

    const totalProducts = await Product.countDocuments({ isDisplay: true });

    return res.status(200).json({
      success: true,
      products,
      currentPage,
      totalProducts,
      totalPages: Math.ceil(totalProducts / currentLimit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
    if (!mongoose.Types.ObjectId.isValid(product) || !mongoose.Types.ObjectId.isValid(warehouseReceipt)) {
      return res.status(400).json({ message: `ID sản phẩm hoặc phiếu nhập kho không hợp lệ` });
    }

    const receipt = await WarehouseReceipt.findById(warehouseReceipt);
    if (!receipt) {
      return res.status(404).json({ message: `Không tìm thấy phiếu nhập kho: ${warehouseReceipt}` });
    }

    const productInReceipt = receipt.products.find(p => p.product.toString() === product);
    if (!productInReceipt) {
      return res.status(400).json({ message: `Sản phẩm không có trong phiếu nhập kho: ${product}` });
    }

    if (quantity > productInReceipt.quantityDynamic) {
      return res.status(400).json({ message: "Số lượng yêu cầu vượt quá số lượng có sẵn" });
    }

    const existingProduct = shelf.products.find(
      (p) => p.product.toString() === product && p.warehouseReceipt.toString() === warehouseReceipt
    );

    if (existingProduct) {
      // Cập nhật quantity của phiếu nhập kho
      existingProduct.quantity += quantity;

      // Cập nhật sumQuantity cho tất cả các phiếu cùng sản phẩm
      shelf.products.forEach(p => {
        if (p.product.toString() === product) {
          p.sumQuantity += quantity; // Cộng dồn vào sumQuantity
        }
      });
    } else {
      const productInfo = await Product.findById(product);
      if (!productInfo) {
        return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${product}` });
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
        return res.status(400).json({ message: `Số lượng sản phẩm trong kho không đủ` });
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
    message: "Sản phẩm đã được thêm vào kệ thành công với sumQuantity được đồng bộ",
    shelf: updatedShelf,
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
  updatePriceProduct
};
