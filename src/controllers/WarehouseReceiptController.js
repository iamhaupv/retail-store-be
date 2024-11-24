const expressAsyncHandler = require("express-async-handler");
const { WarehouseReceipt, Product, Unit } = require("../models/index");

// create warehouse receipt
// const createWarehouseReceipt = expressAsyncHandler(async (req, res) => {
//   // Kiểm tra dữ liệu đầu vào
//   if (!req.body || Object.keys(req.body).length === 0) {
//     return res.status(400).json({ success: false, message: "Missing input!" });
//   }

//   const { user, description, idPNK, products, expires } = req.body;

//   // Tạo phiếu lập kho mới
//   const newWarehouseReceipt = await WarehouseReceipt.create({
//     user,
//     description,
//     idPNK,
//     products: [], // Khởi tạo danh sách sản phẩm
//     expires,
//   });

//   // Xử lý từng sản phẩm trong danh sách
//   for (const item of products) {
//     const { product, quantity, importPrice, unit, expires } = item; // Bao gồm cả unit và importPrice

//     // Kiểm tra từng trường trong sản phẩm
//     if (!product || quantity == null || !unit || importPrice == null) {
//       return res.status(400).json({ success: false, message: "Missing product fields!" });
//     }

//     // Lấy thông tin đơn vị tương ứng
//     const unitInfo = await Unit.findById(unit);
//     if (!unitInfo) {
//       return res.status(404).json({ success: false, message: `Unit with ID ${unit} not found.` });
//     }

//     // Quy đổi số lượng theo hệ số quy đổi
//     const convertedQuantity = quantity * unitInfo.convertQuantity;

//     // Cập nhật số lượng cho sản phẩm tương ứng
//     const updatedProduct = await Product.findOneAndUpdate(
//       { _id: product },
//       {
//         $inc: { quantity: convertedQuantity }, // Cập nhật số lượng đã quy đổi
//         $set: { status: "in_stock" }, // Đặt trạng thái
//         $push: { warehouseReceipt: newWarehouseReceipt._id }, // Thêm phiếu vào danh sách phiếu
//       },
//       { new: true }
//     );

//     if (!updatedProduct) {
//       return res.status(404).json({ success: false, message: `Product with ID ${product} not found.` });
//     }

//     // Thêm sản phẩm vào danh sách sản phẩm của phiếu nhập kho
//     newWarehouseReceipt.products.push({
//       product: updatedProduct._id, // ID sản phẩm
//       quantity: quantity, // Số lượng đã quy đổi
//       importPrice: importPrice, // Giá nhập
//       expires: expires, // Hạn sử dụng
//       unit: unit, // Đơn vị
//       quantityDynamic: convertedQuantity
//     });
//   }

//   // Lưu lại phiếu nhập kho với danh sách sản phẩm đã cập nhật
//   await newWarehouseReceipt.save();

//   return res.status(201).json({
//     success: true,
//     newWarehouseReceipt,
//   });
// });

