const { Order, Shelf, Product } = require("../models/index");

const expressAsyncHandler = require("express-async-handler");

//
// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount } = req.body;

//     // Kiểm tra xem các trường cần thiết có đầy đủ không
//     if (!user || !products || products.length === 0 || !totalAmount || !receiveAmount) {
//       return res.status(400).json({ success: false, message: "Missing required fields!" });
//     }

//     // Tính toán tiền thối lại (change)
//     const change = receiveAmount - totalAmount;

//     // Tạo một tài liệu Order mới với các dữ liệu đã tính toán
//     const newOrder = await Order.create({
//       user,
//       products,
//       totalAmount,
//       receiveAmount,
//       change,
//     });

//     // Cập nhật số lượng sản phẩm trên kệ và trong kho tổng
//     for (const item of products) {
//       const { product, quantity } = item;

//       // Tìm kệ chứa sản phẩm
//       const shelf = await Shelf.findOne({ 'products.product': product });

//       if (shelf) {
//         const productOnShelf = shelf.products.find(p => p.product.toString() === product.toString());

//         if (productOnShelf && productOnShelf.quantity >= quantity) {
//           // Giảm số lượng sản phẩm trên kệ
//           productOnShelf.quantity -= quantity;

//           // Lưu kệ lại
//           await shelf.save();
//         } else {
//           return res.status(400).json({ success: false, message: "Not enough stock on shelf" });
//         }
//       } else {
//         return res.status(400).json({ success: false, message: "Product not found on shelf" });
//       }

//       // Cập nhật số lượng tổng sản phẩm trong kho
//       const productInStore = await Product.findById(product);

//       if (productInStore) {
//         if (productInStore.quantity >= quantity) {
//           // Giảm số lượng sản phẩm trong kho tổng
//           productInStore.quantity -= quantity;

//           // Lưu lại thông tin sản phẩm trong kho
//           await productInStore.save();
//         } else {
//           return res.status(400).json({ success: false, message: "Not enough stock in store" });
//         }
//       } else {
//         return res.status(400).json({ success: false, message: "Product not found in store" });
//       }
//     }

//     // Phản hồi thành công hoặc thất bại
//     return res.status(201).json({
//       success: true,
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
///
// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount } = req.body;

//     // Kiểm tra xem các trường cần thiết có đầy đủ không
//     if (!user || !products || products.length === 0 || !totalAmount || !receiveAmount) {
//       return res.status(400).json({ success: false, message: "Missing required fields!" });
//     }

//     // Tính toán tiền thối lại (change)
//     const change = receiveAmount - totalAmount;

//     // Tạo một tài liệu Order mới
//     const newOrder = await Order.create({
//       user,
//       products,
//       totalAmount,
//       receiveAmount,
//       change,
//     });

//     // Kiểm tra số lượng sản phẩm trên kệ và trong kho
//     for (const item of products) {
//       const { product, quantity } = item;

//       // Tìm kệ chứa sản phẩm
//       const shelf = await Shelf.findOne({ 'products.product': product });

//       if (shelf) {
//         const productOnShelf = shelf.products.find(p => p.product.toString() === product.toString());

//         if (productOnShelf) {
//           // Kiểm tra số lượng trên kệ
//           if (productOnShelf.quantity < quantity) {
//             return res.status(400).json({ success: false, message: "Not enough stock on shelf" });
//           }
//         } else {
//           return res.status(400).json({ success: false, message: "Product not found on shelf" });
//         }
//       } else {
//         return res.status(400).json({ success: false, message: "Product not found on shelf" });
//       }

//       // Cập nhật số lượng tổng sản phẩm trong kho
//       const productInStore = await Product.findById(product);

//       if (productInStore) {
//         // Kiểm tra số lượng trong kho
//         if (productInStore.quantity < quantity) {
//           return res.status(400).json({ success: false, message: "Not enough stock in store" });
//         }
//       } else {
//         return res.status(400).json({ success: false, message: "Product not found in store" });
//       }
//     }

//     // Nếu tất cả kiểm tra đều hợp lệ, tiến hành cập nhật số lượng trên kệ và trong kho
//     for (const item of products) {
//       const { product, quantity } = item;

