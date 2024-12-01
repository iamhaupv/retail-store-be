const {
  Order,
  Product,
  WarehouseReceipt,
  Unit,
  User,
  Employee,
} = require("../models/index");

const expressAsyncHandler = require("express-async-handler");

const getAllOrder = expressAsyncHandler(async (req, res) => {
  const orders = await Order.find({ isDisplay: true })
    .populate({
      path: "user",
      select: "employee",
      populate: {
        path: "employee",
        select: "id images name",
      },
    })
    .populate("products.product")
    .populate("products.unit")
    .sort({ createdAt: -1 })
    .exec();
  return res.status(200).json({
    success: orders ? true : false,
    orders: orders ? orders : "Cannot get orders",
  });
});

// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const {
//       user,
//       products,
//       totalAmount,
//       receiveAmount,
//       warehouseReceipt,
//       amountVAT,
//       id,
//     } = req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount ||
//       !warehouseReceipt
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (item.quantity <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid quantity for product ${item.product}`,
//         });
//       }
//     }

//     // Tính tiền thối lại
//     const change = receiveAmount - totalAmount;
//     if (change < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Insufficient receive amount!" });
//     }

//     let totalVAT = amountVAT || 0; // Sử dụng VAT từ payload nếu có, nếu không dùng giá trị mặc định

//     // Xử lý từng sản phẩm trong đơn hàng
//     for (const item of products) {
//       const { product, quantity, unit, receipt } = item;

//       // Lấy thông tin đơn vị tính (unit) của sản phẩm
//       const unitDoc = await Unit.findById(unit);
//       if (!unitDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Unit ${unit} not found!`,
//         });
//       }

//       // Quy đổi số lượng sản phẩm theo đơn vị tính
//       const convertedQuantity = quantity * unitDoc.convertQuantity;

//       // Lấy thông tin sản phẩm từ DB
//       const productDoc = await Product.findById(product);
//       if (!productDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Product ${product} not found!`,
//         });
//       }

//       // Kiểm tra kho xem có đủ số lượng không
//       if (productDoc.quantity < convertedQuantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Not enough stock for product ${product}`,
//         });
//       }

//       // Lấy thông tin phiếu nhập kho từ DB
//       const warehouseReceiptDoc = await WarehouseReceipt.findById(receipt);
//       if (!warehouseReceiptDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Warehouse receipt ${receipt} not found!`,
//         });
//       }

//       // Trừ số lượng sản phẩm trong kho và phiếu nhập kho theo số lượng đã quy đổi
//       const productInReceipt = warehouseReceiptDoc.products.find(
//         (p) => p.product.toString() === product.toString()
//       );
//       if (productInReceipt) {
//         if (productInReceipt.quantityDynamic >= convertedQuantity) {
//           productInReceipt.quantityDynamic -= convertedQuantity;
//           await warehouseReceiptDoc.save();
//         } else {
//           return res.status(400).json({
//             success: false,
//             message: `Not enough stock in warehouse receipt ${receipt} for product ${product}`,
//           });
//         }
//       }

//       // Cập nhật lại số lượng sản phẩm trong kho chính sau khi đã quy đổi
//       productDoc.quantity -= convertedQuantity;
//       productDoc.sold += convertedQuantity;
//       await productDoc.save();
//     }

//     // Tạo đơn hàng mới
//     const newOrder = await Order.create({
//       user,
//       products: products.map((item) => ({
//         ...item,
//         warehouseReceipt: item.receipt,
//       })),
//       totalAmount,
//       receiveAmount,
//       change,
//       amountVAT: totalVAT, // Sử dụng giá trị VAT từ payload
//       warehouseReceipt,
//       id,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully!",
//       order: newOrder,
//     });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Cannot create order",
//       error: error.message,
//     });
//   }
// });

const filterOrderByEmployee = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input");
  const { name } = req.body;
  const user = await User.findOne({ name });

  const orders = await Order.find({ user: user._id })
    .populate({
      path: "user",
      select: "image name",
      populate: {
        path: "employee",
        select: "id",
      },
    })
    .populate({
      path: "products.product",
      select: "images price id",
    });
  return res.status(200).json({
    success: user ? true : false,
    orders: orders ? orders : "Cannot get user",
  });
});

