const expressAsyncHandler = require("express-async-handler");
const { Shelf, WarehouseReceipt } = require("../models/index");

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


// const filterProductByShelf = expressAsyncHandler(async (req, res) => {
//   const { name } = req.body; // Lấy tên kệ từ yêu cầu

//   if (!name) {
//     return res.status(400).json({ message: "Shelf name is required" });
//   }

//   try {
//     const shelves = await Shelf.find({ name })
//       .populate({
//         path: "products.product",
//         select: "images title", // Chỉ lấy thông tin cần thiết từ Product
//       })
//       .populate({
//         path: "products.warehouseReceipt", // Populate thông tin phiếu nhập kho
//         select: "idPNK createdAt products", // Chọn trường cần thiết từ WarehouseReceipt
//       });

//     if (shelves.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No shelves found with this name" });
//     }

//     const result = [];

//     // Duyệt qua từng kệ và lấy thông tin sản phẩm
//     for (const shelf of shelves) {
//       for (const item of shelf.products) {
//         const warehouseReceipt = item.warehouseReceipt;

//         // Lấy thông tin nếu có phiếu nhập kho
//         if (warehouseReceipt) {
//           // Tìm sản phẩm trong phiếu nhập kho tương ứng
//           const productInReceipt = warehouseReceipt.products.find(
//             (product) =>
//               product.product.toString() === item.product._id.toString()
//           );

//           // Lấy thông tin `expires` từ sản phẩm trong phiếu nhập kho
//           const expires = productInReceipt ? productInReceipt.expires : null;

//           result.push({
//             idPNK: warehouseReceipt.idPNK, // ID phiếu nhập kho
//             images: item.product.images, // Hình ảnh sản phẩm
//             // createdAt: warehouseReceipt.createdAt, // Ngày nhập
//             title: item.product.title,
//             expires, // Ngày hết hạn từ sản phẩm trong phiếu
//             quantity: item.quantity, // Số lượng trên kệ
//           });
//         } else {
//           // Nếu không có phiếu nhập kho
//           result.push({
//             idPNK: null, // Hoặc có thể xử lý khác
//             images: item.product.images,
//             createdAt: null,
//             expires: null,
//             quantity: item.quantity,
//             title: item.product.title
//           });
//         }
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       products: result,
//     });
//   } catch (error) {
//     console.error("Error filtering products by shelf name: ", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });

// const filterProductByShelf = expressAsyncHandler(async (req, res) => {
//   const { name } = req.body; // Lấy tên kệ từ yêu cầu

//   if (!name) {
//     return res.status(400).json({ message: "Shelf name is required" });
//   }

//   try {
//     const shelves = await Shelf.find({ name })
//       .populate({
//         path: "products.product",
//         select: "images title", // Chỉ lấy thông tin cần thiết từ Product
//       })
//       .populate({
//         path: "products.warehouseReceipt", // Populate thông tin phiếu nhập kho
//         select: "idPNK createdAt products", // Chọn trường cần thiết từ WarehouseReceipt
//       });

//     if (shelves.length === 0) {
//       return res.status(404).json({ message: "No shelves found with this name" });
//     }

//     const productMap = {}; // Dùng để nhóm sản phẩm theo ID

//     // Duyệt qua từng kệ và lấy thông tin sản phẩm
//     for (const shelf of shelves) {
//       for (const item of shelf.products) {
//         const warehouseReceipt = item.warehouseReceipt;
//         const productId = item.product._id.toString();
//         const quantity = item.quantity;

//         // Tìm thông tin phiếu nhập kho và ngày hết hạn
//         let expires = null;
//         if (warehouseReceipt) {
//           const productInReceipt = warehouseReceipt.products.find(
//             (product) => product.product.toString() === productId
//           );
//           expires = productInReceipt ? productInReceipt.expires : null;
//         }

