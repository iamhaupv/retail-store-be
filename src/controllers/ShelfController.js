const expressAsyncHandler = require("express-async-handler");
const { Shelf } = require("../models/index");

const createShelf = expressAsyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new Error("Missing input!");
  console.log(req.body.name);

  const shelf = await Shelf.findOne({ name: req.body.name });
  console.log(shelf);

  if (shelf) throw new Error("Shelf Name is exist!");
  const newShelf = await Shelf.create(req.body);
  return res.status(201).json({
    success: newShelf ? true : false,
    newShelf: newShelf ? newShelf : "Cannot create shelf!",
  });
});
const getListShelf = expressAsyncHandler(async (req, res) => {
    const shelfs = await Shelf.find({isDisplay: true}).sort({createdAt: -1}).exec()
    return res.status(200).json({
        success: shelfs ? true : false,
        shelfs: shelfs ? shelfs : "Cannot get list shelfs!"
    })
});
module.exports = { createShelf, getListShelf };
