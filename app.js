const express = require("express");
const app = express();
const path = require("path")

const authRoutes = require(path.join(__dirname,"routes","auth_route.js"));

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"auth view")))

app.use(authRoutes);



app.listen(3004, ()=>{
    console.log("Server started on port 3004");
});