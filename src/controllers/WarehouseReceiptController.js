const expressAsyncHandler = require("express-async-handler")
const {WarehouseReceipt} = require("../models/index")

// create warehouse receipt 
const createWarehouseReceipt = expressAsyncHandler(async(req, res) => {
    if(!req.body || Object.keys(req.body).length === 0) throw new Error("Missing input!")
    const newWarehouseReceipt = await WarehouseReceipt.create(req.body)
    return res.status(201).json({
        success: newWarehouseReceipt ? true : false,
        newWarehouseReceipt: newWarehouseReceipt ? newWarehouseReceipt : "Cannot create new warehouse receipt!" 
    })
})
// get all warehouse receipt
const getAllWarehouseReceipt = expressAsyncHandler(async (req, res) => {
    const receipts = await WarehouseReceipt.find({isDisplay: true}).populate("products.product").populate("user")
    return res.status(200).json({
        success: receipts ? true : false,
        receipts: receipts ? receipts : "Cannot get all warehouse receipt!"
    })
})
// last id receipt
const lastIdReceipt = expressAsyncHandler(async (req, res) => {
    try {
      const lastReceipt = await WarehouseReceipt.findOne().sort({ createdAt: -1 }).exec();
  
      if (!lastReceipt) {
        return res.status(200).json({ lastId: null });
      }
      
      const lastId = lastReceipt.idPNK; // Sử dụng trường đúng để lấy mã phiếu
      res.status(200).json({ lastId });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy mã phiếu nhập kho cuối cùng', error: error.message });
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
    console.log(isDisplay);
    
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
    changeIsDisplay
}