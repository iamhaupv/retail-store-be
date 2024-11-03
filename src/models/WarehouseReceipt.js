const mongoose = require("mongoose");

var warehouseReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    idPNK: { type: String, require: true, trim: true },
    isDisplay: { type: Boolean, require: true, default: true },
    products: [
      {
        product: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        importPrice: { type: Number, required: true },
        expires: { type: Date, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WarehouseReceipt", warehouseReceiptSchema);