//         // Nếu sản phẩm đã có trong productMap, cộng dồn số lượng
//         if (productMap[productId]) {
//           productMap[productId].sumQuantity += quantity; // Cộng dồn sumQuantity
//           productMap[productId].instances.push({
//             idPNK: warehouseReceipt ? warehouseReceipt.idPNK : null,
//             images: item.product.images,
//             title: item.product.title,
//             expires,
//             quantity, // Số lượng hiện tại
//           });
//         } else {
//           productMap[productId] = {
//             sumQuantity: quantity, // Khởi tạo sumQuantity
//             instances: [
//               {
//                 idPNK: warehouseReceipt ? warehouseReceipt.idPNK : null,
//                 images: item.product.images,
//                 title: item.product.title,
//                 expires,
//                 quantity, // Số lượng hiện tại
//               },
//             ],
//           };
//         }
//       }
//     }

//     // Chuyển đổi productMap thành mảng kết quả
//     const result = [];
//     for (const productId in productMap) {
//       const { sumQuantity, instances } = productMap[productId];
//       instances.forEach(instance => {
//         result.push({
//           idPNK: instance.idPNK,
//           images: instance.images,
//           title: instance.title,
//           expires: instance.expires,
//           quantity: instance.quantity,
//           sumQuantity, // Tổng số lượng
//         });
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       products: result,
//     });
//   } catch (error) {
//     console.error("Error filtering products by shelf name: ", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });



const filterProductByShelf = expressAsyncHandler(async (req, res) => {
  const { name } = req.body; // Lấy tên kệ từ yêu cầu

  if (!name) {
    return res.status(400).json({ message: "Shelf name is required" });
  }

  try {
    // Lấy danh sách kệ theo tên, populate thông tin sản phẩm và phiếu nhập kho
    const shelves = await Shelf.find({ name })
      .populate({
        path: "products.product",
        select: "images title id", 
      })
      .populate({
        path: "products.warehouseReceipt", // Populate thông tin phiếu nhập kho
        select: "idPNK createdAt products", // Chọn trường cần thiết từ WarehouseReceipt
      });

    if (shelves.length === 0) {
      return res.status(404).json({ message: "No shelves found with this name" });
    }
    // Lưu kết quả sản phẩm từ kệ
    const result = [];

    // Duyệt qua từng kệ và lấy thông tin sản phẩm
    for (const shelf of shelves) {
      for (const item of shelf.products) {
        const warehouseReceipt = item.warehouseReceipt;
        const productId = item.product._id.toString();
        const sumQuantity = item.sumQuantity; // Lấy sumQuantity trực tiếp từ kệ
        const quantity = item.quantity; // Lấy số lượng hiện tại từ kệ

        // Tìm thông tin phiếu nhập kho và ngày hết hạn
        let expires = null;
        if (warehouseReceipt) {
          const productInReceipt = warehouseReceipt.products.find(
            (product) => product.product.toString() === productId
          );
          expires = productInReceipt ? productInReceipt.expires : null;
        }

        // Thêm sản phẩm vào kết quả
        result.push({
          _id: item.product._id,
          idPNK: warehouseReceipt ? warehouseReceipt.idPNK : null,
          images: item.product.images,
          title: item.product.title,
          expires,
          quantity, // Số lượng hiện tại
          sumQuantity,
          id: item.product.id // Tổng số lượng từ kệ
        });
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
    const shelves = await Shelf.find({}).populate("products.product");

    // Lấy danh sách sản phẩm từ tất cả các kệ
    const products = shelves.flatMap((shelf) =>
      shelf.products.map((p) => ({
        ...p.product.toObject(), // Chuyển đổi đối tượng Mongoose sang đối tượng thuần
        quantity: p.quantity, // Thêm số lượng sản phẩm từ kệ
        warehouseReceipt: p.warehouseReceipt, // Thêm phiếu nhập kho
      }))
    );

    // Lọc sản phẩm theo title nếu có
    let filteredProducts = products;
    if (title) {
      const regex = new RegExp(title, "i"); // Tạo biểu thức chính quy không phân biệt hoa thường
      filteredProducts = products.filter(
        (product) => regex.test(product.title) // Kiểm tra xem title sản phẩm có chứa chuỗi tìm kiếm không
      );
    }

    return res.status(200).json({
      success: true,
      products:
        filteredProducts.length > 0
          ? filteredProducts
          : "Không có sản phẩm nào",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sản phẩm",
    });
  }
});

const filterAllProductInShelf = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy tất cả các kệ và populate sản phẩm
    const shelves = await Shelf.find({}).populate("products.product");

    // Lấy danh sách sản phẩm từ tất cả các kệ
    const products = shelves.flatMap((shelf) =>
      shelf.products.map((p) => ({
        ...p.product.toObject(), // Chuyển đổi đối tượng Mongoose sang đối tượng thuần
        quantity: p.quantity, // Thêm số lượng sản phẩm từ kệ
        warehouseReceipt: p.warehouseReceipt, // Thêm phiếu nhập kho
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
      message: "Lỗi khi lấy sản phẩm",
    });
  }
});

const filterCategoryByProductInShelf = expressAsyncHandler(async (req, res) => {
  const products = await Shelf.find({});
  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Cannot get products",
  });
});

