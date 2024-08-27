const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 6969;
const connect = require("./src/databases/mongodb");
app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, async () => {
  await connect();
  console.log(`App on for port ${port}`);
});
