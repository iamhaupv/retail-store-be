const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalURL} not Found!`);
  res.status(404);
  next(error);
};
