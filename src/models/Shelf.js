const mongoose = require("mongoose");
const WarehouseReceipt = require("./WarehouseReceipt");

var shelfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: Array,
      required: true,
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
        warehouseReceipt: { type: mongoose.Types.ObjectId, ref: "WarehouseReceipt" }
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shelf", shelfSchema);
