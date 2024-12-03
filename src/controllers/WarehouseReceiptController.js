const expressAsyncHandler = require("express-async-handler");
const { WarehouseReceipt, Product, Unit, Category, Brand } = require("../models/index");

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

//



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
        select: "name address phone"
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
        select: "name address phone"
      }
    }).populate({
      path: "products.unit",
      select: "name convertQuantity"
    });

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


// const getFilteredWarehouseReceipts = expressAsyncHandler(async (req, res) => {
//   const { title, idPNK, category, brand } = req.body;

//   try {
  
//     const receipts = await WarehouseReceipt.find({ isDisplay: true })
//       .populate({
//         path: "products.product",
//         select: "title expires brand importPrice idPNK id images quantity category",  // Đảm bảo có idPNK và category
//         populate: [
//           {
//             path: "brand",  // Populating brand field
//             select: "name",  // Chỉ lấy tên thương hiệu
//           },
//           {
//             path: "category",  // Populating category field
//             select: "name",  // Chỉ lấy tên danh mục
//           }
//         ],
//       })
//       .populate("user")
//       .populate("products.unit")
//       .sort({ createdAt: -1 })
//       .exec();

//     // Lọc các biên nhận kho dựa trên điều kiện được cung cấp
//     const filteredReceipts = receipts.filter(receipt => {
//       let match = true;

//       // Lọc theo title (trên tên sản phẩm)
//       if (title && title.trim() !== "") {
//         match = match && receipt.products.some(item =>
//           item.product.title.trim().toLowerCase() === title.trim().toLowerCase()  // So khớp chính xác
//         );
//       }

//       // Lọc theo idPNK (trên idPNK của biên nhận, không phải của sản phẩm)
//       if (idPNK && idPNK !== "") {
//         // Kiểm tra sản phẩm trong biên nhận kho có idPNK trùng khớp
//         match = match && receipt.products.some(item => 
//           item.product.idPNK === idPNK
//         );
//       }

//       // Lọc theo category (trên danh mục sản phẩm)
//       if (category && category.trim() !== "") {
//         match = match && receipt.products.some(item => {
//           const categoryName = item.product.category && item.product.category.name ? item.product.category.name.trim().toLowerCase() : "";
//           return categoryName === category.trim().toLowerCase();  // So sánh chính xác category
//         });
//       }

//       // Lọc theo brand (trên tên thương hiệu của sản phẩm)
//       if (brand && brand.trim() !== "") {
//         match = match && receipt.products.some(item =>
//           item.product.brand &&
//           item.product.brand.name.toLowerCase().trim() === brand.toLowerCase().trim()  // So sánh chính xác brand
//         );
//       }

//       return match;
//     });

//     // Nếu không tìm thấy biên nhận nào khớp với điều kiện, trả về danh sách rỗng
//     if (filteredReceipts.length === 0) {
//       return res.status(200).json({
//         success: true,
//         receipts: [],
//         message: "No warehouse receipts found matching the provided conditions.",
//       });
//     }

//     // Xử lý và tính giá trị tổng của các biên nhận kho đã lọc
//     const receiptsWithDetails = await Promise.all(
//       filteredReceipts.map(async (receipt) => {
//         const productsWithDetails = await Promise.all(
//           receipt.products.map(async (item) => {
//             const { product, quantity, importPrice, unit, quantityDynamic } = item;
//             const unitInfo = unit ? await Unit.findById(unit) : null;

//             const convertedQuantity = unitInfo
//               ? unitInfo.convertQuantity * quantity  // Chuyển đổi số lượng theo đơn vị
//               : quantity;

//             const totalValue = importPrice * convertedQuantity;

//             return {
//               quantityDynamic,
//               product,
//               quantity,
//               importPrice,
//               totalValue,
//               unit,
//               expires: item.expires,
//             };
//           })
//         );

//         const totalReceiptValue = productsWithDetails.reduce(
//           (total, product) => total + product.totalValue,
//           0
//         );

//         return {
//           ...receipt._doc,
//           products: productsWithDetails,
//           totalValue: totalReceiptValue,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: receiptsWithDetails.length > 0,
//       receipts: receiptsWithDetails.length > 0 ? receiptsWithDetails : "No warehouse receipts found!",
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// });


