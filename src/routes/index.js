const UserRouter = require("./UserRouter");
const { errorHandler, notFound } = require("../middlewares/errorHandler");

const initRoutes = (app) => {
  app.use("/api/v1/user", UserRouter);
  app.use(notFound);
  app.use(errorHandler);
};
module.exports = initRoutes;
