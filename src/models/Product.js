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
    brand: [{ type: mongoose.Types.ObjectId, ref: "Brand" }],
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      require: true,
    },
    subcategory: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 0,
    },
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