//       // Cập nhật số lượng trên kệ
//       const shelf = await Shelf.findOne({ 'products.product': product });
//       const productOnShelf = shelf.products.find(p => p.product.toString() === product.toString());
//       productOnShelf.quantity -= quantity;
//       await shelf.save();

//       // Cập nhật số lượng trong kho
//       const productInStore = await Product.findById(product);
//       productInStore.quantity -= quantity;
//       await productInStore.save();
//     }

//     // Phản hồi thành công
//     return res.status(201).json({
//       success: true,
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

const getAllOrder = expressAsyncHandler(async (req, res) => {
  const orders = await Order.find({ isDisplay: true })
    .populate("user")
    .populate("products.product")
    .populate("products.unit")
    .sort({ createdAt: -1 })
    .exec();
  return res.status(200).json({
    success: orders ? true : false,
    orders: orders ? orders : "Cannot get orders",
  });
});

// const getTotalQuantityOnShelf = async () => {
//   const shelfs = await Shelf.find({}).populate({
//     path: "products.product",
//     select: "title sumQuantity",
//   });

//   const productMap = {};

//   shelfs.forEach((shelf) => {
//     shelf.products.forEach((product) => {
//       const productId = product.product._id.toString();
//       const sumQuantity = product.sumQuantity || 0;

//       if (productMap[productId]) {
//         productMap[productId].sumQuantity += sumQuantity; // Cộng dồn sumQuantity
//       } else {
//         productMap[productId] = { sumQuantity };
//       }
//     });
//   });

//   return productMap;
// };

// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount } = req.body;

//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (item.quantity <= 0) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: `Invalid quantity for product ${item.product}`,
//           });
//       }
//     }

//     // Tính tiền thối lại
//     const change = receiveAmount - totalAmount;
//     if (change < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Insufficient receive amount!" });
//     }

//     // Cập nhật số lượng sumQuantity
//     for (const item of products) {
//       const { product, quantity } = item;

//       // Lấy tất cả các kệ chứa sản phẩm cùng mã
//       const shelves = await Shelf.find({ "products.product": product });

//       if (shelves.length === 0) {
//         return res
//           .status(404)
//           .json({
//             success: false,
//             message: `Product ${product} not found on any shelf!`,
//           });
//       }

//       // Tính tổng sumQuantity của tất cả các sản phẩm cùng mã
//       let totalSumQuantity = 0;
//       shelves.forEach((shelf) => {
//         const productOnShelf = shelf.products.find(
//           (p) => p.product.toString() === product.toString()
//         );
//         if (productOnShelf) {
//           totalSumQuantity += productOnShelf.sumQuantity;
//         }
//       });

//       // Kiểm tra số lượng có đủ để bán không
//       if (totalSumQuantity < quantity) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: `Not enough stock for product ${product}`,
//           });
//       }

//       // Tính toán số lượng còn lại
//       const newSumQuantity = totalSumQuantity - quantity;

//       // Cập nhật lại sumQuantity cho tất cả các kệ chứa sản phẩm đó
//       shelves.forEach(async (shelf) => {
//         shelf.products.forEach((productOnShelf) => {
//           if (productOnShelf.product.toString() === product.toString()) {
//             productOnShelf.sumQuantity = newSumQuantity; // Đồng bộ hóa sumQuantity
//           }
//         });
//         await shelf.save(); // Lưu thay đổi
//       });
//     }

//     // Tạo đơn hàng mới
//     const newOrder = await Order.create({
//       user,
//       products,
//       totalAmount,
//       receiveAmount,
//       change,
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






// const createOrder = expressAsyncHandler(async (req, res) => {
//   try {
//     const { user, products, totalAmount, receiveAmount } = req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (
//       !user ||
//       !products ||
//       products.length === 0 ||
//       !totalAmount ||
//       !receiveAmount
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields!" });
//     }

//     // Kiểm tra số lượng hợp lệ
//     for (const item of products) {
//       if (item.quantity <= 0) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: `Invalid quantity for product ${item.product}`,
//           });
//       }
//     }

