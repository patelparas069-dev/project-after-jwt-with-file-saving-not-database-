require('dotenv').config();   // ✅ MUST BE FIRST LINE
const express      = require("express")
const app          = express()
const path         = require("path")
const jwt          = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const mongoose     = require("mongoose")
const http         = require("http")
const { Server }   = require("socket.io")

const SECRET = "shlok"

const { getStockLiveData, YAHOO_SYMBOLS } = require(
  path.join(__dirname, "controller", "dashboard_cont.js")
)

const server = http.createServer(app)
const io     = new Server(server)

io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie
    if (!cookie) return next(new Error("No cookie"))

    const token = cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1]

    if (!token) return next(new Error("No token"))

    const decoded = jwt.verify(token, SECRET)
    socket.user   = decoded
    next()

  } catch (err) {
    next(new Error("Auth failed"))
  }
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.username)

  let isRunning   = true
  let loopStarted = false

  socket.on("stock_list", async (STOCKS) => {
    if (loopStarted) return
    loopStarted = true

    // ✅ Fetch and emit each stock individually as soon as it arrives
    async function fetchAndEmitAll() {
      if (!isRunning) return

      for (const key of Object.keys(STOCKS)) {
        if (!isRunning) return  // stop mid-loop if disconnected

        const yahooSymbol = YAHOO_SYMBOLS[key]
        if (!yahooSymbol) continue

        try {
          const data = await getStockLiveData(yahooSymbol)
          if (!isRunning) return

          if (data && data.livePrice) {
            // ✅ emit immediately for this one stock — don't wait for others
            socket.emit("imp_shares", { [key]: data.livePrice })
          }
        } catch (err) {
          console.log(`Error fetching ${key}:`, err.message)
        }

        // small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2))
      }

      // schedule next full cycle after all stocks done
      if (isRunning) setTimeout(fetchAndEmitAll, 2)
    }

    fetchAndEmitAll()
  })

  socket.on("disconnect", () => {
    isRunning = false
    console.log("User disconnected:", socket.user.username)
  })
})

async function startServer() {
  try {
    const uri = "mongodb+srv://shlok4252:BIb81XL0NKIKlAmk@firstcluster.2nbrpjk.mongodb.net/users"
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    console.log("✅ Connected to Atlas")
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message)
    process.exit(1)
  }

  const authRoutes      = require(path.join(__dirname, "routes", "auth_route.js"))
  const dashboard_route = require(path.join(__dirname, "routes", "dashboard_route.js"))

  app.use(cookieParser())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(path.join(__dirname, "auth view")))
  app.use((req, res, next) => { res.set("Cache-Control", "no-store"); next() })

  app.use(authRoutes)
  app.use(dashboard_route)

  server.listen(3004, () => console.log("🚀 Server started on port 3004"))
}

process.on("uncaughtException",  (err)    => console.log("Uncaught Exception:", err.message))
process.on("unhandledRejection", (reason) => console.log("Unhandled Rejection:", reason))

startServer()