// scripts/download-openapi.js
const fs = require('fs')
const path = require('path')
const https = require('https')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const ROOT_DOMAIN = process.env.ROOT_DOMAIN
if (!ROOT_DOMAIN) {
  console.error('ERROR: ROOT_DOMAIN not set. Check .env or environment.')
  process.exit(2)
}

const url = `https://api.${ROOT_DOMAIN}/api/openapi.json`
const outPath = path.resolve(process.cwd(), 'openapi.json')

console.log('Downloading', url)

const file = fs.createWriteStream(outPath)
https
  .get(url, (res) => {
    if (res.statusCode >= 400) {
      console.error(
        `Failed to download: ${res.statusCode} ${res.statusMessage}`
      )
      process.exit(3)
    }
    res.pipe(file)
    file.on('finish', () => {
      file.close()
      console.log('Saved', outPath)
    })
  })
  .on('error', (err) => {
    fs.unlinkSync(outPath, { force: true })
    console.error('Request error:', err.message)
    process.exit(4)
  })
