import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

if (!text) return conn.sendMessage(m.chat, { text: `ᗢ Escribe lo que quieres buscar\n\n⚶ Por ejemplo:\n*${usedPrefix + command}* gatos\n*${usedPrefix + command}* Twice` }, { quoted: m })

try {
await m.react('⏰')

// API DELIRIUS PINTEREST SEARCH
const apiUrl = `https://api.delirius.online/search/pinterest?text=${encodeURIComponent(text)}`
const res = await fetch(apiUrl)
const data = await res.json()
console.log('Respuesta Pinterest:', JSON.stringify(data)?.slice(0, 500))

let results = data?.results || data?.result || data?.data || []

if (!Array.isArray(results) || results.length === 0) {
return conn.sendMessage(m.chat, { text: `❌ No encontré nada para: *${text}*` }, { quoted: m })
}

// WhatsApp solo permite 10 por álbum, agarramos las 10 primeras
let images = results.filter(u => typeof u === 'string' && u.startsWith('http')).slice(0, 10)

if (images.length === 0) return conn.sendMessage(m.chat, { text: `❌ No encontré imágenes para: *${text}*` }, { quoted: m })

// Mandar como ÁLBUM
try {
  // Primera foto con caption + album:true
  await conn.sendMessage(m.chat, {
    image: { url: images[0] },
    caption: `🐲 *Pinterest » ${text}*\n> Se encontraron *${images.length}* imágenes`,
    album: true
  }, { quoted: m })

  // Las demás fotos del álbum
  for (let i = 1; i < images.length; i++) {
    await conn.sendMessage(m.chat, {
      image: { url: images[i] },
      album: true
    })
  }
} catch (e) {
  // Si tu versión de Baileys no soporta album:true, manda una por una
  console.log('Album falló, mandando una por una:', e.message)
  for (let url of images) {
    await conn.sendMessage(m.chat, { image: { url } }, { quoted: m })
  }
}

await m.react('✅')

} catch (e) {
console.error('Error Pinterest:', e)
await conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m })
}
}

handler.command = ['pinterest', 'pin']
handler.tags = ["descargas"]
export default handler
