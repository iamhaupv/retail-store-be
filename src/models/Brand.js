const mongoose = require("mongoose");

var brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    supplyName: {
      type: String,
      required: true,
      trim: true,
    },
    address: { type: String, require: true, trim: true },
    phone: { type: String, require: true, trim: true },
    description: { type: String, trim: true },
    images: {
      type: Array,
      // type: String
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Brand", brandSchema);
