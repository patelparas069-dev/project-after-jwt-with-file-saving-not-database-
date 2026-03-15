const path   = require("path")
const fs     = require("fs")
const bcrypt = require("bcryptjs")

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
    const { username, password } = req.body
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

    // ✅ All correct — go to dashboard
    res.redirect(302, "/dashboard")

  } catch (err) {
    next(err)
  }
}

module.exports = { signup, login }