//     // Tính tiền thối lại
//     const change = receiveAmount - totalAmount;
//     if (change < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Insufficient receive amount!" });
//     }

//     // Hàm đồng bộ `sumQuantity` trên tất cả các kệ
//     const syncSumQuantity = async (productId, newSumQuantity) => {
//       const shelves = await Shelf.find({ "products.product": productId });
//       for (const shelf of shelves) {
//         shelf.products.forEach((productOnShelf) => {
//           if (productOnShelf.product.toString() === productId.toString()) {
//             productOnShelf.sumQuantity = newSumQuantity; // Đồng bộ hóa
//           }
//         });
//         await shelf.save(); // Lưu thay đổi trên từng kệ
//       }
//     };

//     // Xử lý từng sản phẩm trong đơn hàng
//     for (const item of products) {
//       const { product, quantity } = item;

//       // Lấy thông tin sản phẩm từ DB
//       const productDoc = await Product.findById(product);
//       if (!productDoc) {
//         return res.status(404).json({
//           success: false,
//           message: `Product ${product} not found!`,
//         });
//       }

//       // Lấy tất cả các kệ chứa sản phẩm
//       const shelves = await Shelf.find({ "products.product": product });
//       if (shelves.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: `Product ${product} not found on any shelf!`,
//         });
//       }

//       // Tính tổng `sumQuantity` trên tất cả các kệ
//       let totalShelfQuantity = 0;
//       shelves.forEach((shelf) => {
//         const productOnShelf = shelf.products.find(
//           (p) => p.product.toString() === product.toString()
//         );
//         if (productOnShelf) {
//           totalShelfQuantity += productOnShelf.sumQuantity;
//         }
//       });

//       // Trường hợp 1: số lượng bán nhỏ hơn hoặc bằng tổng số lượng sản phẩm trên kệ
//       if (quantity <= totalShelfQuantity) {
//         let remainingQuantity = quantity;

//         // Trừ số lượng trên từng kệ
//         for (const shelf of shelves) {
//           const productOnShelf = shelf.products.find(
//             (p) => p.product.toString() === product.toString()
//           );
//           if (productOnShelf) {
//             const deduct = Math.min(productOnShelf.sumQuantity, remainingQuantity);
//             productOnShelf.sumQuantity -= deduct;
//             remainingQuantity -= deduct;
//           }
//           await shelf.save();
//           if (remainingQuantity === 0) break;
//         }

//         // Đồng bộ hóa `sumQuantity`
//         const updatedTotalSumQuantity = totalShelfQuantity - quantity;
//         await syncSumQuantity(product, updatedTotalSumQuantity);
//       }

//       // Trường hợp 2 và 3: số lượng bán lớn hơn `sumQuantity` trên kệ
//       else if (quantity <= totalShelfQuantity + productDoc.quantity) {
//         let remainingQuantity = quantity;

//         // Trừ hết số lượng trên kệ
//         for (const shelf of shelves) {
//           const productOnShelf = shelf.products.find(
//             (p) => p.product.toString() === product.toString()
//           );
//           if (productOnShelf) {
//             const deduct = Math.min(productOnShelf.sumQuantity, remainingQuantity);
//             productOnShelf.sumQuantity -= deduct;
//             remainingQuantity -= deduct;
//           }
//           await shelf.save();
//           if (remainingQuantity === 0) break;
//         }

//         // Trừ số lượng còn lại từ kho
//         productDoc.quantity -= remainingQuantity;
//         await productDoc.save();

//         // Đồng bộ hóa `sumQuantity`
//         await syncSumQuantity(product, 0);
//       }

//       // Trường hợp 4: số lượng bán vượt quá tổng tồn kho (bao gồm kệ và kho chính)
//       else {
//         return res.status(400).json({
//           success: false,
//           message: `Not enough stock for product ${product}`,
//         });
//       }
//     }

