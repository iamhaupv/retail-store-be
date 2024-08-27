const { UserRepository } = require("../repositories/index");
const register = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await UserRepository.register(phoneNumber, password);
    res.status(200).json({
      message: "Register successfully!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "User is exist!",
    });
  }
};

module.exports = {
  register,
};