const createWarehouseReceipt = expressAsyncHandler(async (req, res) => {
  // Kiểm tra dữ liệu đầu vào
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Missing input!" });
  }

  const { user, description, idPNK, products, expires } = req.body;

  // Tạo phiếu lập kho mới
  const newWarehouseReceipt = await WarehouseReceipt.create({
    user,
    description,
    idPNK,
    products: [], // Khởi tạo danh sách sản phẩm
    expires,
  });

  // Xử lý từng sản phẩm trong danh sách
  for (const item of products) {
    const { product, quantity, importPrice, unit, expires } = item; // Bao gồm cả unit và importPrice

    // Kiểm tra từng trường trong sản phẩm
    if (!product || quantity == null || !unit || importPrice == null) {
      return res
        .status(400)
        .json({ success: false, message: "Missing product fields!" });
    }

    // Lấy thông tin đơn vị tương ứng
    const unitInfo = await Unit.findById(unit);
    if (!unitInfo) {
      return res
        .status(404)
        .json({ success: false, message: `Unit with ID ${unit} not found.` });
    }

    // Quy đổi số lượng theo hệ số quy đổi
    const convertedQuantity = quantity * unitInfo.convertQuantity;

    // Cập nhật số lượng cho sản phẩm tương ứng
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: product },
      {
        $inc: {
          quantity: convertedQuantity,
          sumQuantity: convertedQuantity,
        },
        $set: { status: "in_stock" },
        $push: { warehouseReceipt: newWarehouseReceipt._id },
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({
          success: false,
          message: `Product with ID ${product} not found.`,
        });
    }

    // Thêm sản phẩm vào danh sách sản phẩm của phiếu nhập kho
    newWarehouseReceipt.products.push({
      product: updatedProduct._id, // ID sản phẩm
      quantity: quantity, // Số lượng đã quy đổi
      importPrice: importPrice, // Giá nhập
      expires: expires, // Hạn sử dụng
      unit: unit, // Đơn vị
      quantityDynamic: convertedQuantity,
    });
  }

  // Lưu lại phiếu nhập kho với danh sách sản phẩm đã cập nhật
  await newWarehouseReceipt.save();

  return res.status(201).json({
    success: true,
    newWarehouseReceipt,
  });
});

// get all warehouse receipt
// const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
//   const receipts = await WarehouseReceipt.find({ isDisplay: true })
//   .populate({
//     path: "products.product",  // Populate thông tin sản phẩm
//     populate: {
//       path: "brand",  // Populate thông tin về thương hiệu của sản phẩm
//       select: "name phone address",  // Chỉ lấy tên của thương hiệu
//     },
//   })
//   .populate("user")  // Populate thông tin người dùng
//   .populate("products.unit")  // Populate thông tin đơn vị của sản phẩm
//   .sort({ createdAt: -1 })  // Sắp xếp theo ngày tạo giảm dần
//   .exec();
//   return res.status(200).json({
//     success: receipts ? true : false,
//     receipts: receipts ? receipts : "Cannot get all warehouse receipt!",
//   });
// });
// const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
//   // const receipts = await WarehouseReceipt.find({ isDisplay: true })
//   //   .populate({
//   //     path: "products.product",  // Populate thông tin sản phẩm
//   //     populate: {
//   //       path: "brand",  // Populate thông tin về thương hiệu của sản phẩm
//   //       select: "name phone address",  // Chỉ lấy tên của thương hiệu
//   //     },
//   //   })
//   //   .populate("user")  // Populate thông tin người dùng
//   //   .populate("products.unit")  // Populate thông tin đơn vị của sản phẩm
//   //   .sort({ createdAt: -1 })  // Sắp xếp theo ngày tạo giảm dần
//   //   .exec();
//   const receipts = await WarehouseReceipt.find({ isDisplay: true })
//   .populate({
//     path: "products.product",  // Populate thông tin sản phẩm
//     select: "title expires brand",  // Lấy tên, ngày hết hạn và thương hiệu của sản phẩm
//     populate: {
//       path: "brand",  // Populate thông tin về thương hiệu của sản phẩm
//       select: "name phone address",  // Chỉ lấy tên, điện thoại và địa chỉ của thương hiệu
//     },
//   })
//   .populate("user")  // Populate thông tin người dùng
//   .populate("products.unit")  // Populate thông tin đơn vị của sản phẩm
//   .sort({ createdAt: -1 })  // Sắp xếp theo ngày tạo giảm dần
//   .exec();

//   // Tạo một danh sách phiếu với số lượng đã quy đổi
//   const receiptsWithConvertedQuantities = await Promise.all(
//     receipts.map(async (receipt) => {
//       const productsWithConvertedQuantities = await Promise.all(
//         receipt.products.map(async (item) => {
//           const { product, quantity, unit } = item;
//           const unitInfo = await Unit.findById(unit); // Lấy thông tin đơn vị

