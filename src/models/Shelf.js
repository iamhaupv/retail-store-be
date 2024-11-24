const mongoose = require("mongoose");

var shelfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 0,
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
        title: {type: String, require: true},
        quantity: { type: Number, default: 0 },
        warehouseReceipt: { type: mongoose.Types.ObjectId, ref: "WarehouseReceipt" },
        sumQuantity: {type: Number, require: true}
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shelf", shelfSchema);
