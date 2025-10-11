// scripts/download-openapi.js
const fs = require('fs')
const path = require('path')
const https = require('https')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const NEXT_PUBLIC_API_BASEURL = process.env.NEXT_PUBLIC_API_BASEURL
if (!NEXT_PUBLIC_API_BASEURL) {
  console.error('ERROR: NEXT_PUBLIC_API_BASEURL not set. Check .env or environment.')
  process.exit(2)
}

const url = `${NEXT_PUBLIC_API_BASEURL}/api/openapi.json`
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