//           // Tính toán số lượng đã quy đổi
//           const convertedQuantity = quantity * (unitInfo ? unitInfo.convertQuantity : 1);

//           return {
//             product,
//             quantity: convertedQuantity, // Sử dụng số lượng đã quy đổi
//             unit,
//           };
//         })
//       );

//       return {
//         ...receipt._doc,
//         products: productsWithConvertedQuantities,
//       };
//     })
//   );

//   return res.status(200).json({
//     success: receiptsWithConvertedQuantities.length > 0,
//     receipts: receiptsWithConvertedQuantities.length > 0 ? receiptsWithConvertedQuantities : "Cannot get all warehouse receipt!",
//   });
// });
// const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
//   const receipts = await WarehouseReceipt.find({ isDisplay: true })
//     .populate({
//       path: "products.product",  // Populate thông tin sản phẩm
//       select: "title expires brand importPrice",  // Lấy tên, ngày hết hạn và thương hiệu của sản phẩm
//       populate: {
//         path: "brand",  // Populate thông tin về thương hiệu của sản phẩm
//         select: "name phone address",  // Chỉ lấy tên, điện thoại và địa chỉ của thương hiệu
//       },
//     })
//     .populate("user")  // Populate thông tin người dùng
//     .populate("products.unit")  // Populate thông tin đơn vị của sản phẩm
//     .sort({ createdAt: -1 })  // Sắp xếp theo ngày tạo giảm dần
//     .exec();

//   // Tạo một danh sách phiếu với số lượng đã quy đổi
//   const receiptsWithConvertedQuantities = await Promise.all(
//     receipts.map(async (receipt) => {
//       const productsWithConvertedQuantities = await Promise.all(
//         receipt.products.map(async (item) => {
//           const { product, importPrice, unit } = item;
//           const unitInfo = await Unit.findById(unit); // Lấy thông tin đơn vị

//           // Tính toán số lượng đã quy đổi
//           const convertedQuantity = importPrice * (unitInfo ? unitInfo.convertQuantity : 1);

//           return {
//             product,
//             quantity: convertedQuantity, // Sử dụng số lượng đã quy đổi
//             unit,
//             expires: item.expires, // Lấy thông tin ngày hết hạn từ sản phẩm
//           };
//         })
//       );

//       return {
//         ...receipt._doc,
//         products: productsWithConvertedQuantities,
//       };
//     })
//   );