const filterOrderByDate = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input");
  const { startDate, endDate } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) {
    throw new Error("Định dạng ngày không hợp lệ");
  }
  const orders = await Order.find({
    createdAt: { $gte: start, $lte: end },
  })
    .populate({
      path: "user",
      select: "image name",
      populate: {
        path: "employee",
        select: "id",
      },
    })
    .populate({
      path: "products.product",
      select: "images price id",
    })
    .sort({ createdAt: -1 })
    .exec();
  return res.status(200).json({
    success: orders ? true : false,
    orders: orders ? orders : "Cannot get user",
  });
});

const filterOrders = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Thiếu dữ liệu đầu vào");

  const { name, id, startDate, endDate } = req.body;
  let query = {};

  if (name) {
    const user = await Employee.findOne({ name }); 
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    query.user = user.user; 
  }

  if (id) {
    const order = await Order.findOne({ id }); 
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy hóa đơn" });
    }
    query.id = order.id; 
  }


  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (isNaN(start) || isNaN(end)) {
      throw new Error("Định dạng ngày không hợp lệ");
    }

    query.createdAt = { $gte: start, $lte: end };
  }
  try {
    const orders = await Order.find(query)
      .populate({
        path: "user",
        populate: {
          path: "employee",
          select: "id images name",
        },
      })
      .populate({
        path: "products.product",
        select: "images price title id",
      })
      .populate({
        path: "products.unit",
        select: "name convertQuantity",
      })
      .sort({ createdAt: -1 });

    console.log("Orders found:", orders); // Kiểm tra kết quả tìm kiếm đơn hàng

    return res.status(200).json({
      success: orders.length > 0,
      orders: orders.length > 0 ? orders : "Không tìm thấy đơn hàng",
    });
  } catch (error) {
    console.error("Error during order query:", error); // Log lỗi để dễ dàng debug
    return res
      .status(500)
      .json({ success: false, message: "Lỗi khi truy vấn đơn hàng" });
  }
});

const sumTotalAmount = expressAsyncHandler(async (req, res) => {
  const orders = await Order.find();
  const totalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const amountVAT = orders.reduce((acc, order) => acc + order.amountVAT, 0);
  return res.status(200).json({
    success: true,
    sum: {
      totalAmount: totalAmount,
      amountVAT: amountVAT,
    },
  });
});
const createOrder = expressAsyncHandler(async (req, res) => {
  try {
    const {
      user,
      products,
      totalAmount,
      receiveAmount,
      amountVAT,
      id,
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (
      !user ||
      !products ||
      products.length === 0 ||
      !totalAmount ||
      !receiveAmount ||
      !id || !amountVAT
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    // Kiểm tra số lượng hợp lệ
    for (const item of products) {
      if (Number(item.quantity) <= 0) {  // Đảm bảo quantity là số
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product ${item.product}`,
        });
      }
    }

    // Tính tiền thối lại
    const change = receiveAmount - totalAmount;
    if (change < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient receive amount!" });
    }

    // Danh sách sản phẩm đã được xử lý
    let updatedProducts = [];

    // Xử lý từng sản phẩm trong đơn hàng
    for (const item of products) {
      const { product, quantity, unit, warehouseReceipt: receipt } = item;

      // Chuyển đổi quantity sang kiểu số (đảm bảo không bị kiểu chuỗi)
      const productQuantity = Number(quantity);

      // Lấy thông tin đơn vị tính (unit) của sản phẩm
      const unitDoc = await Unit.findById(unit);
      if (!unitDoc) {
        return res.status(404).json({
          success: false,
          message: `Unit ${unit} not found!`,
        });
      }

      // Quy đổi số lượng sản phẩm theo đơn vị tính
      const convertedQuantity = productQuantity * unitDoc.convertQuantity;

      // Lấy thông tin sản phẩm từ DB
      const productDoc = await Product.findById(product);
      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: `Product ${product} not found!`,
        });
      }

      // Kiểm tra kho xem có đủ số lượng không
      if (productDoc.quantity < convertedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ${product}`,
        });
      }

      // Lấy thông tin phiếu nhập kho từ DB
      const warehouseReceiptDoc = await WarehouseReceipt.findById(receipt);
      if (!warehouseReceiptDoc) {
        return res.status(404).json({
          success: false,
          message: `Warehouse receipt ${receipt} not found!`,
        });
      }

      // Trừ số lượng sản phẩm trong kho và phiếu nhập kho theo số lượng đã quy đổi
      const productInReceipt = warehouseReceiptDoc.products.find(
        (p) => p.product.toString() === product.toString()
      );
      if (productInReceipt) {
        if (productInReceipt.quantityDynamic >= convertedQuantity) {
          productInReceipt.quantityDynamic -= convertedQuantity;
          await warehouseReceiptDoc.save();
        } else {
          return res.status(400).json({
            success: false,
            message: `Not enough stock in warehouse receipt ${receipt} for product ${product}`,
          });
        }
      }

      // Cập nhật lại số lượng sản phẩm trong kho chính sau khi đã quy đổi
      productDoc.quantity -= convertedQuantity;
      productDoc.sold += convertedQuantity;
      await productDoc.save();

      // // Kiểm tra nếu sản phẩm đã tồn tại trong danh sách đơn hàng
      // const existingProduct = updatedProducts.find(
      //   (p) => p.product.toString() === product.toString()
      // );

      // if (existingProduct) {
      //   // Nếu đã tồn tại, cập nhật số lượng
      //   existingProduct.quantity += productQuantity;  // Cộng thêm số lượng
      // } else {
      //   updatedProducts.push({
      //     product,
      //     quantity: productQuantity,  
      //     unit,
      //     warehouseReceipt: receipt,  
      //   });
      // }
      // Kiểm tra nếu sản phẩm và đơn vị tính đã tồn tại trong danh sách đơn hàng
const existingProduct = updatedProducts.find(
  (p) => p.product.toString() === product.toString() && p.unit.toString() === unit.toString()
);

if (existingProduct) {
  // Nếu đã tồn tại và cùng đơn vị tính, cập nhật số lượng
  existingProduct.quantity += productQuantity;  // Cộng thêm số lượng
} else {
  // Nếu chưa tồn tại, thêm sản phẩm vào danh sách đơn hàng
  updatedProducts.push({
    product,
    quantity: productQuantity,  
    unit,
    warehouseReceipt: receipt,  
  });
}

    }

    const newOrder = await Order.create({
      user,
      products: updatedProducts,
      totalAmount,
      receiveAmount,
      change,
      amountVAT: amountVAT,
      id,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully!",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Cannot create order",
      error: error.message,
    });
  }
});

