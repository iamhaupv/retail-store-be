const UserRouter = require("./UserRouter");
const { errorHandler, notFound } = require("../middlewares/errorHandler");
const ProductRouter = require("./ProductRouter");
const BrandRouter = require("./BrandRouter")
const initRoutes = (app) => {
  app.use("/api/v1/user", UserRouter);
  app.use("/api/v1/product", ProductRouter);
  app.use("/api/v1/brand", BrandRouter)
  app.use(notFound);
  app.use(errorHandler);
};
module.exports = initRoutes;
