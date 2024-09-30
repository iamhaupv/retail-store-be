const { Category } = require("../models/index");
// create category
const createCategory = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(400).json({
        success: false,
        mes: "Missing input!",
      });
    const {name} = req.body
    const categoryExist = await Category.findOne({name: name})
    if(categoryExist){
        return res.status(500).json({
            success: false,
            mes: "Category name is exists!"
        })
    }
    const newCategory = await Category.create(req.body)
    return res.status(200).json({
        success: newCategory ? true : false,
        mes: newCategory ? newCategory : "Cannot create category!"
    })
  } catch (error) {
    throw new Error(error);
  }
};
// get list category
const getListCategory = async (req, res) => {
    try {
        const response = await Category.find()
        return res.status(200).json({
            success: response ? true : false,
            data: response ? response  : "Cannot get list categories!"
        })
    } catch (error) {
        throw new Error(error)
    }
}
module.exports = {
  createCategory,
  getListCategory
};
