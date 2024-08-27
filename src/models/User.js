const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    phoneNumber: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      default: "User",
    },
    permissions: {
      type: [String],
      default: [],
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    updateAt: {
      type: Date,
      default: Date.now(),
    },
    avatar: {
      type: String,
      require: false,
    },
  })
);

module.exports = User;
