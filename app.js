const express      = require("express")
const app          = express()
const path         = require("path")
const jwt          = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const mongoose     = require("mongoose")
const http         = require("http")
const { Server }   = require("socket.io")

const SECRET = "shlok"

const { getStockLiveData, getAllLivePrices } = require(
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

    try {
      const firstPrices = await getAllLivePrices(STOCKS)
      if (isRunning) {
        // Send real prices immediately
        socket.emit("imp_shares", firstPrices)
        console.log("Initial prices sent to:", socket.user.username)
      }
    } catch (err) {
      console.log("First fetch error:", err.message)
    }

    async function fetchLoop() {
      if (!isRunning) return

      try {
        const updatedPrices = await getAllLivePrices(STOCKS)

        if (!isRunning) return

        // Send real updated prices
        socket.emit("imp_shares", updatedPrices)
        console.log("Prices updated for:", socket.user.username, new Date().toLocaleTimeString())

      } catch (err) {
        console.log("Price update error:", err.message)
      }

      if (isRunning) setTimeout(fetchLoop, 5000) // Update every 5 seconds
    }

    fetchLoop()
  })

  socket.on("disconnect", () => {
    isRunning = false
    console.log("User disconnected:", socket.user.username)
  })
})

const uri = "mongodb+srv://shlok4252:BIb81XL0NKIKlAmk@firstcluster.2nbrpjk.mongodb.net/users"

mongoose.connect(uri)
  .then(() => console.log("Connected to Atlas"))
  .catch((err) => console.log("Connection error:", err))

const authRoutes      = require(path.join(__dirname, "routes", "auth_route.js"))
const dashboard_route = require(path.join(__dirname, "routes", "dashboard_route.js"))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "auth view")))
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store")
  next()
})

app.use(authRoutes)
app.use(dashboard_route)

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err.message)
})

process.on("unhandledRejection", (reason) => {
  console.log("Unhandled Rejection:", reason)
})

server.listen(3004, () => {
  console.log("Server started on port 3004")
})