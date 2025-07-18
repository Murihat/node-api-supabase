require('dotenv').config()
const express = require('express')
const cors = require('cors')
// const basicAuth = require('express-basic-auth')

const app = express()
const port = process.env.PORT || 3000

// Serve static files (CSS, images, JS)
app.use(express.static(__dirname + '/public'))

// CORS setup
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}))

// Timeout middleware
app.use((req, res, next) => {
  res.setTimeout(60000, () => {
    return res.status(503).json({ error: 'Request timeout. Please try again.' })
  })
  next()
})

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Basic Auth (optional)
/*
app.use(basicAuth({
  users: { [process.env.API_USERNAME]: process.env.API_PASSWORD },
  challenge: true,
  unauthorizedResponse: () => ({ error: 'Unauthorized' })
}))
*/

// All Routes
const router = require('./routes/router')
app.use('/', router)

// Default route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/views/index.html')
})

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})
