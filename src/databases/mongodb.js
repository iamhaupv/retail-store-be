const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const Connect = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URL);
    console.log("Connect mongodb successfully!");
    return connect;
  } catch (error) {
    throw new Error(error);
  }
};
module.exports = Connect;
