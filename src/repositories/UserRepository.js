const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../models/index");
const register = async (phoneNumber, password) => {
  try {
    // const avt =
    //   "https://shoe-shop-images.s3.ap-southeast-1.amazonaws.com/avt.jpg";
    const avt = null;
    const updateAt = null;
    const userExist = await User.findOne({ phoneNumber });
    if (userExist) {
      throw new Error("User is exist");
    }
    const hashPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUND)
    );

    const newUser = await User.create({
      phoneNumber,
      password: hashPassword,
      updateAt,
      avt,
    });
    // const cart = await Cart.create({
    //   user: newUser._id,
    //   products: [],
    // });
    // newUser.cart = cart._id;
    await newUser.save();
    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
module.exports = {
  register,
};
