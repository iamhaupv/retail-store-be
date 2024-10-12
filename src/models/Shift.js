const mongoose = require("mongoose");

var shiftSchema = new mongoose.Schema(
  {
    nameShift: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    employee: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    description: { type: String, require: true, trim: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Shift", shiftSchema);
