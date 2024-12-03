const mongoose = require("mongoose");

var productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    // slug: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   lowercase: true,
    // },
    description: {
      type: String,
    },
    // expires: {
    //   type: String,
    // },
    brand: { type: mongoose.Types.ObjectId, ref: "Brand" },
    warehouseReceipt: [{ type: mongoose.Types.ObjectId, ref: "WarehouseReceipt" }],
    price: {
      type: Number,
      required: true,
    },
    category: { type: mongoose.Types.ObjectId, ref: "Category" },
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
    }   ,
    sold: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
    },
    // sumQuantity: {
    //   type: Number
    // },
    VAT:{
      type: Number
    },
    id:{
      type: Number,
      unique: true,
      required: true,
    },
    unit: { type: mongoose.Types.ObjectId, ref: "Unit" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
