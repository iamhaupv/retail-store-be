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
// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount, amountVAT, id } =
//       req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount ||
//       !id ||
//       !amountVAT
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (Number(item.quantity) <= 0) {
//         // Đảm bảo quantity là số
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

//     // Danh sách sản phẩm đã được xử lý
//     let updatedProducts = [];

//     // Xử lý từng sản phẩm trong đơn hàng
//     for (const item of products) {
//       const { product, quantity, unit, warehouseReceipt: receipt } = item;

//       // Chuyển đổi quantity sang kiểu số (đảm bảo không bị kiểu chuỗi)
//       const productQuantity = Number(quantity);

//       // Lấy thông tin đơn vị tính (unit) của sản phẩm
//       const unitDoc = await Unit.findById(unit);
//       if (!unitDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Unit ${unit} not found!`,
//         });
//       }

//       // Quy đổi số lượng sản phẩm theo đơn vị tính
//       const convertedQuantity = productQuantity * unitDoc.convertQuantity;

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

//       // Kiểm tra nếu sản phẩm và đơn vị tính đã tồn tại trong danh sách đơn hàng
//       const existingProduct = updatedProducts.find(
//         (p) =>
//           p.product.toString() === product.toString() &&
//           p.unit.toString() === unit.toString()
//       );

//       if (existingProduct) {
//         // Nếu đã tồn tại và cùng đơn vị tính, cập nhật số lượng
//         existingProduct.quantity += productQuantity; // Cộng thêm số lượng
//       } else {
//         // Nếu chưa tồn tại, thêm sản phẩm vào danh sách đơn hàng
//         updatedProducts.push({
//           product,
//           quantity: productQuantity,
//           unit,
//           warehouseReceipt: receipt,
//         });
//       }
//     }

//     const newOrder = await Order.create({
//       user,
//       products: updatedProducts,
//       totalAmount,
//       receiveAmount,
//       change,
//       amountVAT: amountVAT,
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

// const getTotalAmountAndVATByYear = async (req, res) => {
//   try {
//     const { year } = req.body;

//     if (!year || isNaN(year)) {
//       return res.status(400).json({ error: "Invalid or missing year" });
//     }

//     // Perform the aggregation to get total amounts and VAT by month
//     const result = await Order.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(`${year}-01-01`), // Start of the year
//             $lt: new Date(`${parseInt(year) + 1}-01-01`), // Start of the next year
//           },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: "$createdAt" }, // Group by month (1-12)
//           totalAmount: { $sum: "$totalAmount" },
//           totalVAT: { $sum: "$amountVAT" },
//         },
//       },
//       {
//         $sort: { _id: 1 }, // Sort by month in ascending order
//       },
//     ]);

//     // Create an array of all months (1-12) with Vietnamese month names
//     const monthNames = [
//       "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
//       "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
//     ];

//     // Format the result with 0 values for missing months, and include the year
//     const formattedResult = monthNames.map((monthName, index) => {
//       const month = index + 1;  // The index starts from 0, but months are 1-based
//       // Find the aggregation result for the current month
//       const monthData = result.find((item) => item._id === month);

//       // If no data for the month, set totalAmount and totalVAT to 0
//       return {
//         month: monthName,
//         totalAmount: monthData ? monthData.totalAmount : 0,
//         totalVAT: monthData ? monthData.totalVAT : 0,
//       };
//     });

//     // Send the result inside a 'total' field
//     return res.status(200).json({ total: formattedResult });
//   } catch (error) {
//     console.error("Error while calculating monthly totals:", error);
//     return res.status(500).json({ error: "An error occurred while processing the request" });
//   }
// };

const extraInfor = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input");
  const { id } = req.body;
  const order = await Order.findOne({ _id: id })
    .populate({
      path: "user",
      select: "employee",
      populate: {
        path: "employee",
        select: "name id",
      },
    })
    .populate({
      path: "products.product",
      select: "title price",
    })
    .populate({
      path: "products.unit",
      select: "name convertQuantity",
    });
  return res.status(200).json({
    success: order ? true : false,
    order: order ? order : "Cannot get order",
  });
});
// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount, amountVAT, id } =
//       req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount ||
//       !id ||
//       !amountVAT
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (Number(item.quantity) <= 0) {
//         // Đảm bảo quantity là số
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

//     // Danh sách sản phẩm đã được xử lý
//     let updatedProducts = [];
//     let sumImportPrice = 0; // Khởi tạo biến để tính tổng tiền nhập kho

//     // Xử lý từng sản phẩm trong đơn hàng
//     for (const item of products) {
//       const { product, quantity, unit, warehouseReceipt: receipt } = item;

//       // Chuyển đổi quantity sang kiểu số (đảm bảo không bị kiểu chuỗi)
//       const productQuantity = Number(quantity);

//       // Lấy thông tin đơn vị tính (unit) của sản phẩm
//       const unitDoc = await Unit.findById(unit);
//       if (!unitDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Unit ${unit} not found!`,
//         });
//       }

//       // Quy đổi số lượng sản phẩm theo đơn vị tính
//       const convertedQuantity = productQuantity * unitDoc.convertQuantity;

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

//           // Tính tổng giá trị nhập kho
//           sumImportPrice += productInReceipt.importPrice * convertedQuantity;
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

//       // Kiểm tra nếu sản phẩm và đơn vị tính đã tồn tại trong danh sách đơn hàng
//       const existingProduct = updatedProducts.find(
//         (p) =>
//           p.product.toString() === product.toString() &&
//           p.unit.toString() === unit.toString()
//       );

//       if (existingProduct) {
//         // Nếu đã tồn tại và cùng đơn vị tính, cập nhật số lượng
//         existingProduct.quantity += productQuantity; // Cộng thêm số lượng
//       } else {
//         // Nếu chưa tồn tại, thêm sản phẩm vào danh sách đơn hàng
//         updatedProducts.push({
//           product,
//           quantity: productQuantity,
//           unit,
//           warehouseReceipt: receipt,
//         });
//       }
//     }

//     // Tạo mới đơn hàng với sumImportPrice
//     const newOrder = await Order.create({
//       user,
//       products: updatedProducts,
//       totalAmount,
//       receiveAmount,
//       change,
//       amountVAT: amountVAT,
//       id,
//       sumImportPrice, // Thêm sumImportPrice vào đơn hàng
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

const getTotalAmountAndVATByYear = async (req, res) => {
  try {
    const { year } = req.body;

    if (!year || isNaN(year)) {
      return res.status(400).json({ error: "Invalid or missing year" });
    }

    // Perform the aggregation to get total amounts, VAT, import price, and order count by month
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`), // Start of the year
            $lt: new Date(`${parseInt(year) + 1}-01-01`), // Start of the next year
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by month (1-12)
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" }, // Sum up sumImportPrice
          totalOrders: { $sum: 1 }, // Count the number of orders per month
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month in ascending order
      },
    ]);

    // Create an array of all months (1-12) with Vietnamese month names
    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    // Format the result with 0 values for missing months, and include the year
    const formattedResult = monthNames.map((monthName, index) => {
      const month = index + 1; // The index starts from 0, but months are 1-based
      // Find the aggregation result for the current month
      const monthData = result.find((item) => item._id === month);

      // Calculate the revenue
      const totalAmount = monthData ? monthData.totalAmount : 0;
      const totalImportPrice = monthData ? monthData.totalImportPrice : 0;
      const revenue = totalAmount - totalImportPrice;
      const totalOrders = monthData ? monthData.totalOrders : 0; // Get the total orders count

      // Return the formatted result for each month
      return {
        name: monthName,
        totalAmount,
        totalVAT: monthData ? monthData.totalVAT : 0,
        totalImportPrice,
        revenue, // Calculate revenue here
        totalOrders, // Add the total orders
      };
    });

    // Send the result inside a 'total' field
    return res.status(200).json({ total: formattedResult });
  } catch (error) {
    console.error("Error while calculating monthly totals:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};
// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount, amountVAT, id } =
//       req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount ||
//       !id ||
//       !amountVAT
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (Number(item.quantity) <= 0) {
//         // Đảm bảo quantity là số
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

//     // Danh sách sản phẩm đã được xử lý
//     let updatedProducts = [];
//     let sumImportPrice = 0; // Khởi tạo biến để tính tổng tiền nhập kho

//     // Xử lý từng sản phẩm trong đơn hàng
//     for (const item of products) {
//       const { product, quantity, unit, warehouseReceipt: receipt } = item;

//       // Chuyển đổi quantity sang kiểu số (đảm bảo không bị kiểu chuỗi)
//       const productQuantity = Number(quantity);

//       // Lấy thông tin đơn vị tính (unit) của sản phẩm
//       const unitDoc = await Unit.findById(unit);
//       if (!unitDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Unit ${unit} not found!`,
//         });
//       }

//       // Quy đổi số lượng sản phẩm theo đơn vị tính
//       const convertedQuantity = productQuantity * unitDoc.convertQuantity;

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
//           // Trừ số lượng trong phiếu nhập kho (quantityDynamic)
//           productInReceipt.quantityDynamic -= convertedQuantity;
//           await warehouseReceiptDoc.save();

//           // Tính tổng giá trị nhập kho
//           sumImportPrice += productInReceipt.importPrice * convertedQuantity;

//           // Kiểm tra nếu sản phẩm đã có trong updatedProducts
//           const existingProduct = updatedProducts.find(
//             (p) =>
//               p.product.toString() === product.toString() &&
//               p.unit.toString() === unit.toString()
//           );

//           if (existingProduct) {
//             // Nếu sản phẩm đã tồn tại, cộng dồn số lượng
//             existingProduct.quantity += productQuantity; // Cộng số lượng
//             existingProduct.warehouseDetails.push({
//               warehouseReceipt: receipt,
//               quantity: convertedQuantity,
//             });
//           } else {
//             // Nếu sản phẩm chưa tồn tại, thêm mới sản phẩm vào danh sách
//             updatedProducts.push({
//               product,
//               quantity: productQuantity,
//               unit,
//               warehouseDetails: [
//                 {
//                   warehouseReceipt: receipt,
//                   quantity: convertedQuantity,
//                 },
//               ],
//             });
//           }
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

//     // Tạo mới đơn hàng với sumImportPrice
//     const newOrder = await Order.create({
//       user,
//       products: updatedProducts,
//       totalAmount,
//       receiveAmount,
//       change,
//       amountVAT: amountVAT,
//       id,
//       sumImportPrice, // Thêm sumImportPrice vào đơn hàng
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

const getTotalAmountAndVATByMonth = async (req, res) => {
  try {
    const { year, month } = req.body;

    // Kiểm tra nếu year hoặc month không hợp lệ
    if (!year || !month || isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: "Invalid or missing year/month" });
    }

    // Tạo các mốc thời gian cho tháng được truyền vào
    const startOfMonth = new Date(`${year}-${month}-01`); // Ngày đầu tháng
    const endOfMonth = new Date(`${year}-${month}-01`); // Ngày cuối tháng
    endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Chuyển sang tháng sau và đặt ngày thành 1, sau đó trừ đi 1 ngày

    // Lấy ngày cuối cùng trong tháng (chỉnh lại thời gian cho đúng)
    endOfMonth.setDate(0); // Đặt ngày cuối cùng của tháng hiện tại

    // Thực hiện truy vấn MongoDB để lấy tổng số tiền, VAT, giá trị nhập kho và số lượng đơn hàng theo ngày
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth, // Bắt đầu từ ngày đầu tiên trong tháng
            $lt: endOfMonth, // Kết thúc vào cuối tháng
          },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" }, // Nhóm theo ngày trong tháng (1-31)
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" }, // Tổng giá trị nhập kho
          totalOrders: { $sum: 1 }, // Đếm số lượng đơn hàng trong ngày
        },
      },
      {
        $sort: { _id: 1 }, // Sắp xếp theo ngày trong tháng
      },
    ]);

    // Tạo mảng tên ngày (1 đến 31)
    const dayNames = Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, index) => index + 1
    );

    // Định dạng kết quả trả về, điền số liệu cho các ngày thiếu
    const formattedResult = dayNames.map((day) => {
      // Tìm kết quả từ aggregation cho ngày hiện tại
      const dayData = result.find((item) => item._id === day);

      // Nếu không có dữ liệu cho ngày, trả về giá trị 0
      const totalAmount = dayData ? dayData.totalAmount : 0;
      const totalImportPrice = dayData ? dayData.totalImportPrice : 0;
      const totalOrders = dayData ? dayData.totalOrders : 0; // Lấy số lượng đơn hàng trong ngày

      return {
        name: day, // Số ngày trong tháng
        totalAmount,
        totalVAT: dayData ? dayData.totalVAT : 0,
        totalImportPrice,
        revenue: totalAmount - totalImportPrice, // Tính toán doanh thu (revenue)
        totalOrders, // Thêm thuộc tính totalOrders
      };
    });

    // Trả kết quả với dữ liệu theo ngày của tháng đã cho
    return res.status(200).json({ total: formattedResult });
  } catch (error) {
    console.error("Error while calculating daily totals:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};
const top5ProductMonth = expressAsyncHandler(async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month || isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: "Invalid or missing year/month" });
    }

    const startOfMonth = new Date(year, month - 1, 1); // Tháng bắt đầu
    const endOfMonth = new Date(year, month, 0); // Ngày cuối cùng của tháng

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product", // Group by product ID
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          name: "$productDetails.title",
          value: "$totalQuantity",
        },
      },
    ]);

    const top5 = result.slice(0, 5);
    const others = result.slice(5);

    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

    if (othersTotal > 0) {
      top5.push({
        name: "Others",
        value: othersTotal,
      });
    }

    while (top5.length < 6) {
      top5.push({
        name: null,
        value: null,
      });
    }

    return res.status(200).json({ total: top5 });
  } catch (error) {
    console.error("Error while fetching top 5 products:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

const top5ProductYear = expressAsyncHandler(async (req, res) => {
  try {
    const { year } = req.body;

    if (!year || isNaN(year)) {
      return res.status(400).json({ error: "Invalid or missing year" });
    }

    const startOfYear = new Date(year, 0, 1); // Ngày đầu tiên của năm
    const endOfYear = new Date(year, 11, 31, 23, 59, 59); // Ngày cuối cùng của năm

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          name: "$productDetails.title",
          value: "$totalQuantity",
        },
      },
    ]);

    const top5 = result.slice(0, 5);
    const others = result.slice(5);

    // Tính tổng số lượng cho mục "Others"
    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

    // Thêm mục "Others" nếu có sản phẩm ngoài top 5
    if (othersTotal > 0) {
      top5.push({
        name: "Others",
        value: othersTotal,
      });
    }

    // Bổ sung null nếu ít hơn 5 sản phẩm
    while (top5.length < 6) {
      top5.push({
        name: null,
        value: null,
      });
    }

    return res.status(200).json({ total: top5 });
  } catch (error) {
    console.error("Error while fetching top 5 products:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

const getTotalAmountAndVATByMonthReport = async (req, res) => {
  try {
    const { year, month } = req.body;

    // Kiểm tra nếu year hoặc month không hợp lệ
    if (!year || !month || isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: "Invalid or missing year/month" });
    }

    // Tạo các mốc thời gian cho tháng được truyền vào
    const startOfMonth = new Date(`${year}-${month}-01`); // Ngày đầu tháng
    const endOfMonth = new Date(`${year}-${month}-01`); // Ngày cuối tháng
    endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Chuyển sang tháng sau và đặt ngày thành 1, sau đó trừ đi 1 ngày

    // Lấy ngày cuối cùng trong tháng (chỉnh lại thời gian cho đúng)
    endOfMonth.setDate(0); // Đặt ngày cuối cùng của tháng hiện tại

    // Thực hiện truy vấn MongoDB để lấy tổng số tiền, VAT, giá trị nhập kho và số lượng đơn hàng trong tháng
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth, // Bắt đầu từ ngày đầu tiên trong tháng
            $lt: endOfMonth, // Kết thúc vào cuối tháng
          },
        },
      },
      {
        $group: {
          _id: null, // Không nhóm theo ngày, chỉ tính tổng cho tháng
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" },
          totalOrders: { $sum: 1 }, // Đếm số lượng đơn hàng trong tháng
        },
      },
    ]);

    // Nếu không có kết quả cho tháng, trả về giá trị 0
    if (result.length === 0) {
      return res.status(200).json({
        month: `${month}/${year}`,
        total: {
          name: `${month}/${year}`,
          totalAmount: 0,
          totalVAT: 0,
          totalImportPrice: 0,
          revenue: 0,
          totalOrders: 0,
        },
      });
    }

    // Lấy dữ liệu từ aggregation
    const { totalAmount, totalVAT, totalImportPrice, totalOrders } = result[0];
    const revenue = totalAmount - totalImportPrice; // Tính toán doanh thu

    // Trả kết quả chỉ cho tháng yêu cầu
    return res.status(200).json({
      month: `${month}/${year}`,
      total: {
        name: `${month}/${year}`, // Tháng và năm
        totalAmount,
        totalVAT,
        totalImportPrice,
        revenue,
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error while calculating monthly totals:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};
const getTotalAmountAndVATByYearReport = async (req, res) => {
  try {
    const { year } = req.body;

    // Kiểm tra nếu year không hợp lệ
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: "Invalid or missing year" });
    }

    // Tạo các mốc thời gian cho năm được truyền vào
    const startOfYear = new Date(`${year}-01-01`); // Ngày đầu năm
    const endOfYear = new Date(`${year}-12-31`); // Ngày cuối năm

    // Thực hiện truy vấn MongoDB để lấy tổng số tiền, VAT, giá trị nhập kho và số lượng đơn hàng trong năm
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear, // Bắt đầu từ ngày đầu tiên trong năm
            $lt: endOfYear, // Kết thúc vào cuối năm
          },
        },
      },
      {
        $group: {
          _id: null, // Không nhóm theo tháng, chỉ tính tổng cho năm
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" },
          totalOrders: { $sum: 1 }, // Đếm số lượng đơn hàng trong năm
        },
      },
    ]);

    // Nếu không có kết quả cho năm, trả về giá trị 0
    if (result.length === 0) {
      return res.status(200).json({
        year: year,
        total: {
          name: year,
          totalAmount: 0,
          totalVAT: 0,
          totalImportPrice: 0,
          revenue: 0,
          totalOrders: 0,
        },
      });
    }

    // Lấy dữ liệu từ aggregation
    const { totalAmount, totalVAT, totalImportPrice, totalOrders } = result[0];
    const revenue = totalAmount - totalImportPrice; // Tính toán doanh thu

    // Trả kết quả chỉ cho năm yêu cầu
    return res.status(200).json({
      year: year,
      total: {
        name: year, // Năm
        totalAmount,
        totalVAT,
        totalImportPrice,
        revenue,
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error while calculating yearly totals:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};
const top5ProductCategoryYear = expressAsyncHandler(async (req, res) => {
  try {
    const { year } = req.body;

    // Validate the year input
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: "Invalid or missing year" });
    }

    // Define the date range for the given year
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);

    // Aggregation pipeline
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          name: "$categoryDetails.name",
          value: "$totalQuantity",
        },
      },
    ]);

    // Separate top 5 categories and calculate "Others"
    const top5 = result.slice(0, 5);
    const others = result.slice(5);

    // Calculate total for "Others"
    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

    // Add "Others" category to the result
    const finalResult = [...top5];

    if (othersTotal > 0) {
      finalResult.push({
        name: "Others",
        value: othersTotal,
      });
    }

    // Fill with nulls if fewer than 6 categories
    while (finalResult.length < 6) {
      finalResult.push({
        name: null,
        value: null,
      });
    }

    return res.status(200).json({ total: finalResult });
  } catch (error) {
    console.error("Error while fetching top 5 categories:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

const top5ProductCategoryMonth = expressAsyncHandler(async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month || isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: "Invalid or missing year/month" });
    }

    const startOfMonth = new Date(year, month - 1, 1); // Tháng bắt đầu
    const endOfMonth = new Date(year, month, 0); // Ngày cuối cùng của tháng

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          name: "$categoryDetails.name",
          value: "$totalQuantity",
        },
      },
    ]);

    const top5 = result.slice(0, 5);
    const others = result.slice(5);
    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

    const finalResult = [...top5];
    if (othersTotal > 0) {
      finalResult.push({
        name: "Others",
        value: othersTotal,
      });
    }

    while (finalResult.length < 6) {
      finalResult.push({
        name: null,
        value: null,
      });
    }

    return res.status(200).json({ total: finalResult });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