const filterProductMultiCondition = expressAsyncHandler(async (req, res) => {
  try {
    const { title, categoryName, brandName } = req.body;

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

    // Lọc và tính toán số lượng sản phẩm từ các phiếu nhập kho
    const products = receipts.flatMap((receipt) =>
      receipt.products
        .filter((item) => {
          const product = item.product || {};
          let isValid = true;

          // Kiểm tra tiêu chí lọc
          if (
            title &&
            !product.title?.toLowerCase().includes(title.toLowerCase())
          ) {
            isValid = false;
          }
          if (
            categoryName &&
            !(
              product.category?.name?.toLowerCase() ===
              categoryName.toLowerCase()
            )
          ) {
            isValid = false;
          }
          if (
            brandName &&
            !(product.brand?.name?.toLowerCase() === brandName.toLowerCase())
          ) {
            isValid = false;
          }

          return isValid; // Chỉ giữ lại sản phẩm hợp lệ
        })
        .map((item) => {
          const convertQuantity = item.unit?.convertQuantity || 1;
          const calculatedQuantity = item.quantity
            ? item.quantity * convertQuantity
            : 0;

          const product = item.product || {};
          const price = product.price || 0;
          const importPrice = item.importPrice || 0;

          return {
            idPNK: receipt.idPNK,
            images: product.images || [],
            title: product.title || "N/A",
            category: product.category?.name || "N/A",
            brand: product.brand?.name || "N/A",
            quantity: calculatedQuantity,
            price: price,
            importPrice: importPrice,
            _id: product._id,
            warehouseReceipt: receipt._id,
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

const getSumQuantityProductInShelf = expressAsyncHandler(async (req, res) => {
  const shelfs = await Shelf.find({}).populate({
    path: "products.product",
    select: "title"
  });
  const products = shelfs.flatMap((shelf) => shelf.products);
  
  const productMap = {};

  products.forEach((product) => {
    let productId = product.product._id.toString(); // Lấy ID sản phẩm
    let quantity = product.quantity; // Lấy số lượng
    let name = product.product.title || "Unknown Product"; // Lấy tên sản phẩm (có thể cần thêm logic để lấy tên)

    if (productMap[productId]) {
      productMap[productId].quantity += quantity; // Cộng dồn số lượng nếu sản phẩm đã tồn tại
    } else {
      productMap[productId] = {
        productId: productId,
        quantity: quantity,
        name: name
      };
    }
  });

  const sumQuantity = Object.values(productMap);

  return res.status(200).json({
    success: sumQuantity.length > 0, // Kiểm tra xem có sản phẩm không
    sumQuantity: sumQuantity.length > 0 ? sumQuantity : "Cannot get quantity",
  });
});


module.exports = {
  createShelf,
  getListShelf,
  filterProductByShelf,
  filterProductByNameInShelf,
  filterAllProductInShelf,
  filterCategoryByProductInShelf,
  filterProductMultiCondition,
  getSumQuantityProductInShelf,
};
