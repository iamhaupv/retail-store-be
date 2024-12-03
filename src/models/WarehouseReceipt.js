const mongoose = require("mongoose");

var warehouseReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    description: { type: String, trim: true },
    idPNK: { type: String, required: true, trim: true, unique: true },
    isDisplay: { type: Boolean, required: true, default: true },
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
        unit: { type: mongoose.Types.ObjectId, ref: "Unit", required: true },
        quantityDynamic: { type: Number, required: true },
        // convertQuantity: {type: Number, required: true}
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WarehouseReceipt", warehouseReceiptSchema);
