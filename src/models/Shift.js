const mongoose = require("mongoose");

var shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    employees: [{ type: mongoose.Types.ObjectId, ref: "Employee" }],
    employee_shift: [{ type: mongoose.Types.ObjectId, ref: "EmployeeShift" }],
    description: { type: String, require: true, trim: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Shift", shiftSchema);