//     // Tạo đơn hàng mới
//     const newOrder = await Order.create({
//       user,
//       products,
//       totalAmount,
//       receiveAmount,
//       change,
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
    const { user, products, totalAmount, receiveAmount } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (
      !user ||
      !products ||
      products.length === 0 ||
      !totalAmount ||
      !receiveAmount
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    // Kiểm tra số lượng hợp lệ
    for (const item of products) {
      if (item.quantity <= 0) {
        return res
          .status(400)
          .json({
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

    // Hàm đồng bộ `sumQuantity` trên tất cả các kệ
    const syncSumQuantity = async (productId, newSumQuantity) => {
      const shelves = await Shelf.find({ "products.product": productId });
      for (const shelf of shelves) {
        shelf.products.forEach((productOnShelf) => {
          if (productOnShelf.product.toString() === productId.toString()) {
            productOnShelf.sumQuantity = newSumQuantity; // Đồng bộ hóa
          }
        });
        await shelf.save(); // Lưu thay đổi trên từng kệ
      }
    };

    // Xử lý từng sản phẩm trong đơn hàng
    for (const item of products) {
      const { product, quantity } = item;

      // Lấy thông tin sản phẩm từ DB
      const productDoc = await Product.findById(product);
      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: `Product ${product} not found!`,
        });
      }

      // Lấy tất cả các kệ chứa sản phẩm
      const shelves = await Shelf.find({ "products.product": product });
      if (shelves.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Product ${product} not found on any shelf!`,
        });
      }

      // Tính tổng `sumQuantity` trên tất cả các kệ
      let totalShelfQuantity = 0;
      shelves.forEach((shelf) => {
        const productOnShelf = shelf.products.find(
          (p) => p.product.toString() === product.toString()
        );
        if (productOnShelf) {
          totalShelfQuantity += productOnShelf.sumQuantity;
        }
      });

      // Trường hợp 1: số lượng bán nhỏ hơn hoặc bằng tổng số lượng sản phẩm trên kệ
      if (quantity <= totalShelfQuantity) {
        let remainingQuantity = quantity;

        // Trừ số lượng trên từng kệ
        for (const shelf of shelves) {
          const productOnShelf = shelf.products.find(
            (p) => p.product.toString() === product.toString()
          );
          if (productOnShelf) {
            const deduct = Math.min(productOnShelf.sumQuantity, remainingQuantity);
            productOnShelf.sumQuantity -= deduct;
            remainingQuantity -= deduct;
          }
          await shelf.save();
          if (remainingQuantity === 0) break;
        }

        // Cập nhật lại `sumQuantity` cho sản phẩm
        productDoc.sumQuantity -= quantity;
        await productDoc.save();

        // Đồng bộ hóa `sumQuantity` cho kệ
        const updatedTotalSumQuantity = totalShelfQuantity - quantity;
        await syncSumQuantity(product, updatedTotalSumQuantity);
      }

      // Trường hợp 2 và 3: số lượng bán lớn hơn `sumQuantity` trên kệ nhưng nhỏ hơn tổng số lượng (kệ + kho)
      else if (quantity <= totalShelfQuantity + productDoc.quantity) {
        let remainingQuantity = quantity;

        // Trừ hết số lượng trên kệ
        for (const shelf of shelves) {
          const productOnShelf = shelf.products.find(
            (p) => p.product.toString() === product.toString()
          );
          if (productOnShelf) {
            const deduct = Math.min(productOnShelf.sumQuantity, remainingQuantity);
            productOnShelf.sumQuantity -= deduct;
            remainingQuantity -= deduct;
          }
          await shelf.save();
          if (remainingQuantity === 0) break;
        }

        // Trừ số lượng còn lại từ kho
        productDoc.quantity -= remainingQuantity;
        productDoc.sumQuantity -= quantity;  // Cập nhật `sumQuantity` của sản phẩm
        await productDoc.save();

        // Đồng bộ hóa `sumQuantity` cho kệ
        await syncSumQuantity(product, 0);
      }

      // Trường hợp 4: số lượng bán vượt quá tổng tồn kho (bao gồm kệ và kho chính)
      else {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ${product}`,
        });
      }
    }

    // Tạo đơn hàng mới
    const newOrder = await Order.create({
      user,
      products,
      totalAmount,
      receiveAmount,
      change,
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




module.exports = {
  createOrder,
  getAllOrder,
};
