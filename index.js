const express = require("express");
const { route } = require("./routes");
const app = express();
const routes = require("./routes");
// set the view engine to ejs
app.set("view engine", "ejs");

app.use("/I/Want/title", routes);

app.use(function (req, res) {
  res.sendStatus(404);
});
app.listen(8080, console.log("server listening on port 8080"));