// Hàm tính tổng tiền và tổng VAT theo ngày tháng năm
const getTotalAmountAndVAT = async (date) => {
  try {
    // Cấu trúc ngày bắt đầu và ngày kết thúc của tháng/năm
    const startDate = new Date(date); // Đây là ngày bạn muốn tính toán (ví dụ: '2024-11-27')
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1); // Tăng 1 ngày để lấy phạm vi đến hết ngày đó

    // Truy vấn MongoDB và sử dụng aggregate
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,  // Lọc đơn hàng lớn hơn hoặc bằng ngày bắt đầu
            $lt: endDate,     // Lọc đơn hàng nhỏ hơn ngày kết thúc
          },
        },
      },
      {
        $group: {
          _id: null,  // Không nhóm theo trường nào cụ thể, tính tổng
          totalAmount: { $sum: "$totalAmount" },  // Tổng tiền
          totalVAT: { $sum: "$amountVAT" },  // Tổng VAT
        },
      },
    ]);

    // Kiểm tra kết quả
    if (result.length > 0) {
      return {
        totalAmount: result[0].totalAmount,  // Tổng tiền
        totalVAT: result[0].totalVAT,        // Tổng VAT
      };
    } else {
      return {
        totalAmount: 0,
        totalVAT: 0,
      };
    }
  } catch (error) {
    console.error('Error calculating total amount and VAT:', error);
    throw new Error('Error calculating totals');
  }
};

// Example usage
const date = '2024-11-30'; // Ngày bạn muốn tính tổng
getTotalAmountAndVAT(date)
  .then((result) => {
    console.log('Tổng tiền:', result.totalAmount);
    console.log('Tổng VAT:', result.totalVAT);
  })
  .catch((error) => {
    console.error(error);
  });




module.exports = {
  createOrder,
  getAllOrder,
  filterOrderByEmployee,
  filterOrderByDate,
  filterOrders,
  sumTotalAmount,
};
