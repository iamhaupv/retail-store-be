const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 6969;
const cors = require("cors");
const connect = require("./src/databases/mongodb");
const initRoutes = require("./src/routes/index")
app.use(express.json());
app.use(express.static("./src"));
app.use(cors({ origin: true }));
app.use(express.urlencoded({ extended: true }));
initRoutes(app);
app.listen(port, async () => {
  await connect();
  console.log(`App on for port ${port}`);
});
