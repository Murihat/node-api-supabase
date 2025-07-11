require('dotenv').config()
const express = require('express')
const cors = require('cors')
const basicAuth = require('express-basic-auth')

const app = express()
const port = process.env.PORT || 3000

// CORS setup
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}))

// Timeout middleware (1 minute)
app.use((req, res, next) => {
  res.setTimeout(60000, () => {
    return res.status(503).json({ error: 'Request timeout. Please try again.' })
  })
  next()
})

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Basic Auth for all routes
// app.use(basicAuth({
//   users: { [process.env.API_USERNAME]: process.env.API_PASSWORD },
//   challenge: true,
//   unauthorizedResponse: (req) => ({ error: 'Unauthorized' })
// }))

// Router
const employeeRouter = require('./routes/employee')
app.use('/employee', employeeRouter)
const companyRouter = require('./routes/company')
app.use('/company', companyRouter)

// Default route
app.get('/', (req, res) => {
  res.send('Hello from Express + Supabase + Router + Auth!')
})

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`)
})
