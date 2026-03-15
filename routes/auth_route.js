const express  = require("express")
const path     = require("path")
const router   = express.Router()
const { signup, login } = require(path.join(__dirname,"..","controller","auth_cont.js"))

// Body parser middleware
router.use(express.urlencoded({ extended: true }))
router.use(express.json())

// ---- SERVE HTML PAGES ----
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "auth view", "Choice.html"))
})

router.get("/sign", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "auth view", "sign.html"))
})

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "auth view", "login.html"))
})

// ---- HANDLE FORM POSTS ----
router.post("/sign",  signup)
router.post("/login", login)

module.exports = router
