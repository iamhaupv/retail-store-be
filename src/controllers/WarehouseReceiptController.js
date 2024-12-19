const expressAsyncHandler = require("express-async-handler");
const { WarehouseReceipt, Product, Unit } = require("../models/index");
const moment = require('moment');  
const mongoose = require('mongoose');
// create warehouse receipt
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
  if (!idPNK) {
    return res.status(400).json({
      success: false,
      message: "idPNK is required",
    });
  }

  try {
    const receipts = await WarehouseReceipt.find({
      idPNK: { $regex: idPNK, $options: "i" },
    }).populate({
      path: "user",
      select: "employee",
      populate: ({
        path: "employee",
        select: "name"
      })
    }).populate({
      path: "products.product",
      select: "brand title",
      populate: {
        path: "brand", 
        select: "name address supplyName phone"
      }
    }).populate({
      path: "products.unit",
      select: "convertQuantity name"
    });
    return res.status(200).json({
      success: true,
      receipts: receipts.length > 0 ? receipts : "No receipts found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving receipts",
      error: error.message,
    });
  }
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
    const start = convertToDate(startDate);
    const end = convertToDate(endDate);
    
    // Đặt lại giờ cho ngày bắt đầu và ngày kết thúc
    start.setHours(0, 0, 0, 0); // Ngày bắt đầu từ 00:00:00
    end.setHours(23, 59, 59, 999); // Ngày kết thúc đến 23:59:59.999
    
    query.createdAt = {
      $gte: start, // Ngày bắt đầu
      $lte: end,   // Ngày kết thúc
    };
  }

  try {
    const receipts = await WarehouseReceipt.find(query).populate({
      path: "user",
      select: "employee",
      populate: {
        path: "employee",
        select: "name"
      }
    }).populate({
      path: "products.product",
      select: "title brand",
      populate: {
        path: "brand",
        select: "name address supplyName phone"
      }
    }).populate({
      path: "products.unit",
      select: "name convertQuantity"
    }).sort({createdAt: -1}).exec();

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

const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
  try {
    const receipts = await WarehouseReceipt.find({ isDisplay: true })
      .populate({
        path: "products.product",
        select: "title expires brand  importPrice",
        populate: {
          path: "brand",
          select: "name supplyName phone address",
        },
      })
      .populate({
        path: "user",
        select: "employee", 
        populate: {
          path: "employee",
          select: "name phone"
        }
      })
      .populate({
        path: "products.unit",
        select: "name convertQuantity"
      })
      .sort({ createdAt: -1 })
      .exec();

    const receiptsWithDetails = await Promise.all(
      receipts.map(async (receipt) => {
        const productsWithDetails = await Promise.all(
          receipt.products.map(async (item) => {
            const { product, quantity, importPrice, unit, quantityDynamic } = item; // Lấy importPrice và quantity từ item
            const unitInfo = unit ? await Unit.findById(unit) : null;

            const convertedQuantity = unitInfo
              ? unitInfo.convertQuantity
              : quantity; // Sử dụng quantity từ item

            // Tính tổng giá trị sản phẩm
            const totalValue = importPrice * convertedQuantity;

            return {
              quantityDynamic,
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

const sumTotalAmountReceipt = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy tất cả các hóa đơn nhập kho
    const receipts = await WarehouseReceipt.find()
    .populate({
      path: "products.unit",
      select: "convertQuantity"
    });
    
    // Tính tổng số tiền
    const totalAmount = receipts.reduce((acc, receipt) => {
      // Duyệt qua từng sản phẩm trong hóa đơn
      receipt.products.forEach(product => {
        // Tính số tiền cho mỗi sản phẩm
        const productTotal = product.quantity * product.importPrice * product.unit.convertQuantity;
        // Cộng dồn vào tổng
        acc += productTotal;
      });
      return acc;
    }, 0);
    
    // Trả về tổng số tiền
    return res.status(200).json({
      success: true,
      sum: {
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    // Xử lý lỗi nếu có
    console.log("Error while calculating total amount:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

const getFilteredWarehouseReceipts = expressAsyncHandler(async (req, res) => {
  const { category, brand, idPNK } = req.body;

  try {
    // Tìm tất cả các phiếu nhập kho có thuộc tính isDisplay là true
    const receipts = await WarehouseReceipt.find({ isDisplay: true })
      .populate({
        path: "products.product",
        select: "title expires brand importPrice idPNK id discount images quantity category",
        populate: [
          {
            path: "brand",
            select: "name",
          },
          {
            path: "unit",
            select: "name",
          },
          {
            path: "category",
            select: "name",
          },
        ],
      })
      .populate({
        path: "user",
        select: "_id",
      })
      .populate("products.unit")
      .sort({ createdAt: -1 })
      .exec();

    // Chuyển idPNK thành số nếu có
    const idPNKNumber = idPNK ? Number(idPNK) : null;

    // Lọc phiếu nhập kho dựa trên các điều kiện category, brand và idPNK
    const filteredReceipts = receipts.filter((receipt) => {
      let match = true;

      // Lọc theo danh mục nếu có
      if (category && category.trim() !== "") {
        match =
          match &&
          receipt.products.some((item) => {
            const categoryName =
              item.product.category && item.product.category.name
                ? item.product.category.name.trim().toLowerCase()
                : "";
            return categoryName === category.trim().toLowerCase();
          });
      }

      // Lọc theo thương hiệu nếu có
      if (brand && brand.trim() !== "") {
        match =
          match &&
          receipt.products.some(
            (item) =>
              item.product.brand &&
              item.product.brand.name.toLowerCase().trim() ===
                brand.toLowerCase().trim()
          );
      }

      // Lọc theo idPNK nếu có và idPNK hợp lệ
      if (idPNKNumber && !isNaN(idPNKNumber)) {
        match =
          match && receipt.idPNK && receipt.idPNK == idPNKNumber;
      }

      return match;
    });

    // Nếu không có phiếu nhập kho nào khớp với điều kiện
    if (filteredReceipts.length === 0) {
      return res.status(200).json({
        success: true,
        receipts: [],
        message: "Không tìm thấy phiếu nhập kho nào khớp với điều kiện.",
      });
    }

    // Lấy chi tiết của các sản phẩm trong các phiếu nhập kho đã lọc
    const receiptsWithDetails = await Promise.all(
      filteredReceipts.map(async (receipt) => {
        const productsWithDetails = await Promise.all(
          receipt.products
            .filter((item) => item.isDisplay) // Chỉ lấy sản phẩm có isDisplay: true
            .map(async (item) => {
              const { product, quantity, importPrice, unit, quantityDynamic } =
                item;
              const unitInfo = unit ? await Unit.findById(unit) : null;

              const convertedQuantity = unitInfo
                ? unitInfo.convertQuantity * quantity
                : quantity;

              const totalValue = importPrice * convertedQuantity;
              return {
                quantityDynamic,
                product,
                quantity,
                importPrice,
                totalValue,
                unit,
                expires: item.expires,
              };
            })
        );

        // Tính tổng giá trị của phiếu nhập kho
        const totalReceiptValue = productsWithDetails.reduce(
          (total, product) => total + product.totalValue,
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
          : "Không có phiếu nhập kho nào!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server nội bộ",
    });
  }
});

const searchProductById = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy id sản phẩm từ params hoặc body
    const { productId } = req.body;

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

    // Lọc sản phẩm và lấy thông tin của tất cả các mã phiếu
    const products = receipts.flatMap((receipt) =>
      receipt.products
        .filter((item) => item.product?.id == productId) // Lọc sản phẩm theo productId
        .map((item) => {
          const convertQuantity = item.unit?.convertQuantity || 1; // Lấy hệ số quy đổi
          const calculatedQuantity = item.quantityDynamic
            ? item.quantity * convertQuantity
            : 0; // Tính toán số lượng

          const product = item.product || {};
          const price = product.price || 0; // Giá sản phẩm từ product
          const importPrice = item.importPrice || 0; // Giá nhập vào

          return {
            expires: item.expires,
            idPNK: receipt.idPNK, // Mã phiếu
            images: product.images || [], // Hình ảnh sản phẩm
            title: product.title || "N/A", // Tiêu đề sản phẩm
            category: product.category?.name || "N/A", // Loại sản phẩm
            brand: product.brand?.name || "N/A", // Thương hiệu sản phẩm
            quantity: calculatedQuantity, // Số lượng đã quy đổi
            price: price, // Giá bán
            importPrice: importPrice, // Giá nhập
            warehouseReceipt: receipt._id, // ID phiếu nhập kho
            quantityDynamic: item.quantityDynamic || 0, // Số lượng động
            id: product.id, // Mã sản phẩm
            sumQuantity: product.sumQuantity, // Tổng số lượng
          };
        })
    );

    // Kiểm tra xem sản phẩm có trong các phiếu nhập kho không
    if (products.length > 0) {
      return res.status(200).json({
        success: true,
        products: products,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tìm thấy trong các phiếu nhập kho.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
    });
  }
});

const searchProductByName = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy productId hoặc title từ body
    const { productId, title } = req.body;

    // Kiểm tra xem có truyền productId hoặc title không
    if (!productId && !title) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp mã sản phẩm hoặc tên sản phẩm để tìm kiếm.",
      });
    }

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

    // Lọc sản phẩm theo productId hoặc title
    const products = receipts.flatMap((receipt) =>
      receipt.products
        .filter((item) => {
          if (!item.isDisplay) return false;
          // Lọc sản phẩm theo mã sản phẩm (productId) hoặc tên sản phẩm (title)
          if (productId) {
            return item.product?.id == productId; // Kiểm tra theo mã sản phẩm
          } else if (title) {
            // return item.product?.title.toLowerCase() == title.toLowerCase(); // Kiểm tra theo tên sản phẩm (case-insensitive)
            return item.product?.title.toLowerCase().includes(title.toLowerCase());
          }
        })
        .map((item) => {
          const convertQuantity = item.unit?.convertQuantity || 1; // Lấy hệ số quy đổi
          const calculatedQuantity = item.quantityDynamic
            ? item.quantity * convertQuantity
            : 0; // Tính toán số lượng

          const product = item.product || {};
          const price = product.price || 0; // Giá sản phẩm từ product
          const importPrice = item.importPrice || 0; // Giá nhập vào

          return {
            expires: item.expires,
            idPNK: receipt.idPNK, // Mã phiếu
            images: product.images || [], // Hình ảnh sản phẩm
            title: product.title || "N/A", // Tiêu đề sản phẩm
            category: product.category?.name || "N/A", // Loại sản phẩm
            brand: product.brand?.name || "N/A", // Thương hiệu sản phẩm
            quantity: calculatedQuantity, // Số lượng đã quy đổi
            price: price, // Giá bán
            importPrice: importPrice, // Giá nhập
            warehouseReceipt: receipt._id, // ID phiếu nhập kho
            quantityDynamic: item.quantityDynamic || 0, // Số lượng động
            id: product.id, // Mã sản phẩm
            sumQuantity: product.sumQuantity, // Tổng số lượng
            unit: product.unit.name,
            discount: product.discount || 0,
            _id: product._id
          };
        })
    );

    // Kiểm tra xem sản phẩm có trong các phiếu nhập kho không
    if (products.length > 0) {
      return res.status(200).json({
        success: true,
        products: products,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm nào theo mã sản phẩm hoặc tên sản phẩm.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
    });
  }
});

// const searchProductExpires = expressAsyncHandler(async (req, res) => {
//   const { expirationStatus } = req.body;  // Nhận trạng thái hết hạn từ request body
//   const currentDate = moment();  // Ngày hiện tại
//   const fiveDaysFromNow = moment().add(5, 'days');  // 5 ngày sau
//   if(!expirationStatus || expirationStatus === "") return res.status(201).json({
//     products: []
//   })
//   let expirationCondition = {};

//   // Xử lý theo trạng thái hết hạn
//   if (expirationStatus === "Còn hạn") {
//     expirationCondition = {
//       "products.expires": { $gte: currentDate.toDate() },  // Ngày hết hạn sau ngày hiện tại
//     };
//   } else if (expirationStatus === "Hết hạn") {
//     expirationCondition = {
//       "products.expires": { $lt: currentDate.toDate() },  // Ngày hết hạn trước ngày hiện tại
//     };
//   } else if (expirationStatus === "Gần hết hạn") {
//     expirationCondition = {
//       "products.expires": {
//         $gte: currentDate.toDate(),  // Ngày hết hạn sau ngày hiện tại
//         $lte: fiveDaysFromNow.toDate(),  // Ngày hết hạn trong vòng 5 ngày từ hôm nay
//       },
//     };
//   }

//   // Lấy tất cả các phiếu nhập kho và populate thông tin sản phẩm và các trường khác của phiếu
//   const receipts = await WarehouseReceipt.find(expirationCondition)
//     .populate({
//       path: "products.product",
//       select: "title expires id images discount price",  // Chọn các trường cần thiết cho sản phẩm
//       populate: [
//         { path: "brand", select: "name" },  // Tên thương hiệu
//         { path: "category", select: "name" },  
//         { path: "unit", select: "name" },
//       ],
//     })
//     .populate({
//       path: "products.unit",
//       select: "convertQuantity",  // Thông tin đơn vị
//     })
//     .sort({ createdAt: -1 })
//     .exec();

//   // Mảng để lưu trữ các sản phẩm thỏa mãn yêu cầu
//   let products = [];

//   // Duyệt qua tất cả các phiếu nhập kho và lọc sản phẩm
//   receipts.forEach(receipt => {
//     receipt.products.forEach(item => {
//       const productExpires = moment(item.expires);  // Ngày hết hạn của sản phẩm

//       if (
//         (expirationStatus === "Còn hạn" && productExpires.isAfter(currentDate)) ||
//         (expirationStatus === "Hết hạn" && productExpires.isBefore(currentDate)) ||
//         (expirationStatus === "Gần hết hạn" && productExpires.isBetween(currentDate, fiveDaysFromNow, null, '[)'))
//       ) {
//         const product = {
//           unit: item.product.unit.name,  
//           expires: item.expires,  
//           idPNK: receipt.idPNK,  
//           images: item.product.images, 
//           title: item.product.title, 
//           category: item.product.category.name,  
//           brand: item.product.brand.name,  
//           quantity: item.quantity,  
//           price: item.product.price,  
//           importPrice: item.importPrice,  
//           _id: item.product._id,  
//           warehouseReceipt: receipt._id,  
//           quantityDynamic: item.quantityDynamic,  
//           id: item.product.id,  
//           discount: item.product.discount
//         };

//         products.push(product);
//       }
//     });
//   });

//   // Đếm số lượng sản phẩm
//   console.log(`Total products found: ${products.length}`);

//   // Trả về thông tin của phiếu nhập kho và các sản phẩm
//   return res.status(200).json({
//     success: products.length > 0,  // Nếu có sản phẩm, success = true
//     totalProducts: products.length,  // Trả về tổng số sản phẩm thỏa mãn
//     products: products,  // Trả về các sản phẩm đã lọc
//     totalReceipts: receipts.length,  // Tổng số phiếu nhập kho
//   });
// });
const searchProductExpires = expressAsyncHandler(async (req, res) => {
  const { expirationStatus } = req.body; // Nhận trạng thái hết hạn từ request body
  const currentDate = moment(); // Ngày hiện tại
  const fiveDaysFromNow = moment().add(5, 'days'); // 5 ngày sau

  if (!expirationStatus || expirationStatus === "") {
    return res.status(201).json({
      products: [],
    });
  }

  let expirationCondition = {};

  // Xử lý theo trạng thái hết hạn
  if (expirationStatus === "Còn hạn") {
    expirationCondition = {
      "products.expires": { $gte: currentDate.toDate() }, // Ngày hết hạn sau ngày hiện tại
    };
  } else if (expirationStatus === "Hết hạn") {
    expirationCondition = {
      "products.expires": { $lt: currentDate.toDate() }, // Ngày hết hạn trước ngày hiện tại
    };
  } else if (expirationStatus === "Gần hết hạn") {
    expirationCondition = {
      "products.expires": {
        $gte: currentDate.toDate(), // Ngày hết hạn sau ngày hiện tại
        $lte: fiveDaysFromNow.toDate(), // Ngày hết hạn trong vòng 5 ngày từ hôm nay
      },
    };
  }

  // Lấy tất cả các phiếu nhập kho có isDisplay: true và populate thông tin sản phẩm
  const receipts = await WarehouseReceipt.find({
    ...expirationCondition,
    isDisplay: true, // Thêm điều kiện isDisplay: true
  })
    .populate({
      path: "products.product",
      select: "title expires id images discount price", // Chọn các trường cần thiết cho sản phẩm
      populate: [
        { path: "brand", select: "name" }, // Tên thương hiệu
        { path: "category", select: "name" },
        { path: "unit", select: "name" },
      ],
    })
    .populate({
      path: "products.unit",
      select: "convertQuantity", // Thông tin đơn vị
    })
    .sort({ createdAt: -1 })
    .exec();

  // Mảng để lưu trữ các sản phẩm thỏa mãn yêu cầu
  let products = [];

  // Duyệt qua tất cả các phiếu nhập kho và lọc sản phẩm
  receipts.forEach((receipt) => {
    receipt.products.forEach((item) => {
      if (!item.isDisplay) return; // Bỏ qua sản phẩm không có isDisplay: true

      const productExpires = moment(item.expires); // Ngày hết hạn của sản phẩm

      if (
        (expirationStatus === "Còn hạn" && productExpires.isAfter(currentDate)) ||
        (expirationStatus === "Hết hạn" && productExpires.isBefore(currentDate)) ||
        (expirationStatus === "Gần hết hạn" && productExpires.isBetween(currentDate, fiveDaysFromNow, null, "[)"))
      ) {
        const product = {
          unit: item.product.unit.name,
          expires: item.expires,
          idPNK: receipt.idPNK,
          images: item.product.images,
          title: item.product.title,
          category: item.product.category.name,
          brand: item.product.brand.name,
          quantity: item.quantity,
          price: item.product.price,
          importPrice: item.importPrice,
          _id: item.product._id,
          warehouseReceipt: receipt._id,
          quantityDynamic: item.quantityDynamic,
          id: item.product.id,
          discount: item.product.discount,
        };

        products.push(product);
      }
    });
  });

  // Đếm số lượng sản phẩm
  console.log(`Total products found: ${products.length}`);

  // Trả về thông tin của phiếu nhập kho và các sản phẩm
  return res.status(200).json({
    success: products.length > 0, // Nếu có sản phẩm, success = true
    totalProducts: products.length, // Trả về tổng số sản phẩm thỏa mãn
    products: products, // Trả về các sản phẩm đã lọc
    totalReceipts: receipts.length, // Tổng số phiếu nhập kho
  });
});

const getAllWarehouseReceiptWeek = expressAsyncHandler(async (req, res) => {
  try {
    // Lấy startDate và endDate từ req.body
    const { startDate, endDate } = req.body;

    // Kiểm tra nếu startDate hoặc endDate không được cung cấp
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required.",
      });
    }

    // Chuyển đổi startDate và endDate thành dạng UTC để tránh sai lệch múi giờ
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Kiểm tra nếu startDate hoặc endDate không hợp lệ
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    // Truy vấn các hóa đơn trong khoảng thời gian
    const receipts = await WarehouseReceipt.find({
      isDisplay: true,
      createdAt: {
        $gte: start, // >= startDate
        $lte: end,   // <= endDate
      },
    })
      .populate({
        path: "products.product",
        select: "title expires brand importPrice",
        populate: {
          path: "brand",
          select: "name supplyName phone address",
        },
      })
      .populate({
        path: "user",
        select: "employee",
        populate: {
          path: "employee",
          select: "name phone",
        },
      })
      .populate({
        path: "products.unit",
        select: "name convertQuantity",
      })
      .sort({ createdAt: -1 });

    // Xử lý chi tiết sản phẩm và tính tổng giá trị từng hóa đơn
    const receiptsWithDetails = receipts.map((receipt) => {
      const productsWithDetails = receipt.products.map((item) => {
        const { product, quantity, importPrice, unit, quantityDynamic } = item;

        // Tính tổng giá trị cho mỗi sản phẩm
        const totalValue = importPrice * quantityDynamic;

        return {
          quantityDynamic,
          product,
          quantity,
          importPrice,
          totalValue,
          unit,
          expires: item.expires,
        };
      });

      // Tính tổng giá trị của hóa đơn
      const totalReceiptValue = productsWithDetails.reduce(
        (total, product) => total + product.totalValue,
        0
      );

      return {
        ...receipt._doc,
        products: productsWithDetails,
        totalValue: totalReceiptValue,
      };
    });

    // Trả về kết quả
    return res.status(200).json({
      success: receiptsWithDetails.length > 0,
      receipts: receiptsWithDetails.length > 0
        ? receiptsWithDetails
        : "Cannot get warehouse receipts for the specified period!",
    });
  } catch (error) {
    // Xử lý lỗi
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
});

// const changeIsDisplayProduct = expressAsyncHandler(async (req, res) => {
//   const { receiptId, productId, isDisplay } = req.body;

//   // Kiểm tra nếu receiptId không phải ObjectId hợp lệ
//   if (!mongoose.Types.ObjectId.isValid(receiptId)) {
//     return res.status(400).json({
//       success: false,
//       message: "receiptId không hợp lệ. Phải là ObjectId 24 ký tự hex.",
//     });
//   }

//   try {
//     const receipt = await WarehouseReceipt.findById(receiptId);

//     if (!receipt) {
//       return res.status(404).json({
//         success: false,
//         message: "Không tìm thấy phiếu nhập kho với receiptId này.",
//       });
//     }

//     // Tiến hành tìm và cập nhật sản phẩm
//     const product = receipt.products.find(item => item.product.toString() === productId);
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Không tìm thấy sản phẩm trong phiếu nhập kho này.",
//       });
//     }

//     // Cập nhật trường isDisplay
//     product.isDisplay = isDisplay;

//     await receipt.save();

//     return res.status(200).json({
//       success: true,
//       message: "Cập nhật thành công.",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Đã xảy ra lỗi khi cập nhật.",
//     });
//   }
// });

// const searchProducts = expressAsyncHandler(async (req, res) => {
//   const { expirationStatus, productId, title, category, brand, idPNK } = req.body;
//   const currentDate = moment();
//   const fiveDaysFromNow = moment().add(5, 'days');

//   // Kiểm tra xem có cung cấp thông tin tìm kiếm nào không
//   if (!expirationStatus && !productId && !title && !category && !brand && !idPNK) throw new Error("Missing input!")

//   let expirationCondition = {};

//   // Xử lý điều kiện hết hạn (expirationStatus)
//   if (expirationStatus === "Còn hạn") {
//     expirationCondition = { "products.expires": { $gte: currentDate.toDate() } };
//   } else if (expirationStatus === "Hết hạn") {
//     expirationCondition = { "products.expires": { $lt: currentDate.toDate() } };
//   } else if (expirationStatus === "Gần hết hạn") {
//     expirationCondition = { "products.expires": { $gte: currentDate.toDate(), $lte: fiveDaysFromNow.toDate() } };
//   }

//   try {
//     // Tìm tất cả các phiếu nhập kho có isDisplay: true và các điều kiện về ngày hết hạn
//     const receipts = await WarehouseReceipt.find({ isDisplay: true, ...expirationCondition })
//       .populate({
//         path: "products.product",
//         populate: [
//           { path: "brand", select: "name" },
//           { path: "category", select: "name" },
//           { path: "unit", select: "name" },
//         ],
//       })
//       .populate({ path: "products.unit", select: "name convertQuantity" })
//       .sort({ createdAt: -1 })
//       .exec();

//     // Lọc sản phẩm theo mã sản phẩm (productId), tên sản phẩm (title), danh mục (category), thương hiệu (brand), và mã phiếu (idPNK)
//     const products = receipts.flatMap((receipt) =>
//       receipt.products
//         .filter((item) => {
//           let match = true;

//           if (!item.isDisplay) return false; // Chỉ lấy sản phẩm có isDisplay: true

//           // Lọc theo productId
//           if (productId && item.product?.id !== productId) match = false;
  
//           // Lọc theo title (tên sản phẩm)
//           const sanitizedTitle = title.trim().toLowerCase();

//           // if (title && !item.product?.title.toLowerCase().includes(title.toLowerCase())) match = false;
//           if (
//             title &&
//             !new RegExp(`\\b${sanitizedTitle}\\b`, "i").test(item.product?.title)
//           ) {
//             match = false;
//           }
          

//           // Lọc theo category (danh mục sản phẩm)
//           if (category && item.product.category?.name.toLowerCase() !== category.toLowerCase()) match = false;

//           // Lọc theo brand (thương hiệu sản phẩm)
//           if (brand && item.product.brand?.name.toLowerCase() !== brand.toLowerCase()) match = false;

//           // Lọc theo idPNK (mã phiếu nhập kho)
//           if (idPNK && receipt.idPNK !== idPNK) match = false;

//           return match;
//         })
//         .map((item) => {
//           const convertQuantity = item.unit?.convertQuantity || 1;
//           const calculatedQuantity = item.quantityDynamic ? item.quantity * convertQuantity : 0;

//           const product = item.product || {};
//           return {
//             expires: item.expires,
//             idPNK: receipt.idPNK,
//             images: product.images || [],
//             title: product.title || "N/A",
//             category: product.category?.name || "N/A",
//             brand: product.brand?.name || "N/A",
//             quantity: calculatedQuantity,
//             price: product.price || 0,
//             importPrice: item.importPrice || 0,
//             warehouseReceipt: receipt._id,
//             quantityDynamic: item.quantityDynamic || 0,
//             id: product.id,
//             discount: product.discount || 0,
//             _id: product._id,
//             unit: product.unit.name
//           };
//         })
//     );

//     // Trả về sản phẩm nếu tìm thấy
//     if (products.length > 0) {
//       return res.status(200).json({
//         success: true,
//         products: products,
//       });
//     } else {
//       return res.status(200).json({
//         success: false,
//         products: [],
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
//     });
//   }
// });

const searchProducts = expressAsyncHandler(async (req, res) => {
  const { expirationStatus, productId, title, category, brand, idPNK } = req.body;
  const currentDate = moment(); // Ngày hiện tại
  const fiveDaysFromNow = moment().add(5, 'days'); // 5 ngày sau

  let expirationCondition = {};  // Điều kiện lọc về ngày hết hạn

  // Xử lý điều kiện hết hạn (expirationStatus)
  if (expirationStatus === "Còn hạn") {
    expirationCondition = { 
      "products.expires": { $gte: currentDate.toDate() } // Ngày hết hạn >= ngày hiện tại
    };
  } else if (expirationStatus === "Hết hạn") {
    expirationCondition = { 
      "products.expires": { $lt: currentDate.toDate() } // Ngày hết hạn < ngày hiện tại
    };
  } else if (expirationStatus === "Gần hết hạn") {
    expirationCondition = { 
      "products.expires": { 
        $gte: currentDate.toDate(), 
        $lte: fiveDaysFromNow.toDate() 
      } 
    }; // Sản phẩm hết hạn trong 5 ngày tới
  }

  try {
    // Tìm tất cả các phiếu nhập kho có isDisplay: true và các điều kiện về ngày hết hạn
    const receipts = await WarehouseReceipt.find({ isDisplay: true, ...expirationCondition })
      .populate({
        path: "products.product",
        populate: [
          { path: "brand", select: "name" },
          { path: "category", select: "name" },
          { path: "unit", select: "name" },
        ],
      })
      .populate({ path: "products.unit", select: "name convertQuantity" })
      .sort({ createdAt: -1 })
      .exec();


    // Lọc sản phẩm theo các điều kiện khác và ngày hết hạn
    const products = receipts.flatMap((receipt) =>
      receipt.products
        .filter((item) => {
          let match = true;

          // Chỉ lấy sản phẩm có isDisplay: true
          if (!item.isDisplay) return false;

          // Lọc theo productId (nếu có)
          if (productId && item.product?.id !== productId) match = false;

          // Lọc theo title (nếu có)
          if (title && !new RegExp(`\\b${title.trim()}\\b`, "i").test(item.product?.title)) match = false;

          // Lọc theo category (nếu có)
          if (category && item.product.category?.name.toLowerCase() !== category.toLowerCase()) match = false;

          // Lọc theo brand (nếu có)
          if (brand && item.product.brand?.name.toLowerCase() !== brand.toLowerCase()) match = false;

          // Lọc theo idPNK (nếu có)
          if (idPNK && receipt.idPNK !== idPNK) match = false;

          // Kiểm tra điều kiện ngày hết hạn cho từng sản phẩm
          if (expirationStatus === "Còn hạn" && item.expires && moment(item.expires).isBefore(currentDate)) {
            match = false;  // Nếu sản phẩm đã hết hạn, không lấy
          }

          if (expirationStatus === "Còn hạn" && item.expires && moment(item.expires).isBetween(currentDate, fiveDaysFromNow, null, '[)')) {
            match = false;  // Nếu sản phẩm gần hết hạn (nằm trong khoảng 5 ngày tới), không lấy
          }

          if (expirationStatus === "Hết hạn" && item.expires && moment(item.expires).isAfter(currentDate)) {
            match = false;  // Nếu sản phẩm chưa hết hạn, không lấy
          }

          if (expirationStatus === "Gần hết hạn" && item.expires) {
            const productExpiryDate = moment(item.expires);
            if (productExpiryDate.isBefore(currentDate) || productExpiryDate.isAfter(fiveDaysFromNow)) {
              match = false;  // Nếu sản phẩm không gần hết hạn (không trong khoảng 5 ngày tới), không lấy
            }
          }

          return match;
        })
        .map((item) => {
          const convertQuantity = item.unit?.convertQuantity || 1;
          const calculatedQuantity = item.quantityDynamic ? item.quantity * convertQuantity : 0;

          const product = item.product || {};
          return {
            expires: item.expires,
            idPNK: receipt.idPNK,
            images: product.images || [],
            title: product.title || "N/A",
            category: product.category?.name || "N/A",
            brand: product.brand?.name || "N/A",
            quantity: calculatedQuantity,
            price: product.price || 0,
            importPrice: item.importPrice || 0,
            warehouseReceipt: receipt._id,
            quantityDynamic: item.quantityDynamic || 0,
            id: product.id,
            discount: product.discount || 0,
            _id: product._id,
            unit: product.unit?.name || "N/A",
          };
        })
    );


    // Trả về sản phẩm nếu tìm thấy
    if (products.length > 0) {
      return res.status(200).json({
        success: true,
        products: products,
      });
    } else {
      return res.status(200).json({
        success: false,
        products: [],
      });
    }
  } catch (error) {
    console.error("Error in searchProducts:", error);  // Debug lỗi
    return res.status(500).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
    });
  }
});

const changeIsDisplayProduct = expressAsyncHandler(async (req, res) => {
  const { receiptId, productId, isDisplay } = req.body;

  // Kiểm tra nếu receiptId không phải ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(receiptId)) {
    return res.status(400).json({
      success: false,
      message: "receiptId không hợp lệ. Phải là ObjectId 24 ký tự hex.",
    });
  }

  try {
    const receipt = await WarehouseReceipt.findById(receiptId);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiếu nhập kho với receiptId này.",
      });
    }

    // Tìm sản phẩm trong phiếu nhập kho
    const product = receipt.products.find(
      (item) => item.product.toString() === productId
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong phiếu nhập kho này.",
      });
    }

    // Nếu chuyển sang không hiển thị (isDisplay = false), trừ số lượng trong tồn kho
    if (!isDisplay && product.quantityDynamic > 0) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: -product.quantityDynamic }, // Trừ số lượng
      });
    }

    // Cập nhật trường isDisplay
    product.isDisplay = isDisplay;

    await receipt.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi khi cập nhật.",
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
  getFilteredWarehouseReceipts,
  sumTotalAmountReceipt,
  searchProductById,
  searchProductByName,
  searchProductExpires,
  getAllWarehouseReceiptWeek,
  changeIsDisplayProduct,
  searchProducts
};
