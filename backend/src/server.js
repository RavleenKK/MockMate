
//This imports the Express library.
// Express is a Node.js web framework that helps you build APIs and servers easily
import express from "express";
import { ENV } from "./lib/env.js";
import path from  "path"

const app = express()
const __dirname = path.resolve()
app.get("/api", (req, res) => {
    res.status(200).json({msg: "success from api"})
}) 

app.get("/books", (req, res) => {
    res.status(200).json({msg: "books endpoint"})
}) 


//make ready for deployement
if(ENV.NODE_ENV=="production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")))
    app.get("/{*any}", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend","dist", "index.html"));
    })
}

app.listen(ENV.PORT, () => console.log("running on port:", ENV.PORT));