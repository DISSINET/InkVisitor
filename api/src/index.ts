var express = require("express");
import { replaceAll } from "../../common/util/base";

const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("Hello!"));

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
