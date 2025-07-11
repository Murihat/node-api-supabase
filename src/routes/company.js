const express = require('express')
const router = express.Router()

const { createClient } = require('@supabase/supabase-js')

// Inisialisasi Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('tb_company').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ company: data })
})

router.post('/', async (req, res) => {
  const { name, email } = req.body
  const { data, error } = await supabase.from('tb_company').insert({ name, email })

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ inserted: data })
})

module.exports = router
