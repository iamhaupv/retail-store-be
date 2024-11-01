const mongoose = require("mongoose");

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
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shelf", shelfSchema);
