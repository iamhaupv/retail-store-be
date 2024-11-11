const expressAsyncHandler = require("express-async-handler");
const { Shelf} = require("../models/index");

const createShelf = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input!");
  console.log(req.body.name);

  const shelf = await Shelf.findOne({ name: req.body.name });
  console.log(shelf);

  if (shelf) throw new Error("Shelf Name is exist!");
  const newShelf = await Shelf.create(req.body);
  return res.status(201).json({
    success: newShelf ? true : false,
    newShelf: newShelf ? newShelf : "Cannot create shelf!",
  });
});
const getListShelf = expressAsyncHandler(async (req, res) => {
  const shelfs = await Shelf.find({ isDisplay: true })
    .sort({ createdAt: -1 })
    .exec();
  return res.status(200).json({
    success: shelfs ? true : false,
    shelfs: shelfs ? shelfs : "Cannot get list shelfs!",
  });
});
const filterProductByShelf = expressAsyncHandler(async (req, res) => {
  const { name } = req.body; // Lấy tên kệ từ yêu cầu

  if (!name) {
    return res.status(400).json({ message: "Shelf name is required" });
  }

  try {
    // Tìm kệ theo tên và populate thông tin sản phẩm cùng phiếu nhập kho
    const shelves = await Shelf.find({ name }).populate({
      path: "products.product",
      select: "images name" // Chỉ lấy thông tin cần thiết từ Product
    }).populate({
      path: "products.warehouseReceipt", // Populate thông tin phiếu nhập kho
      select: "idPNK createdAt products" // Chọn trường cần thiết từ WarehouseReceipt
    });

    if (shelves.length === 0) {
      return res.status(404).json({ message: "No shelves found with this name" });
    }

    const result = [];

    // Duyệt qua từng kệ và lấy thông tin sản phẩm
    for (const shelf of shelves) {
      for (const item of shelf.products) {
        const warehouseReceipt = item.warehouseReceipt;

        // Lấy thông tin nếu có phiếu nhập kho
        if (warehouseReceipt) {
          // Tìm sản phẩm trong phiếu nhập kho tương ứng
          const productInReceipt = warehouseReceipt.products.find(
            product => product.product.toString() === item.product._id.toString()
          );

          // Lấy thông tin `expires` từ sản phẩm trong phiếu nhập kho
          const expires = productInReceipt ? productInReceipt.expires : null;

          result.push({
            idPNK: warehouseReceipt.idPNK, // ID phiếu nhập kho
            images: item.product.images, // Hình ảnh sản phẩm
            createdAt: warehouseReceipt.createdAt, // Ngày nhập
            expires, // Ngày hết hạn từ sản phẩm trong phiếu
            quantity: item.quantity // Số lượng trên kệ
          });
        } else {
          // Nếu không có phiếu nhập kho
          result.push({
            idPNK: null, // Hoặc có thể xử lý khác
            images: item.product.images,
            createdAt: null,
            expires: null,
            quantity: item.quantity
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      products: result,
    });
  } catch (error) {
    console.error("Error filtering products by shelf name: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

const filterProductByNameInShelf = expressAsyncHandler(async (req, res) => {
  const { title } = req.body; // Lấy title sản phẩm từ body

  try {
    // Lấy tất cả các kệ và populate sản phẩm
    const shelves = await Shelf.find({}).populate('products.product');

    // Lấy danh sách sản phẩm từ tất cả các kệ
    const products = shelves.flatMap(shelf => 
      shelf.products.map(p => ({
        ...p.product.toObject(), // Chuyển đổi đối tượng Mongoose sang đối tượng thuần
        quantity: p.quantity, // Thêm số lượng sản phẩm từ kệ
        warehouseReceipt: p.warehouseReceipt // Thêm phiếu nhập kho
      }))
    );

    // Lọc sản phẩm theo title nếu có
    let filteredProducts = products;
    if (title) {
      const regex = new RegExp(title, 'i'); // Tạo biểu thức chính quy không phân biệt hoa thường
      filteredProducts = products.filter(product => 
        regex.test(product.title) // Kiểm tra xem title sản phẩm có chứa chuỗi tìm kiếm không
      );
    }

    return res.status(200).json({
      success: true,
      products: filteredProducts.length > 0 ? filteredProducts : "Không có sản phẩm nào",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sản phẩm"
    });
  }
});

const filterAllProductInShelf = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy tất cả các kệ và populate sản phẩm
    const shelves = await Shelf.find({}).populate('products.product');

    // Lấy danh sách sản phẩm từ tất cả các kệ
    const products = shelves.flatMap(shelf => 
      shelf.products.map(p => ({
        ...p.product.toObject(), // Chuyển đổi đối tượng Mongoose sang đối tượng thuần
        quantity: p.quantity, // Thêm số lượng sản phẩm từ kệ
        warehouseReceipt: p.warehouseReceipt // Thêm phiếu nhập kho
      }))
    );

    return res.status(200).json({
      success: true,
      products: products.length > 0 ? products : "Không có sản phẩm nào",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sản phẩm"
    });
  }
});

module.exports = { createShelf, getListShelf, filterProductByShelf, filterProductByNameInShelf, filterAllProductInShelf };
