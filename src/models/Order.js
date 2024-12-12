const mongoose = require("mongoose");

var orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    isDisplay: {
      type: Boolean,
      default: true,
    },
    products: [
      {
        product: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, default: 0 },
        unit: { type: mongoose.Types.ObjectId, ref: "Unit", required: true },
        price: { type: Number, required: true }, 
        discountAmount: { type: Number, default: 0 },
        totalPrice: { type: Number, required: true },
        VAT: {type: Number},
        warehouseDetails: [
          {
            warehouseReceipt: {
              type: mongoose.Types.ObjectId,
              ref: "WarehouseReceipt",
              required: true,
            },
            quantity: { type: Number, default: 0 },
          },
        ],
      },
    ],
    totalAmount: {
      type: Number,
    },
    receiveAmount: {
      type: Number,
    },
    change: {
      type: Number,
    },
    amountVAT: {
      type: Number,
    },
    id: {
      type: Number,
      unique: true,
      require: true,
    },
    sumImportPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
