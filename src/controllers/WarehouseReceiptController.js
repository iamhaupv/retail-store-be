const expressAsyncHandler = require("express-async-handler");
const { WarehouseReceipt, Product } = require("../models/index");

// create warehouse receipt
const createWarehouseReceipt = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input!");
  const { user, description, idPNK, products, unit } = req.body;
  const newWarehouseReceipt = await WarehouseReceipt.create({
    user,
    description,
    idPNK,
    products,
    unit,
  });
  for (const item of products) {
    const { product, quantity } = item;

    // Cập nhật số lượng cho sản phẩm tương ứng
    await Product.findOneAndUpdate(
      { _id: product },
      {
        $inc: { quantity: quantity },
        $set: { status: "in_stock" },
        $push: { warehouseReceipt: newWarehouseReceipt._id }
      },
      { new: true } // Trả về tài liệu đã được cập nhật
    );
    
  }
  return res.status(201).json({
    success: newWarehouseReceipt ? true : false,
    newWarehouseReceipt: newWarehouseReceipt
      ? newWarehouseReceipt
      : "Cannot create new warehouse receipt!",
  });
});
// get all warehouse receipt
const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
  // const receipts = await WarehouseReceipt.find({ isDisplay: true })
  //   .populate("products.product").populate("brand")
  //   .populate("user")
  //   .populate("products.unit")
  //   .sort({ createdAt: -1 })
  //   .exec();
  const receipts = await WarehouseReceipt.find({ isDisplay: true })
  .populate({
    path: "products.product",  // Populate thông tin sản phẩm
    populate: {
      path: "brand",  // Populate thông tin về thương hiệu của sản phẩm
      select: "name phone address",  // Chỉ lấy tên của thương hiệu
    },
  })
  .populate("user")  // Populate thông tin người dùng
  .populate("products.unit")  // Populate thông tin đơn vị của sản phẩm
  .sort({ createdAt: -1 })  // Sắp xếp theo ngày tạo giảm dần
  .exec();
  return res.status(200).json({
    success: receipts ? true : false,
    receipts: receipts ? receipts : "Cannot get all warehouse receipt!",
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
module.exports = {
  createWarehouseReceipt,
  getAllWarehouseReceipt,
  lastIdReceipt,
  changeIsDisplay,
};
