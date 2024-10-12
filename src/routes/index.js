const UserRouter = require("./UserRouter");
const { errorHandler, notFound } = require("../middlewares/errorHandler");
const ProductRouter = require("./ProductRouter");
const BrandRouter = require("./BrandRouter");
const CategoryRouter = require("./CategoryRouter")
const EmployeeRouter = require("./EmployeeRouter")
const ShiftRouter = require("./ShiftRouter")
const initRoutes = (app) => {
  app.use("/api/v1/user", UserRouter);
  app.use("/api/v1/product", ProductRouter);
  app.use("/api/v1/brand", BrandRouter)
  app.use("/api/v1/category", CategoryRouter)
  app.use("/api/v1/employee", EmployeeRouter)
  app.use("/api/v1/shift", ShiftRouter)
  app.use(notFound);
  app.use(errorHandler);
};
module.exports = initRoutes;
