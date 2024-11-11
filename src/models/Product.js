const mongoose = require("mongoose");

var productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: Array,
      required: true,
    },
    expires: {
      type: String,
    },
    brand: { type: mongoose.Types.ObjectId, ref: "Brand" },
    shelf: [{ type: mongoose.Types.ObjectId, ref: "Shelf" }],
    warehouseReceipt: [{ type: mongoose.Types.ObjectId, ref: "WarehouseReceipt" }],
    price: {
      type: Number,
      required: true,
    },
    category: { type: mongoose.Types.ObjectId, ref: "Category" },
    subcategory: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in_stock", "out_of_stock", "discontinued", "in_progress_sale"],
      default: "out_of_stock",
    },
    isDisplay: {
      type: Boolean,
      default: true
    }
    ,
    sold: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
    },
    color: {
      type: String,
      require: true,
    },
    ratings: [
      {
        star: { type: Number },
        images: { type: Array },
        postedBy: { type: mongoose.Types.ObjectId, ref: "User" },
        comment: { type: String },
        updatedAt: {
          type: Date,
        },
      },
    ],
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
