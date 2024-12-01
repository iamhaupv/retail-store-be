const mongoose = require("mongoose");

var employeeSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
    },
    birthday: {
      type: String,
      required: true,
      trim: true,
    },
    // email: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    images: {
      type: Array,
    },
    isDisplay: {
      type: Boolean,
      default: true
    }
    ,
    address: { type: String, require: true, trim: true },
    phone: { type: String, require: true, trim: true },
    description: { type: String, trim: true },
    user: { type: mongoose.Types.ObjectId, ref: "User" }
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Employee", employeeSchema);
