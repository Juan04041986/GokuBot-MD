import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, usedPrefix, command, text }) => {
if (!global.db.data.chats[m.chat].fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `📍 Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

if (!text) return conn.sendMessage(m.chat, { text: `Ejemplo: *${usedPrefix + command}* Yan Block - 444` }, { quoted: m })

try {
await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
await conn.sendMessage(m.chat, { text: `⏳ Descargando tu audio, espera...` }, { quoted: m })

let url = text
if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
let search = await yts(text)
if (!search.videos.length) return conn.sendMessage(m.chat, { text: 'No se encontró el audio.' }, { quoted: m })
url = search.videos[0].url
}

console.log('URL A DESCARGAR:', url)

// Intento 1: Delirius ytmp4 (el que jalaba)
let data = null
try {
let api = await fetch(`https://api.delirius.online/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`)
let json = await api.json()
data = json.data
console.log('INTENTO 1:', data?.download ? 'OK' : 'FALLO')
} catch (e) { console.log('INTENTO 1 ERROR:', e.message) }

// Intento 2: Si el 1 falla, intenta con ytmp3
if (!data?.download) {
try {
let api2 = await fetch(`https://api.delirius.online/download/ytmp3?url=${encodeURIComponent(url)}`)
let json2 = await api2.json()
data = json2.data
console.log('INTENTO 2:', data?.download ? 'OK' : 'FALLO')
} catch (e) { console.log('INTENTO 2 ERROR:', e.message) }
}

if (!data?.download) return conn.sendMessage(m.chat, { text: '❌ La API de Delirius está caída ahorita. Intenta en 1 min.' }, { quoted: m })

let res = await fetch(data.download, {
headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
})
let buffer = Buffer.from(await res.arrayBuffer())
console.log('PESO:', buffer.length)

if (buffer.length < 500000) return conn.sendMessage(m.chat, { text: '❌ Me dio archivo corrupto, intenta de nuevo.' }, { quoted: m })

let thumb = null
try {
let img = await fetch(data.image)
thumb = Buffer.from(await img.arrayBuffer())
} catch {}

await conn.sendMessage(m.chat, {
audio: buffer,
mimetype: 'audio/mpeg',
fileName: `${data.title}.mp3`,
ptt: false,
contextInfo: {
externalAdReply: {
title: data.title,
body: `Autor: ${data.author} | GokuBot`,
thumbnail: thumb,
mediaType: 2,
mediaUrl: url,
sourceUrl: url,
renderLargerThumbnail: true
}
}
}, { quoted: m })

} catch (e) {
console.log('ERROR YTMP3:', e)
await conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}\nMira la consola del panel para ver el error completo.` }, { quoted: m })
}
}

handler.command = ['audio', 'ytmp3']
export default handler
