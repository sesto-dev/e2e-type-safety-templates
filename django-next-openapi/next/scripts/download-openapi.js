// scripts/download-openapi.js
const fs = require('fs')
const path = require('path')
const https = require('https')
const urlModule = require('url')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const NEXT_PUBLIC_API_BASEURL = process.env.NEXT_PUBLIC_API_BASEURL
if (!NEXT_PUBLIC_API_BASEURL) {
  console.error('ERROR: NEXT_PUBLIC_API_BASEURL not set. Check .env or environment.')
  process.exit(2)
}

const rawUrl = `${NEXT_PUBLIC_API_BASEURL.replace(/\/+$/,'')}/schema/` // ensure trailing slash like your package.json
const outPath = path.resolve(process.cwd(), 'openapi.json')
const maxRedirects = 5

console.log('Downloading', rawUrl)

function cleanupAndExit(code, msg) {
  try { fs.unlinkSync(outPath) } catch (e) { /* ignore */ }
  if (msg) console.error(msg)
  process.exit(code)
}

function fetch(url, redirectsLeft, callback) {
  const parsed = urlModule.parse(url)
  const opts = {
    hostname: parsed.hostname,
    path: parsed.path,
    port: parsed.port,
    protocol: parsed.protocol,
    headers: {
      'Accept': 'application/json' // match the curl header
    }
  }

  const req = https.get(opts, (res) => {
    const { statusCode, headers } = res

    // handle redirects (3xx)
    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      if (redirectsLeft <= 0) {
        callback(new Error('Too many redirects'))
        return
      }
      const nextUrl = urlModule.resolve(url, headers.location)
      res.resume() // discard current response
      fetch(nextUrl, redirectsLeft - 1, callback)
      return
    }

    // treat non-2xx as error
    if (statusCode < 200 || statusCode >= 300) {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        callback(new Error(`Failed to download: ${statusCode} ${res.statusMessage || ''}\n${body}`))
      })
      return
    }

    // success: collect data into a buffer (so we can detect YAML vs JSON and optionally convert)
    const chunks = []
    res.on('data', (chunk) => chunks.push(chunk))
    res.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const contentType = (headers['content-type'] || '').toLowerCase()
      callback(null, buffer, contentType)
    })
  })

  req.on('error', (err) => callback(err))
}

fetch(rawUrl, maxRedirects, async (err, buffer, contentType) => {
  if (err) return cleanupAndExit(3, 'Request error: ' + err.message)

  // If the server returned YAML (or not JSON), optionally convert to JSON
  const text = buffer.toString('utf8').trim()
  let out = text

  const looksLikeYaml = (
    contentType.includes('yaml') ||
    contentType.includes('yml') ||
    text.startsWith('---') ||
    (/^[\w-]+:\s/m).test(text) && !text.startsWith('{') // heuristic
  )

  if (looksLikeYaml) {
    // try to convert using js-yaml if installed; otherwise just write raw response
    try {
      const yaml = require('js-yaml')
      const parsed = yaml.load(text)
      out = JSON.stringify(parsed, null, 2)
      console.log('Converted YAML → JSON')
    } catch (e) {
      console.warn('js-yaml not available or failed to parse YAML; writing raw response. To auto-convert, run: npm install js-yaml')
      out = text
    }
  }

  try {
    fs.writeFileSync(outPath, out, 'utf8')
    console.log('Saved', outPath)
  } catch (e) {
    cleanupAndExit(4, 'File write error: ' + e.message)
  }
})
