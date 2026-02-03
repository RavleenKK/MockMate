
//This imports the Express library.
// Express is a Node.js web framework that helps you build APIs and servers easily
import express from "express";
import { ENV } from "./lib/env.js";

const app = express()
// console.log(ENV.PORT);

app.get("/", (req, res) => {
    res.status(200).json({msg: "success from api"})
}) 

//Starts the server on port 3000
// The callback runs once the server is live
app.listen(ENV.PORT, () => console.log("running on port:", ENV.PORT));