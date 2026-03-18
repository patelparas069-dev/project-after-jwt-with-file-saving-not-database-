require('dotenv').config()
const express  = require("express")
const path     = require("path")
const router   = express.Router()
const jwt      = require('jsonwebtoken')

const SECRET = "shlok"

// ✅ Dashboard route
router.get("/dashboard", (req, res) => {
  const token = req.cookies.token

  if (!token) return res.redirect('/login')

  try {
    const decoded = jwt.verify(token, SECRET)
    console.log("User:", decoded)

    res.sendFile(path.join(__dirname, "..", "auth view", "dashboard.html"))

  } catch (err) {
    console.log("JWT Error:", err.message)
    res.redirect('/login')
  }
})


// ✅ FREE AI ROUTE (OpenRouter)
router.post('/api/ask-ai', async (req, res) => {
  try {
    const { question } = req.body

    if (!question) {
      return res.status(400).json({ reply: 'No question provided.' })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, // 🔑 put this in .env
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto", // ✅ free model
        messages: [
          {
            role: "system",
            content: "You are StockPulse AI, a helpful assistant for stocks and finance. Keep answers short and clear."
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    })

    console.log("STATUS:", response.status)

    const data = await response.json()

    // ✅ DEBUG
    console.log("OPENROUTER RESPONSE:", JSON.stringify(data, null, 2))

    let reply = "No response from AI"

    if (data.choices && data.choices.length > 0) {
      reply = data.choices[0].message.content
    }

    res.json({ reply })

  } catch (err) {
    console.log("AI ERROR:", err)
    res.status(500).json({ reply: 'Something went wrong. Please try again.' })
  }
})

module.exports = router