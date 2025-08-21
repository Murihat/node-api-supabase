const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error("❌ comparePassword error:", err);
    return false;
  }
}


module.exports = { hashPassword, generateToken, comparePassword }
