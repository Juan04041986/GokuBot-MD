import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, args }) => {
if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

try {
if (!args[0]) return conn.sendMessage(m.chat, { text: `ᗢ Proporcione un enlace de Facebook.\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* https://www.facebook.com/xxx` }, { quoted: m })
const url = args[0]
if (!url.match(/facebook\.com|fb\.watch|fb\.gg/)) return conn.sendMessage(m.chat, { text: `El enlace ingresado no es valido.` }, { quoted: m })
await m.react("⏰")

// API DELIRIUS - ya puesta
const apiUrl = `https://api.delirius.online/download/facebook?url=${encodeURIComponent(url)}`

const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30000)

const response = await fetch(apiUrl, { signal: controller.signal })
clearTimeout(timeout)

if (!response.ok) throw new Error(`Error en la API: ${response.status}`)

const data = await response.json()
console.log('Respuesta FB Delirius:', JSON.stringify(data)?.slice(0, 800))

if (!data.status) throw new Error('📍 La API no respondió correctamente')

// La API devuelve: data.list = [{ quality: "720p (HD)", url: "..." }]
let videoUrl = null
let videoTitle = 'Video de Facebook'

if (data.list && Array.isArray(data.list) && data.list.length > 0) {
  // Busca el de mejor calidad (720p HD primero, si no el primero)
  let best = data.list.find(v => v.quality?.includes('720')) || data.list.find(v => v.quality?.includes('HD')) || data.list[0]
  videoUrl = best?.url
} else if (data.result?.url) {
  videoUrl = data.result.url
} else if (data.url) {
  videoUrl = data.url
}

if (!videoUrl) throw new Error('📍 No se encontró URL del video en la respuesta')

await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption: `${botname}\n> ${textbot}` }, { quoted: m })
await m.react('✅')
} catch (error) {
console.error('Error FB:', error)
await conn.sendMessage(m.chat, { text: `❌ Error: ${error.message}` }, { quoted: m })
}
}

handler.command = ['fb', 'facebook']
handler.tags = ["descargas"]
export default handler
