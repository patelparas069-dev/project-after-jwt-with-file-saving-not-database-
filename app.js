const express = require("express");
const app = express();
const path = require("path")
const jwt          = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const SECRET = "shlok"
const authRoutes = require(path.join(__dirname,"routes","auth_route.js"));
const dashboard_route = require(path.join(__dirname,"routes","dashboard_route.js"));

app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"auth view")))

app.use(authRoutes);
app.use(dashboard_route);


app.listen(3004, ()=>{
    console.log("Server started on port 3004");
});