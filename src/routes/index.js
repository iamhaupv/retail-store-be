const UserRouter = require("./UserRouter");
const { errorHandler, notFound } = require("../middlewares/errorHandler");
const ProductRouter = require("./ProductRouter");
const BrandRouter = require("./BrandRouter");
const CategoryRouter = require("./CategoryRouter")
const EmployeeRouter = require("./EmployeeRouter")
const ShiftRouter = require("./ShiftRouter")
const WarehouseReceiptRouter = require("./WarehouseReceiptRouter");
const UnitRouter = require("./UnitRouter")
const ShelfRouter = require("./ShelfRouter")
const OrderRouter = require("./OrderRouter")
const EmployeeShift = require("./EmployeeShiftRouter")
const initRoutes = (app) => {
  app.use("/api/v1/user", UserRouter);
  app.use("/api/v1/product", ProductRouter);
  app.use("/api/v1/brand", BrandRouter)
  app.use("/api/v1/category", CategoryRouter)
  app.use("/api/v1/employee", EmployeeRouter)
  app.use("/api/v1/shift", ShiftRouter)
  app.use("/api/v1/warehouse", WarehouseReceiptRouter)
  app.use("/api/v1/unit", UnitRouter)
  app.use("/api/v1/shelf", ShelfRouter)
  app.use("/api/v1/order", OrderRouter)
  app.use("/api/v1/emp_shi", EmployeeShift)
  app.use(notFound);
  app.use(errorHandler);
};
module.exports = initRoutes;