//   return res.status(200).json({
//     success: receiptsWithConvertedQuantities.length > 0,
//     receipts: receiptsWithConvertedQuantities.length > 0 ? receiptsWithConvertedQuantities : "Cannot get all warehouse receipt!",
//   });
// });
const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
  try {
    const receipts = await WarehouseReceipt.find({ isDisplay: true })
      .populate({
        path: "products.product",
        select: "title expires brand importPrice",
        populate: {
          path: "brand",
          select: "name phone address",
        },
      })
      .populate("user")
      .populate("products.unit")
      .sort({ createdAt: -1 })
      .exec();

    const receiptsWithDetails = await Promise.all(
      receipts.map(async (receipt) => {
        const productsWithDetails = await Promise.all(
          receipt.products.map(async (item) => {
            const { product, quantity, importPrice, unit } = item; // Lấy importPrice và quantity từ item
            const unitInfo = unit ? await Unit.findById(unit) : null;

            const convertedQuantity = unitInfo
              ? unitInfo.convertQuantity
              : quantity; // Sử dụng quantity từ item

            // Tính tổng giá trị sản phẩm
            const totalValue = importPrice * convertedQuantity;

            return {
              product,
              quantity: quantity,
              importPrice, // Thêm importPrice vào kết quả
              totalValue,
              unit,
              expires: item.expires,
            };
          })
        );

        const totalReceiptValue = productsWithDetails.reduce(
          (total, product) => {
            return total + product.totalValue;
          },
          0
        );

        return {
          ...receipt._doc,
          products: productsWithDetails,
          totalValue: totalReceiptValue,
        };
      })
    );

    return res.status(200).json({
      success: receiptsWithDetails.length > 0,
      receipts:
        receiptsWithDetails.length > 0
          ? receiptsWithDetails
          : "Cannot get all warehouse receipt!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
});

// last id receipt
const lastIdReceipt = expressAsyncHandler(async (req, res) => {
  try {
    const lastReceipt = await WarehouseReceipt.findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastReceipt) {
      return res.status(200).json({ lastId: null });
    }

    const lastId = lastReceipt.idPNK; // Sử dụng trường đúng để lấy mã phiếu
    res.status(200).json({ lastId });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy mã phiếu nhập kho cuối cùng",
      error: error.message,
    });
  }
});
//
const changeIsDisplay = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const isDisplay = await WarehouseReceipt.findByIdAndUpdate(
    id,
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
//
const filterProductByCategoryNameInReceipt = expressAsyncHandler(
  async (req, res) => {
    try {
      // Lấy tên category từ query parameters (thí dụ: ?categoryName=Electronics)
      const { categoryName } = req.body;

      // Tạo điều kiện tìm kiếm cho categoryName
      const matchCondition = categoryName
        ? {
            "products.product.category.name": {
              $regex: categoryName,
              $options: "i",
            }, // Tìm kiếm không phân biệt chữ hoa chữ thường
          }
        : {};

      // Fetch warehouse receipts, lọc theo category và populate thông tin liên quan
      const receipts = await WarehouseReceipt.find(matchCondition).populate({
        path: "products.product",
        populate: {
          path: "category",
          select: "name", // Chỉ chọn tên category
        },
      });

      // Kiểm tra xem có nhận được receipts không
      if (!receipts || receipts.length === 0) {
        return res.status(200).json({
          success: false,
          message: "Không có biên nhận nào phù hợp với tên category",
          receipts: [],
        });
      }

      // Trả về kết quả
      return res.status(200).json({
        success: true,
        receipts: receipts, // Trả về danh sách receipts đã lọc
      });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu biên nhận:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi lấy dữ liệu biên nhận",
      });
    }
  }
);

const filterByIdPNK = expressAsyncHandler(async (req, res) => {
  const { idPNK } = req.body;
  const receipts = await WarehouseReceipt.find({
    idPNK: { $regex: idPNK, $options: "i" },
  });

  return res.status(200).json({
    success: receipts ? true : false,
    receipts: receipts ? receipts : "Cannot get receipts",
  });
});

const filterReceiptByDate = expressAsyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  let query = {}; // Khởi tạo đối tượng query

  // Hàm chuyển đổi ngày từ định dạng 'yyyy/MM/dd' sang đối tượng Date
  const convertToDate = (dateString) => {
    const [year, month, day] = dateString.split("/"); // Tách năm, tháng, ngày
    return new Date(`${year}-${month}-${day}T00:00:00Z`); // Chuyển sang định dạng chuẩn của JavaScript
  };

  if (startDate && endDate) {
    // Chuyển đổi startDate và endDate thành đối tượng Date
    query.createdAt = {
      $gte: convertToDate(startDate), // Ngày bắt đầu
      $lte: convertToDate(endDate), // Ngày kết thúc
    };
  }

  try {
    const receipts = await WarehouseReceipt.find(query); // Truy vấn với các điều kiện đã lọc

    return res.status(200).json({
      success: receipts.length > 0,
      receipts: receipts.length > 0 ? receipts : "No receipts found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

module.exports = {
  createWarehouseReceipt,
  getAllWarehouseReceipt,
  lastIdReceipt,
  changeIsDisplay,
  filterProductByCategoryNameInReceipt,
  filterByIdPNK,
  filterReceiptByDate,
};
