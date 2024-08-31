const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 6969;
const cors = require("cors");
const connect = require("./src/databases/mongodb");
const { UserRouter } = require("./src/routes/index");
app.use(express.json());
app.use(express.static("./src"));
app.use(cors({ origin: true }));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello");
});
app.use("/api/v1/users", UserRouter);
app.listen(port, async () => {
  await connect();
  console.log(`App on for port ${port}`);
});
