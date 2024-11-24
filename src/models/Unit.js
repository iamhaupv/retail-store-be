const mongoose = require("mongoose");

var unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    convertQuantity:{
        type: Number,
        require: true
    },
    isDisplay: {
      type: Boolean,
      default: true
    },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Unit", unitSchema);
