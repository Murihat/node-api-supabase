const express = require('express')
const router = express.Router()

const { supabase } = require('../config/supabase')

// GET /employee → ambil semua data employee
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('tb_employee').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ employees: data })
})

// Tambahan contoh POST (opsional)
router.post('/', async (req, res) => {
  const { name, email } = req.body
  const { data, error } = await supabase.from('tb_employee').insert({ name, email })

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ inserted: data })
})

module.exports = router
