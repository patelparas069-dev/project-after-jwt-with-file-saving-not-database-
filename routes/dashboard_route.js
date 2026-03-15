const express  = require("express")
const path     = require("path")
const router   = express.Router()
const jwt          = require('jsonwebtoken')
const {first} = require(path.join(__dirname,"..","controller","dashboard_cont.js"))
const SECRET = "shlok"

router.get("/dashboard",(req,res,next)=>{
    const token = req.cookies.token
    
    if (!token) {
    return res.redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, SECRET)
    console.log(decoded)
    res.send(`<p>hi</p>`)

  } catch (err) {
    console.log(err);
    res.redirect('/login')
  }

})





module.exports = router