const express  = require("express")
const path     = require("path")
const fs       = require("fs")
const router   = express.Router()
const jwt      = require('jsonwebtoken')
const SECRET   = "shlok"
const { signup, login ,findUserFromToken,verifyUserFromToken} = require(path.join(__dirname, "..","database", "db_func"));

// Body parser middleware
router.use(express.urlencoded({ extended: true }))
router.use(express.json())

router.get("/", async (req,res)=>{
  if(await verifyUserFromToken(req,res)){
    return res.redirect("/dashboard")
  }
  else{
  res.sendFile(path.join(__dirname, "..", "auth view", "Choice.html"))}
})

router.get("/sign", async (req,res)=>{
  if(await verifyUserFromToken(req,res) === true){
    res.redirect("/dashboard")
  }
  else{
  res.sendFile(path.join(__dirname, "..", "auth view", "sign.html"))}
})

router.get("/login", async (req,res)=>{
  if(await verifyUserFromToken(req,res) === true){
    res.redirect("/dashboard")
  }
  else{
  res.sendFile(path.join(__dirname, "..", "auth view", "login.html"))}
})

// ---- HANDLE FORM POSTS ----
router.post("/sign",  signup)
router.post("/login", login)

module.exports = router