const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
  try {
    const receipts = await WarehouseReceipt.find({ isDisplay: true })
      .populate({
        path: "products.product",
        select: "title expires brand  importPrice",
        populate: {
          path: "brand",
          select: "name phone address",
        },
      })
      .populate({
        path: "user",
        select: "employee", 
        populate: {
          path: "employee",
          select: "name"
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

// const getFilteredWarehouseReceipts = expressAsyncHandler(async (req, res) => {
//   const { category, brand, idPNK } = req.body;

//   try {
//     // Log the incoming request body for idPNK
//     console.log("Received idPNK:", idPNK);

//     // Find warehouse receipts that are marked as displayed
//     const receipts = await WarehouseReceipt.find({ isDisplay: true })
//       .populate({
//         path: "products.product",
//         select: "title expires brand importPrice idPNK id images quantity category",  
//         populate: [
//           {
//             path: "brand",  
//             select: "name",  
//           },
//           {
//             path: "category", 
//             select: "name",  
//           }
//         ],
//       })
//       .populate({
//         path: "user",
//         select: "_id name"
//       })
//       .populate("products.unit")
//       .sort({ createdAt: -1 })
//       .exec();

//     // Convert idPNK to a number if it exists in the request
//     const idPNKNumber = idPNK ? Number(idPNK) : null; // Convert to number, or null if not provided

//     // Log the parsed idPNKNumber
//     console.log("Parsed idPNK as number:", idPNKNumber);

//     // Filter receipts based on category, brand, and idPNK
//     const filteredReceipts = receipts.filter(receipt => {
//       let match = true;

//       // Log the current receipt's idPNK for comparison
//       console.log("Checking receipt idPNK:", receipt.idPNK);

//       // Filter by category if provided
//       if (category && category.trim() !== "") {
//         match = match && receipt.products.some(item => {
//           const categoryName = item.product.category && item.product.category.name ? item.product.category.name.trim().toLowerCase() : "";
//           return categoryName === category.trim().toLowerCase(); 
//         });
//       }

//       // Filter by brand if provided
//       if (brand && brand.trim() !== "") {
//         match = match && receipt.products.some(item =>
//           item.product.brand &&
//           item.product.brand.name.toLowerCase().trim() === brand.toLowerCase().trim()  
//         );
//       }

//       // Filter by idPNK if provided and is a valid number
//       if (idPNKNumber && !isNaN(idPNKNumber)) {  // Check if idPNKNumber is a valid number
//         match = match && receipt.idPNK && receipt.idPNK == idPNKNumber; // Compare as number
//         console.log(`Matching idPNK: ${receipt.idPNK} with ${idPNKNumber}`);
//       }

//       return match;
//     });

//     // If no receipts match the filters
//     if (filteredReceipts.length === 0) {
//       return res.status(200).json({
//         success: true,
//         receipts: [],
//         message: "No warehouse receipts found matching the provided conditions.",
//       });
//     }

//     // Map over the filtered receipts to retrieve the product details
//     const receiptsWithDetails = await Promise.all(
//       filteredReceipts.map(async (receipt) => {
//         // For each product, retrieve detailed information
//         const productsWithDetails = await Promise.all(
//           receipt.products.map(async (item) => {
//             const { product, quantity, importPrice, unit, quantityDynamic } = item;
//             const unitInfo = unit ? await Unit.findById(unit) : null;

//             const convertedQuantity = unitInfo
//               ? unitInfo.convertQuantity * quantity
//               : quantity;

//             const totalValue = importPrice * convertedQuantity;
//             return {
//               quantityDynamic,
//               product,
//               quantity,
//               importPrice,
//               totalValue,
//               unit,
//               expires: item.expires,
//             };
//           })
//         );

//         // Calculate the total value of the receipt
//         const totalReceiptValue = productsWithDetails.reduce(
//           (total, product) => total + product.totalValue,
//           0
//         );

//         return {
//           ...receipt._doc,
//           products: productsWithDetails,
//           totalValue: totalReceiptValue,
//         };
//       })
//     );

//     // Return the filtered and populated receipts
//     return res.status(200).json({
//       success: receiptsWithDetails.length > 0,
//       receipts: receiptsWithDetails.length > 0 ? receiptsWithDetails : "No warehouse receipts found!",
//     });

//   } catch (error) {
//     // Handle any errors
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// });

const getFilteredWarehouseReceipts = expressAsyncHandler(async (req, res) => {
  const { category, brand, idPNK } = req.body;

  try {
    // Tìm tất cả các phiếu nhập kho có thuộc tính isDisplay là true
    const receipts = await WarehouseReceipt.find({ isDisplay: true })
      .populate({
        path: "products.product",
        select: "title expires brand importPrice idPNK id images quantity category",  
        populate: [
          {
            path: "brand",  
            select: "name",  
          },
          {
            path: "category", 
            select: "name",  
          }
        ],
      })
      .populate("user")
      .populate("products.unit")
      .sort({ createdAt: -1 })
      .exec();

    // Chuyển idPNK thành số nếu có
    const idPNKNumber = idPNK ? Number(idPNK) : null;

    // Lọc phiếu nhập kho dựa trên các điều kiện category, brand và idPNK
    const filteredReceipts = receipts.filter(receipt => {
      let match = true;

      // Lọc theo danh mục nếu có
      if (category && category.trim() !== "") {
        match = match && receipt.products.some(item => {
          const categoryName = item.product.category && item.product.category.name ? item.product.category.name.trim().toLowerCase() : "";
          return categoryName === category.trim().toLowerCase(); // So sánh không phân biệt chữ hoa chữ thường và bỏ khoảng trắng thừa
        });
      }

      // Lọc theo thương hiệu nếu có
      if (brand && brand.trim() !== "") {
        match = match && receipt.products.some(item =>
          item.product.brand &&
          item.product.brand.name.toLowerCase().trim() === brand.toLowerCase().trim()  
        );
      }

      // Lọc theo idPNK nếu có và idPNK hợp lệ
      if (idPNKNumber && !isNaN(idPNKNumber)) {
        match = match && receipt.idPNK && receipt.idPNK == idPNKNumber; // So sánh với số
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
          receipt.products.map(async (item) => {
            const { product, quantity, importPrice, unit, quantityDynamic } = item;
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
      receipts: receiptsWithDetails.length > 0 ? receiptsWithDetails : "Không có phiếu nhập kho nào!",
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
          // Lọc sản phẩm theo mã sản phẩm (productId) hoặc tên sản phẩm (title)
          if (productId) {
            return item.product?.id == productId; // Kiểm tra theo mã sản phẩm
          } else if (title) {
            return item.product?.title.toLowerCase() == title.toLowerCase(); // Kiểm tra theo tên sản phẩm (case-insensitive)
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
  searchProductByName
};
