const mongoose = require("mongoose");

var employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: Array,
    },
    age: {
      type: Number,
      required: true,
    },
    address: { type: String, require: true, trim: true },
    phone: { type: String, require: true, trim: true },
    description: { type: String, require: true, trim: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Employee", employeeSchema);
