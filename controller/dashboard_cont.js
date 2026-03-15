const path   = require("path")
const fs     = require("fs")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const SECRET = "shlok"

const first = (req,res,next)=>{
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

}


module.exports = { first }