const top5ProductLast7Days = expressAsyncHandler(async (req, res) => {
  try {
    // Tính toán ngày hiện tại và ngày cách đây 7 ngày
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7); // Trừ đi 7 ngày

    // Aggregation để tìm các sản phẩm bán chạy nhất trong 7 ngày qua
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo, // Các đơn hàng từ 7 ngày trước
            $lt: currentDate, // Đến ngày hiện tại
          },
        },
      },
      {
        $unwind: "$products", // Unwind mảng sản phẩm
      },
      {
        $lookup: {
          from: "products", // Tìm trong bảng sản phẩm
          localField: "products.product", // Trường ID sản phẩm trong order
          foreignField: "_id", // Trường _id của sản phẩm trong bảng products
          as: "productDetails", // Alias cho chi tiết sản phẩm
        },
      },
      {
        $unwind: "$productDetails", // Unwind kết quả từ $lookup
      },
      {
        $group: {
          _id: "$productDetails._id", // Nhóm theo ID sản phẩm
          totalQuantity: { $sum: "$products.quantity" }, // Tính tổng số lượng bán được
          totalAmount: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.price"],
            },
          }, // Tính tổng doanh thu của sản phẩm
          title: { $first: "$productDetails.title" }, // Lấy tên sản phẩm
          id: { $first: "$productDetails.id" }, // Lấy ID tùy chỉnh (id) của sản phẩm
          image: { $first: { $arrayElemAt: ["$productDetails.images", 0] } }, // Lấy hình ảnh đầu tiên
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sắp xếp theo tổng số lượng bán được giảm dần
      },
      {
        $limit: 5, // Chỉ lấy 5 sản phẩm bán chạy nhất
      },
      {
        $project: {
          id: 1, // ID sản phẩm tùy chỉnh
          title: 1, // Tên sản phẩm
          totalQuantity: 1, // Số lượng bán được
          totalAmount: 1, // Tổng số tiền
          image: 1, // Hình ảnh đầu tiên trong mảng images
        },
      },
    ]);

    // Nếu ít hơn 5 sản phẩm, thêm vào những sản phẩm null
    const missingCount = 5 - result.length;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        result.push({
          id: null, // ID sản phẩm là null nếu thiếu
          title: null, // Tên sản phẩm là null nếu thiếu
          totalQuantity: null, // Số lượng bán được là null nếu thiếu
          totalAmount: null, // Tổng số tiền là null nếu thiếu
          image: null, // Hình ảnh là null nếu thiếu
        });
      }
    }

    // Trả về danh sách top 5 sản phẩm
    return res.status(200).json({ total: result });
  } catch (error) {
    console.error(
      "Error while fetching top 5 products in the last 7 days:",
      error
    );
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});
const top5ProductLast30Days = expressAsyncHandler(async (req, res) => {
  try {
    // Tính toán ngày hiện tại và ngày cách đây 7 ngày
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 30); // Trừ đi 7 ngày

    // Aggregation để tìm các sản phẩm bán chạy nhất trong 7 ngày qua
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo, // Các đơn hàng từ 7 ngày trước
            $lt: currentDate, // Đến ngày hiện tại
          },
        },
      },
      {
        $unwind: "$products", // Unwind mảng sản phẩm
      },
      {
        $lookup: {
          from: "products", // Tìm trong bảng sản phẩm
          localField: "products.product", // Trường ID sản phẩm trong order
          foreignField: "_id", // Trường _id của sản phẩm trong bảng products
          as: "productDetails", // Alias cho chi tiết sản phẩm
        },
      },
      {
        $unwind: "$productDetails", // Unwind kết quả từ $lookup
      },
      {
        $group: {
          _id: "$productDetails._id", // Nhóm theo ID sản phẩm
          totalQuantity: { $sum: "$products.quantity" }, // Tính tổng số lượng bán được
          totalAmount: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.price"],
            },
          }, // Tính tổng doanh thu của sản phẩm
          title: { $first: "$productDetails.title" }, // Lấy tên sản phẩm
          id: { $first: "$productDetails.id" }, // Lấy ID tùy chỉnh (id) của sản phẩm
          image: { $first: { $arrayElemAt: ["$productDetails.images", 0] } }, // Lấy hình ảnh đầu tiên
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sắp xếp theo tổng số lượng bán được giảm dần
      },
      {
        $limit: 5, // Chỉ lấy 5 sản phẩm bán chạy nhất
      },
      {
        $project: {
          id: 1, // ID sản phẩm tùy chỉnh
          title: 1, // Tên sản phẩm
          totalQuantity: 1, // Số lượng bán được
          totalAmount: 1, // Tổng số tiền
          image: 1, // Hình ảnh đầu tiên trong mảng images
        },
      },
    ]);

    // Nếu ít hơn 5 sản phẩm, thêm vào những sản phẩm null
    const missingCount = 5 - result.length;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        result.push({
          id: null, // ID sản phẩm là null nếu thiếu
          title: null, // Tên sản phẩm là null nếu thiếu
          totalQuantity: null, // Số lượng bán được là null nếu thiếu
          totalAmount: null, // Tổng số tiền là null nếu thiếu
          image: null, // Hình ảnh là null nếu thiếu
        });
      }
    }

    // Trả về danh sách top 5 sản phẩm
    return res.status(200).json({ total: result });
  } catch (error) {
    console.error(
      "Error while fetching top 5 products in the last 7 days:",
      error
    );
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});
const top5ProductLast365Days = expressAsyncHandler(async (req, res) => {
  try {
    // Tính toán ngày hiện tại và ngày cách đây 7 ngày
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 365); // Trừ đi 7 ngày

    // Aggregation để tìm các sản phẩm bán chạy nhất trong 7 ngày qua
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo, // Các đơn hàng từ 7 ngày trước
            $lt: currentDate, // Đến ngày hiện tại
          },
        },
      },
      {
        $unwind: "$products", // Unwind mảng sản phẩm
      },
      {
        $lookup: {
          from: "products", // Tìm trong bảng sản phẩm
          localField: "products.product", // Trường ID sản phẩm trong order
          foreignField: "_id", // Trường _id của sản phẩm trong bảng products
          as: "productDetails", // Alias cho chi tiết sản phẩm
        },
      },
      {
        $unwind: "$productDetails", // Unwind kết quả từ $lookup
      },
      {
        $group: {
          _id: "$productDetails._id", // Nhóm theo ID sản phẩm
          totalQuantity: { $sum: "$products.quantity" }, // Tính tổng số lượng bán được
          totalAmount: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.price"],
            },
          }, // Tính tổng doanh thu của sản phẩm
          title: { $first: "$productDetails.title" }, // Lấy tên sản phẩm
          id: { $first: "$productDetails.id" }, // Lấy ID tùy chỉnh (id) của sản phẩm
          image: { $first: { $arrayElemAt: ["$productDetails.images", 0] } }, // Lấy hình ảnh đầu tiên
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sắp xếp theo tổng số lượng bán được giảm dần
      },
      {
        $limit: 5, // Chỉ lấy 5 sản phẩm bán chạy nhất
      },
      {
        $project: {
          id: 1, // ID sản phẩm tùy chỉnh
          title: 1, // Tên sản phẩm
          totalQuantity: 1, // Số lượng bán được
          totalAmount: 1, // Tổng số tiền
          image: 1, // Hình ảnh đầu tiên trong mảng images
        },
      },
    ]);

    // Nếu ít hơn 5 sản phẩm, thêm vào những sản phẩm null
    const missingCount = 5 - result.length;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        result.push({
          id: null, // ID sản phẩm là null nếu thiếu
          title: null, // Tên sản phẩm là null nếu thiếu
          totalQuantity: null, // Số lượng bán được là null nếu thiếu
          totalAmount: null, // Tổng số tiền là null nếu thiếu
          image: null, // Hình ảnh là null nếu thiếu
        });
      }
    }

    // Trả về danh sách top 5 sản phẩm
    return res.status(200).json({ total: result });
  } catch (error) {
    console.error(
      "Error while fetching top 5 products in the last 7 days:",
      error
    );
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});
const top5ProductCategoryLast7Days = expressAsyncHandler(async (req, res) => {
  try {
    // Tính toán ngày hiện tại và ngày cách đây 7 ngày
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7); // Trừ đi 7 ngày

    // Aggregation để tìm các loại sản phẩm bán chạy nhất trong 7 ngày qua
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo, // Các đơn hàng từ 7 ngày trước
            $lt: currentDate, // Đến ngày hiện tại
          },
        },
      },
      {
        $unwind: "$products", // Unwind mảng sản phẩm
      },
      {
        $lookup: {
          from: "products", // Tìm trong bảng sản phẩm
          localField: "products.product", // Trường ID sản phẩm trong order
          foreignField: "_id", // Trường _id của sản phẩm trong bảng products
          as: "productDetails", // Alias cho chi tiết sản phẩm
        },
      },
      {
        $unwind: "$productDetails", // Unwind kết quả từ $lookup
      },
      {
        $lookup: {
          from: "categories", // Tìm trong bảng danh mục (categories)
          localField: "productDetails.category", // Trường ID danh mục trong sản phẩm
          foreignField: "_id", // Trường _id của danh mục trong bảng categories
          as: "categoryDetails", // Alias cho chi tiết danh mục
        },
      },
      {
        $unwind: "$categoryDetails", // Unwind kết quả từ $lookup
      },
      {
        $group: {
          _id: "$categoryDetails._id", // Nhóm theo ID danh mục
          totalQuantity: { $sum: "$products.quantity" }, // Tổng số lượng bán được
          totalAmount: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.price"],
            },
          }, // Tính tổng doanh thu
          categoryName: { $first: "$categoryDetails.name" }, // Lấy tên danh mục
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sắp xếp theo tổng số lượng bán được giảm dần
      },
      {
        $limit: 5, // Chỉ lấy 5 loại sản phẩm bán chạy nhất
      },
      {
        $project: {
          categoryName: 1, // Tên danh mục sản phẩm
          totalQuantity: 1, // Tổng số lượng bán được của loại sản phẩm
          totalAmount: 1, // Tổng số tiền của loại sản phẩm
        },
      },
    ]);

    // Nếu ít hơn 5 loại sản phẩm, thêm vào những sản phẩm null
    const missingCount = 5 - result.length;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        result.push({
          categoryName: null, // Tên danh mục là null nếu thiếu
          totalQuantity: null, // Số lượng bán được là null nếu thiếu
          totalAmount: null, // Tổng số tiền là null nếu thiếu
        });
      }
    }

    // Trả về danh sách top 5 loại sản phẩm
    return res.status(200).json({ total: result });
  } catch (error) {
    console.error(
      "Error while fetching top 5 product categories in the last 7 days:",
      error
    );
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});
const top5ProductCategoryLast30Days = expressAsyncHandler(async (req, res) => {
  try {
    // Tính toán ngày hiện tại và ngày cách đây 7 ngày
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 30); // Trừ đi 7 ngày

    // Aggregation để tìm các loại sản phẩm bán chạy nhất trong 7 ngày qua
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo, // Các đơn hàng từ 7 ngày trước
            $lt: currentDate, // Đến ngày hiện tại
          },
        },
      },
      {
        $unwind: "$products", // Unwind mảng sản phẩm
      },
      {
        $lookup: {
          from: "products", // Tìm trong bảng sản phẩm
          localField: "products.product", // Trường ID sản phẩm trong order
          foreignField: "_id", // Trường _id của sản phẩm trong bảng products
          as: "productDetails", // Alias cho chi tiết sản phẩm
        },
      },
      {
        $unwind: "$productDetails", // Unwind kết quả từ $lookup
      },
      {
        $lookup: {
          from: "categories", // Tìm trong bảng danh mục (categories)
          localField: "productDetails.category", // Trường ID danh mục trong sản phẩm
          foreignField: "_id", // Trường _id của danh mục trong bảng categories
          as: "categoryDetails", // Alias cho chi tiết danh mục
        },
      },
      {
        $unwind: "$categoryDetails", // Unwind kết quả từ $lookup
      },
      {
        $group: {
          _id: "$categoryDetails._id", // Nhóm theo ID danh mục
          totalQuantity: { $sum: "$products.quantity" }, // Tổng số lượng bán được
          totalAmount: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.price"],
            },
          }, // Tính tổng doanh thu
          categoryName: { $first: "$categoryDetails.name" }, // Lấy tên danh mục
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sắp xếp theo tổng số lượng bán được giảm dần
      },
      {
        $limit: 5, // Chỉ lấy 5 loại sản phẩm bán chạy nhất
      },
      {
        $project: {
          categoryName: 1, // Tên danh mục sản phẩm
          totalQuantity: 1, // Tổng số lượng bán được của loại sản phẩm
          totalAmount: 1, // Tổng số tiền của loại sản phẩm
        },
      },
    ]);

    // Nếu ít hơn 5 loại sản phẩm, thêm vào những sản phẩm null
    const missingCount = 5 - result.length;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        result.push({
          categoryName: null, // Tên danh mục là null nếu thiếu
          totalQuantity: null, // Số lượng bán được là null nếu thiếu
          totalAmount: null, // Tổng số tiền là null nếu thiếu
        });
      }
    }

    // Trả về danh sách top 5 loại sản phẩm
    return res.status(200).json({ total: result });
  } catch (error) {
    console.error(
      "Error while fetching top 5 product categories in the last 7 days:",
      error
    );
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});
const top5ProductCategoryLast365Days = expressAsyncHandler(async (req, res) => {
  try {
    // Tính toán ngày hiện tại và ngày cách đây 7 ngày
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 365); // Trừ đi 7 ngày

    // Aggregation để tìm các loại sản phẩm bán chạy nhất trong 7 ngày qua
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo, // Các đơn hàng từ 7 ngày trước
            $lt: currentDate, // Đến ngày hiện tại
          },
        },
      },
      {
        $unwind: "$products", // Unwind mảng sản phẩm
      },
      {
        $lookup: {
          from: "products", // Tìm trong bảng sản phẩm
          localField: "products.product", // Trường ID sản phẩm trong order
          foreignField: "_id", // Trường _id của sản phẩm trong bảng products
          as: "productDetails", // Alias cho chi tiết sản phẩm
        },
      },
      {
        $unwind: "$productDetails", // Unwind kết quả từ $lookup
      },
      {
        $lookup: {
          from: "categories", // Tìm trong bảng danh mục (categories)
          localField: "productDetails.category", // Trường ID danh mục trong sản phẩm
          foreignField: "_id", // Trường _id của danh mục trong bảng categories
          as: "categoryDetails", // Alias cho chi tiết danh mục
        },
      },
      {
        $unwind: "$categoryDetails", // Unwind kết quả từ $lookup
      },
      {
        $group: {
          _id: "$categoryDetails._id", // Nhóm theo ID danh mục
          totalQuantity: { $sum: "$products.quantity" }, // Tổng số lượng bán được
          totalAmount: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.price"],
            },
          }, // Tính tổng doanh thu
          categoryName: { $first: "$categoryDetails.name" }, // Lấy tên danh mục
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sắp xếp theo tổng số lượng bán được giảm dần
      },
      {
        $limit: 5, // Chỉ lấy 5 loại sản phẩm bán chạy nhất
      },
      {
        $project: {
          categoryName: 1, // Tên danh mục sản phẩm
          totalQuantity: 1, // Tổng số lượng bán được của loại sản phẩm
          totalAmount: 1, // Tổng số tiền của loại sản phẩm
        },
      },
    ]);

    // Nếu ít hơn 5 loại sản phẩm, thêm vào những sản phẩm null
    const missingCount = 5 - result.length;
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        result.push({
          categoryName: null, // Tên danh mục là null nếu thiếu
          totalQuantity: null, // Số lượng bán được là null nếu thiếu
          totalAmount: null, // Tổng số tiền là null nếu thiếu
        });
      }
    }

    // Trả về danh sách top 5 loại sản phẩm
    return res.status(200).json({ total: result });
  } catch (error) {
    console.error(
      "Error while fetching top 5 product categories in the last 7 days:",
      error
    );
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

const getTotalAmountCurrentDay = async (req, res) => {
  try {
    // Get the current date
    const currentDate = new Date();

    // Set the start of the current day (midnight)
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));

    // Set the end of the current day (just before midnight)
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    // Perform the MongoDB aggregation query to calculate the totals for today
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay, // Start of today
            $lt: endOfDay, // End of today
          },
        },
      },
      {
        $group: {
          _id: null, // No grouping, we are calculating totals for the entire day
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" },
          totalOrders: { $sum: 1 }, // Count the number of orders for the day
        },
      },
    ]);

    // If no results are found for today, return zeros
    if (result.length === 0) {
      return res.status(200).json({
        day: `${currentDate.toLocaleDateString()}`, // Current date in locale format
        total: {
          name: `${currentDate.toLocaleDateString()}`,
          totalAmount: 0,
          totalVAT: 0,
          totalImportPrice: 0,
          revenue: 0,
          totalOrders: 0,
        },
      });
    }

    // Extract the data from the aggregation result
    const { totalAmount, totalVAT, totalImportPrice, totalOrders } = result[0];
    const revenue = totalAmount - totalImportPrice; // Calculate the revenue for today

    // Return the result for today's totals
    return res.status(200).json({
      day: `${currentDate.toLocaleDateString()}`, // Current date in locale format
      total: {
        name: `${currentDate.toLocaleDateString()}`, // Name as today's date
        totalAmount,
        totalVAT,
        totalImportPrice,
        revenue,
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error while calculating daily totals:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};
// const getTotalAmountComparison = async (req, res) => {
//   try {
//     // Get the current date and previous date
//     const currentDate = new Date();
//     const previousDate = new Date(currentDate);
//     previousDate.setDate(currentDate.getDate() - 1); // Set previous date as one day before current date

//     // Set the start and end of the current day (midnight to just before midnight)
//     const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

//     // Set the start and end of the previous day (midnight to just before midnight)
//     const startOfPreviousDay = new Date(previousDate.setHours(0, 0, 0, 0));
//     const endOfPreviousDay = new Date(previousDate.setHours(23, 59, 59, 999));

//     // Perform the MongoDB aggregation query for today's totals
//     const resultToday = await Order.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: startOfDay, // Start of today
//             $lt: endOfDay, // End of today
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null, // No grouping, we are calculating totals for the entire day
//           totalAmount: { $sum: "$totalAmount" },
//           totalVAT: { $sum: "$amountVAT" },
//           totalImportPrice: { $sum: "$sumImportPrice" },
//           totalOrders: { $sum: 1 }, // Count the number of orders for the day
//         },
//       },
//     ]);

//     // Perform the MongoDB aggregation query for the previous day's totals
//     const resultPreviousDay = await Order.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: startOfPreviousDay, // Start of the previous day
//             $lt: endOfPreviousDay, // End of the previous day
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null, // No grouping, we are calculating totals for the entire day
//           totalAmount: { $sum: "$totalAmount" },
//           totalVAT: { $sum: "$amountVAT" },
//           totalImportPrice: { $sum: "$sumImportPrice" },
//           totalOrders: { $sum: 1 }, // Count the number of orders for the day
//         },
//       },
//     ]);

//     // If no results found for today or previous day, return zeros
//     if (resultToday.length === 0 || resultPreviousDay.length === 0) {
//       return res.status(200).json({
//         comparison: {
//           day: `${currentDate.toLocaleDateString()}`,
//           today: {
//             totalAmount: 0,
//             totalVAT: 0,
//             totalImportPrice: 0,
//             revenue: 0,
//             totalOrders: 0,
//           },
//           previousDay: {
//             totalAmount: 0,
//             totalVAT: 0,
//             totalImportPrice: 0,
//             revenue: 0,
//             totalOrders: 0,
//           },
//           percentageChange: {
//             totalAmount: 0,
//             totalVAT: 0,
//             totalImportPrice: 0,
//             revenue: 0,
//             totalOrders: 0,
//           },
//         },
//       });
//     }

//     // Extract today's and previous day's data
//     const {
//       totalAmount: totalAmountToday,
//       totalVAT: totalVATToday,
//       totalImportPrice: totalImportPriceToday,
//       totalOrders: totalOrdersToday,
//     } = resultToday[0];
//     const {
//       totalAmount: totalAmountPreviousDay,
//       totalVAT: totalVATPreviousDay,
//       totalImportPrice: totalImportPricePreviousDay,
//       totalOrders: totalOrdersPreviousDay,
//     } = resultPreviousDay[0];

//     // Calculate revenue for today and previous day
//     const revenueToday = totalAmountToday - totalImportPriceToday;
//     const revenuePreviousDay =
//       totalAmountPreviousDay - totalImportPricePreviousDay;

//     // Function to calculate percentage change
//     const calculatePercentageChange = (current, previous) => {
//       if (previous === 0) return current === 0 ? 0 : 100; // If previous is 0, return 100% change if current is non-zero
//       return ((current - previous) / previous) * 100; // Otherwise, calculate normal percentage change
//     };

//     // Calculate percentage changes for all metrics
//     const percentageChange = {
//       totalAmount: calculatePercentageChange(
//         totalAmountToday,
//         totalAmountPreviousDay
//       ),
//       totalVAT: calculatePercentageChange(totalVATToday, totalVATPreviousDay),
//       totalImportPrice: calculatePercentageChange(
//         totalImportPriceToday,
//         totalImportPricePreviousDay
//       ),
//       revenue: calculatePercentageChange(revenueToday, revenuePreviousDay),
//       totalOrders: calculatePercentageChange(
//         totalOrdersToday,
//         totalOrdersPreviousDay
//       ),
//     };

//     // Return the comparison results
//     return res.status(200).json({
//       comparison: {
//         day: `${currentDate.toLocaleDateString()}`,
//         today: {
//           totalAmount: totalAmountToday,
//           totalVAT: totalVATToday,
//           totalImportPrice: totalImportPriceToday,
//           revenue: revenueToday,
//           totalOrders: totalOrdersToday,
//         },
//         previousDay: {
//           totalAmount: totalAmountPreviousDay,
//           totalVAT: totalVATPreviousDay,
//           totalImportPrice: totalImportPricePreviousDay,
//           revenue: revenuePreviousDay,
//           totalOrders: totalOrdersPreviousDay,
//         },
//         percentageChange,
//       },
//     });
//   } catch (error) {
//     console.error("Error while calculating daily comparison:", error);
//     return res
//       .status(500)
//       .json({ error: "An error occurred while processing the request" });
//   }
// };
// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount, amountVAT, id } =
//       req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount ||
//       !id ||
//       !amountVAT
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (Number(item.quantity) <= 0) {
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

//     let updatedProducts = [];
//     let sumImportPrice = 0; // Tổng tiền nhập kho
//     let finalTotalAmount = 0; // Tổng tiền sau khi áp dụng giảm giá

//     // Xử lý từng sản phẩm
//     for (const item of products) {
//       const { product, quantity, unit, warehouseReceipt: receipt } = item;

//       const productQuantity = Number(quantity);

//       // Lấy thông tin đơn vị tính
//       const unitDoc = await Unit.findById(unit);
//       if (!unitDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Unit ${unit} not found!`,
//         });
//       }

//       const convertedQuantity = productQuantity * unitDoc.convertQuantity;

//       // Lấy thông tin sản phẩm
//       const productDoc = await Product.findById(product);
//       if (!productDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Product ${product} not found!`,
//         });
//       }

//       if (productDoc.quantity < convertedQuantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Not enough stock for product ${product}`,
//         });
//       }

//       // Lấy thông tin phiếu nhập kho
//       const warehouseReceiptDoc = await WarehouseReceipt.findById(receipt);
//       if (!warehouseReceiptDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Warehouse receipt ${receipt} not found!`,
//         });
//       }

//       // Trừ số lượng trong phiếu nhập kho
//       const productInReceipt = warehouseReceiptDoc.products.find(
//         (p) => p.product.toString() === product.toString()
//       );
//       if (productInReceipt) {
//         if (productInReceipt.quantityDynamic >= convertedQuantity) {
//           productInReceipt.quantityDynamic -= convertedQuantity;
//           await warehouseReceiptDoc.save();

//           // Cộng tổng giá trị nhập kho
//           sumImportPrice += productInReceipt.importPrice * convertedQuantity;

//           // Cập nhật sản phẩm
//           const price = productDoc.price; // Lưu giá cố định
//           const discountAmount = productDoc.discount
//             ? (productDoc.discount / 100) * price * convertedQuantity
//             : 0;
//           const totalPrice = price * convertedQuantity - discountAmount;

//           updatedProducts.push({
//             product,
//             quantity: productQuantity,
//             unit,
//             price, // Giá cố định
//             discountAmount, // Giảm giá cố định
//             totalPrice, // Tổng tiền cố định
//             VAT,
//             warehouseDetails: [
//               {
//                 warehouseReceipt: receipt,
//                 quantity: convertedQuantity,
//               },
//             ],
//           });

//           // Cập nhật tổng tiền
//           finalTotalAmount += totalPrice;
//         } else {
//           return res.status(400).json({
//             success: false,
//             message: `Not enough stock in warehouse receipt ${receipt} for product ${product}`,
//           });
//         }
//       }

//       // Cập nhật thông tin sản phẩm trong kho chính
//       productDoc.quantity -= convertedQuantity;
//       productDoc.sold += convertedQuantity;
//       if (productDoc.quantity === 0) {
//         productDoc.status = "out_of_stock";
//       }
//       await productDoc.save();
//     }

//     // Tạo mới đơn hàng
//     const newOrder = await Order.create({
//       user,
//       products: updatedProducts,
//       totalAmount: finalTotalAmount + amountVAT, // Tổng tiền đã cố định
//       receiveAmount,
//       change,
//       amountVAT,
//       id,
//       sumImportPrice, // Tổng tiền nhập kho
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
const createOrder = expressAsyncHandler(async (req, res) => {
  try {
    const { user, products, totalAmount, receiveAmount, amountVAT, id } =
      req.body;

    // Kiểm tra dữ liệu đầu vào
    if (
      !user ||
      !products ||
      products.length === 0 ||
      !totalAmount ||
      !receiveAmount ||
      !id ||
      !amountVAT
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    // Kiểm tra số lượng hợp lệ
    for (const item of products) {
      if (Number(item.quantity) <= 0) {
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

    let updatedProducts = [];
    let sumImportPrice = 0; // Tổng tiền nhập kho
    let finalTotalAmount = 0; // Tổng tiền sau khi áp dụng giảm giá
    let totalVAT = 0; // Tổng VAT

    // Xử lý từng sản phẩm
    for (const item of products) {
      const { product, quantity, unit, warehouseReceipt: receipt } = item;

      const productQuantity = Number(quantity);

      // Lấy thông tin đơn vị tính
      const unitDoc = await Unit.findById(unit);
      if (!unitDoc) {
        return res.status(404).json({
          success: false,
          message: `Unit ${unit} not found!`,
        });
      }

      const convertedQuantity = productQuantity * unitDoc.convertQuantity;

      // Lấy thông tin sản phẩm
      const productDoc = await Product.findById(product);
      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: `Product ${product} not found!`,
        });
      }

      if (productDoc.quantity < convertedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ${product}`,
        });
      }

      // Lấy thông tin phiếu nhập kho
      const warehouseReceiptDoc = await WarehouseReceipt.findById(receipt);
      if (!warehouseReceiptDoc) {
        return res.status(404).json({
          success: false,
          message: `Warehouse receipt ${receipt} not found!`,
        });
      }

      // Trừ số lượng trong phiếu nhập kho
      const productInReceipt = warehouseReceiptDoc.products.find(
        (p) => p.product.toString() === product.toString()
      );
      if (productInReceipt) {
        if (productInReceipt.quantityDynamic >= convertedQuantity) {
          productInReceipt.quantityDynamic -= convertedQuantity;
          await warehouseReceiptDoc.save();

          // Cộng tổng giá trị nhập kho
          sumImportPrice += productInReceipt.importPrice * convertedQuantity;

          // Cập nhật sản phẩm
          const price = productDoc.price; // Lưu giá cố định
          const discountAmount = productDoc.discount
            ? (productDoc.discount / 100) * price * convertedQuantity
            : 0;
          const totalPriceBeforeVAT =
            price * convertedQuantity - discountAmount;

          // Lấy VAT từ sản phẩm (VAT là tỷ lệ phần trăm, ví dụ 0.1 cho 10%)
          const VAT = productDoc.VAT || 0; // Đảm bảo có giá trị VAT, mặc định là 0 nếu không có

          // Tính VAT cho sản phẩm
          const VATAmount = totalPriceBeforeVAT * VAT;

          // Cập nhật tổng tiền cho sản phẩm
          const totalPrice = totalPriceBeforeVAT + VATAmount;

          updatedProducts.push({
            product,
            quantity: productQuantity,
            unit,
            price, // Giá cố định
            discountAmount, // Giảm giá cố định
            totalPrice, // Tổng tiền cố định đã bao gồm VAT
            VAT: VATAmount, // VAT tính cho từng sản phẩm
            warehouseDetails: [
              {
                warehouseReceipt: receipt,
                quantity: convertedQuantity,
              },
            ],
          });

          // Cập nhật tổng tiền
          finalTotalAmount += totalPrice;
          totalVAT += VATAmount; // Cộng VAT vào tổng VAT của đơn hàng
        } else {
          return res.status(400).json({
            success: false,
            message: `Not enough stock in warehouse receipt ${receipt} for product ${product}`,
          });
        }
      }

      // Cập nhật thông tin sản phẩm trong kho chính
      productDoc.quantity -= convertedQuantity;
      productDoc.sold += convertedQuantity;
      if (productDoc.quantity === 0) {
        productDoc.status = "out_of_stock";
      }
      await productDoc.save();
    }

    // Cập nhật tổng tiền VAT cho đơn hàng
    const totalOrderAmount = finalTotalAmount;

    // Tạo mới đơn hàng
    const newOrder = await Order.create({
      user,
      products: updatedProducts,
      totalAmount: totalOrderAmount, // Tổng tiền đã bao gồm VAT
      receiveAmount,
      change,
      amountVAT: totalVAT, // Tổng VAT cho đơn hàng
      id,
      sumImportPrice, // Tổng tiền nhập kho
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

const getOrderDay = expressAsyncHandler(async (req, res) => {
  // Lấy ngày từ request query hoặc sử dụng ngày hiện tại
  const { date } = req.body;
  const targetDate = new Date(date || new Date()); // Nếu không truyền ngày, mặc định là hôm nay

  // Tạo khoảng thời gian bắt đầu và kết thúc của ngày
  const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

  // Truy vấn đơn hàng trong khoảng thời gian
  const orders = await Order.find({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).populate({
    path: "user",
    select: "employee",
    populate: {
      path: "employee",
      select: "id name images",
    },
  })
  .populate({
    path: "products.product",
    select: "images price title id",
  }).populate({
    path: "products.unit",
    select: "name convertQuantity",
  }).sort({createdAt: -1});

  // Trả về kết quả
  res.status(200).json({
    success: true,
    data: orders,
  });
});
const getTotalAmountComparison = async (req, res) => {
  try {
    // Get the current date
    const currentDate = new Date();
    
    // Create a new date instance for the start of today
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Create a new date instance for the end of today
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Create a new date instance for the start of yesterday
    const startOfPreviousDay = new Date(currentDate);
    startOfPreviousDay.setDate(currentDate.getDate() - 1);
    startOfPreviousDay.setHours(0, 0, 0, 0);

    // Create a new date instance for the end of yesterday
    const endOfPreviousDay = new Date(currentDate);
    endOfPreviousDay.setDate(currentDate.getDate() - 1);
    endOfPreviousDay.setHours(23, 59, 59, 999);

    // Log time ranges
    console.log(`startOfDay: ${startOfDay}, endOfDay: ${endOfDay}`);
    console.log(`startOfPreviousDay: ${startOfPreviousDay}, endOfPreviousDay: ${endOfPreviousDay}`);

    // Perform the MongoDB aggregation query for today's totals
    const resultToday = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Log today's result
    console.log('resultToday:', resultToday);

    // Perform the MongoDB aggregation query for the previous day's totals
    const resultPreviousDay = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfPreviousDay,
            $lt: endOfPreviousDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalVAT: { $sum: "$amountVAT" },
          totalImportPrice: { $sum: "$sumImportPrice" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Log previous day's result
    console.log('resultPreviousDay:', resultPreviousDay);

    // Handle empty results
    if (resultToday.length === 0 || resultPreviousDay.length === 0) {
      return res.status(200).json({
        comparison: {
          day: `${currentDate.toLocaleDateString()}`,
          today: {
            totalAmount: 0,
            totalVAT: 0,
            totalImportPrice: 0,
            revenue: 0,
            totalOrders: 0,
          },
          previousDay: {
            totalAmount: 0,
            totalVAT: 0,
            totalImportPrice: 0,
            revenue: 0,
            totalOrders: 0,
          },
          percentageChange: {
            totalAmount: 0,
            totalVAT: 0,
            totalImportPrice: 0,
            revenue: 0,
            totalOrders: 0,
          },
        },
      });
    }

    // Extract today's and previous day's data
    const {
      totalAmount: totalAmountToday,
      totalVAT: totalVATToday,
      totalImportPrice: totalImportPriceToday,
      totalOrders: totalOrdersToday,
    } = resultToday[0];
    const {
      totalAmount: totalAmountPreviousDay,
      totalVAT: totalVATPreviousDay,
      totalImportPrice: totalImportPricePreviousDay,
      totalOrders: totalOrdersPreviousDay,
    } = resultPreviousDay[0];

    // Calculate revenue for today and previous day
    const revenueToday = totalAmountToday - totalImportPriceToday;
    const revenuePreviousDay =
      totalAmountPreviousDay - totalImportPricePreviousDay;

    // Function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100; // If previous is 0, return 100% change if current is non-zero
      return ((current - previous) / previous) * 100; // Otherwise, calculate normal percentage change
    };

    // Calculate percentage changes for all metrics
    const percentageChange = {
      totalAmount: calculatePercentageChange(
        totalAmountToday,
        totalAmountPreviousDay
      ),
      totalVAT: calculatePercentageChange(totalVATToday, totalVATPreviousDay),
      totalImportPrice: calculatePercentageChange(
        totalImportPriceToday,
        totalImportPricePreviousDay
      ),
      revenue: calculatePercentageChange(revenueToday, revenuePreviousDay),
      totalOrders: calculatePercentageChange(
        totalOrdersToday,
        totalOrdersPreviousDay
      ),
    };

    // Return the comparison results
    return res.status(200).json({
      comparison: {
        day: `${currentDate.toLocaleDateString()}`,
        today: {
          totalAmount: totalAmountToday,
          totalVAT: totalVATToday,
          totalImportPrice: totalImportPriceToday,
          revenue: revenueToday,
          totalOrders: totalOrdersToday,
        },
        previousDay: {
          totalAmount: totalAmountPreviousDay,
          totalVAT: totalVATPreviousDay,
          totalImportPrice: totalImportPricePreviousDay,
          revenue: revenuePreviousDay,
          totalOrders: totalOrdersPreviousDay,
        },
        percentageChange,
      },
    });
  } catch (error) {
    console.error("Error while calculating daily comparison:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};




module.exports = {
  createOrder,
  getAllOrder,
  filterOrderByEmployee,
  filterOrderByDate,
  filterOrders,
  sumTotalAmount,
  getTotalAmountAndVATByYear,
  getTotalAmountAndVATByMonth,
  extraInfor,
  top5ProductMonth,
  top5ProductYear,
  getTotalAmountAndVATByMonthReport,
  getTotalAmountAndVATByYearReport,
  top5ProductCategoryYear,
  top5ProductCategoryMonth,
  top5ProductLast7Days,
  top5ProductLast30Days,
  top5ProductLast365Days,
  top5ProductCategoryLast7Days,
  top5ProductCategoryLast30Days,
  top5ProductCategoryLast365Days,
  getTotalAmountCurrentDay,
  getTotalAmountComparison,
  getOrderDay,
};
