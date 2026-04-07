import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const R = 201, G = 107, B = 79  // #C96B4F

function createPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8; ihdrData[9] = 2; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0
  const ihdr = makeChunk('IHDR', ihdrData)
  const rowSize = 1 + width * 3
  const rawData = Buffer.alloc(rowSize * height)
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize
    rawData[offset] = 0
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3
      rawData[px] = R; rawData[px + 1] = G; rawData[px + 2] = B
    }
  }
  const compressed = zlib.deflateSync(rawData)
  const idat = makeChunk('IDAT', compressed)
  const iend = makeChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([signature, ihdr, idat, iend])
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcData), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) { c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0) }
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

mkdirSync(publicDir, { recursive: true })
const sizes = [
  { name: 'pwa-icon-192x192.png', w: 192, h: 192 },
  { name: 'pwa-icon-512x512.png', w: 512, h: 512 },
  { name: 'apple-touch-icon-180x180.png', w: 180, h: 180 },
  { name: 'favicon-32x32.png', w: 32, h: 32 },
]
for (const { name, w, h } of sizes) {
  const png = createPNG(w, h)
  writeFileSync(join(publicDir, name), png)
  console.log(`Created ${name} (${w}x${h}, ${png.length} bytes)`)
}
console.log('\nDone! Replace these placeholder icons with real brand assets before launch.')
