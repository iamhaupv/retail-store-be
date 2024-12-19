const mongoose = require("mongoose");

var employee_shift_Schema = new mongoose.Schema(
  {
    isDisplay: {
      type: Boolean,
      default: true
    },
    start: {
        type: Date,
        require: true
    },
    end: {
        type: Date,
        require: true
    },
    employee: { type: mongoose.Types.ObjectId, ref: "Employee" },
    shift: { type: mongoose.Types.ObjectId, ref: "Shift" },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("EmployeeShift", employee_shift_Schema);
