const path   = require("path")
const fs     = require("fs")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const SECRET = "shlok"
// ---- SIGNUP ----
const signup = async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, "..", "users.json")

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    const user = {
      fullname:   req.body.fullname,
      username:   req.body.username,
      email:      req.body.email,
      phone:      req.body.phone,
      password:   hashedPassword,
      agreeTerms: req.body.agreeTerms
    }

    fs.appendFileSync(filePath, JSON.stringify(user) + "\n")

    res.redirect(302, "/login")

  } catch (err) {
    next(err)
  }
}

// ---- LOGIN ----
const login = async (req, res, next) => {
  try {
    const { username, password, email} = req.body
    const filePath = path.join(__dirname, "..", "users.json")

    // File does not exist
    if (!fs.existsSync(filePath)) {
      return res.redirect(302, "/login?error=wrongusername")
    }

    const data = fs.readFileSync(filePath, "utf-8")

    // File is empty
    if (!data.trim()) {
      return res.redirect(302, "/login?error=wrongusername")
    }

    // Parse users safely
    let users = []
    try {
      users = data
        .split("\n")
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
    } catch (parseErr) {
      return res.redirect(302, "/login?error=wrongusername")
    }

    // Check username exists
    const user = users.find(u => u.username === username)
    if (!user) {
      return res.redirect(302, "/login?error=wrongusername")
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.redirect(302, "/login?error=wrongpassword")
    }
    // jwt web token given to user 
    const token = jwt.sign(
  // PAYLOAD — data you want to store in token
    {
    username: user.username,
    fullname: user.fullname,
    email:    user.email
    },
    // SECRET KEY
    SECRET,
  // OPTIONS
  { expiresIn: '7d' }   // token expires in 7 days
  )
    res.cookie('token', token, {
    httpOnly: true,                    // JS cannot read this cookie — security
    maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days in milliseconds
    })

    // ✅ All correct — go to dashboard
    res.redirect(302, "/dashboard")

  } catch (err) {
    next(err)
  }
}

function findUserFromToken(req, res) {
  const token = req.cookies.token

  // No token — send choice page
  if (!token) {
    return res.sendFile(path.join(__dirname, "..", "auth view", "Choice.html"))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, SECRET)

    // Read users.json
    const filePath = path.join(__dirname, "..", "users.json")

    if (!fs.existsSync(filePath)) {
      return res.sendFile(path.join(__dirname, "..", "auth view", "Choice.html"))
    }

    const data  = fs.readFileSync(filePath, "utf-8")
    const users = data.split("\n").filter(line => line.trim()).map(line => JSON.parse(line))

    // Find user by username from JWT
    const user = users.find(u => u.username === decoded.username)

    if (!user) {
      res.clearCookie("token")
      return res.sendFile(path.join(__dirname, "..", "auth view", "Choice.html"))
    }

    // ✅ User found — redirect to dashboard
    return res.redirect("/dashboard")

  } catch (err) {
    // Token invalid or expired
    res.clearCookie("token")
    return res.sendFile(path.join(__dirname, "..", "auth view", "Choice.html"))
  }
}

module.exports = { signup, login ,findUserFromToken}