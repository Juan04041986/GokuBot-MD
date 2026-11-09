export async function before(m, { conn, isAdmin, isBotAdmin, isROwner, isOwner }) {
if (m.isBaileys && m.fromMe) return true
if (m.isGroup) return false
if (!m.message) return true
if (m.sender === conn.user?.jid) return

if (m.text.includes('PIEDRA') || m.text.includes('PAPEL') || m.text.includes('TIJERA') || m.text.includes('code') || m.text.includes('qr')) return true

const chat = global.db.data.chats[m.chat]
const bot = global.db.data.settings[conn.user.jid] || {}

// --- NO BLOQUEAR A OWNER NI ADMIN ---
// isROwner = owner principal
// isOwner = owner agregado en config
// isAdmin = admin del bot / admin
if (isROwner || isOwner || isAdmin) return false

// Extra: por si tu bot guarda los owners en global.owner
const owners = (global.owner || []).map(v => {
  let num = Array.isArray(v) ? v[0] : v
  return String(num).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
})
if (owners.includes(m.sender)) return false

let mensajito = `📍  Hola usuario @${m.sender.split`@`[0]}
- No puedes hablar individualmente con el bot.

💪🏻 Te sugerimos que uses el bot en un chat grupal, sea alojado o principal.

Gracias por leer.`

if (m.chat === '120363402356085997@newsletter') return true

if (bot.fPrivado) {
await conn.sendMessage(m.chat, { text: mensajito, mentions: await conn.parseMention(mensajito) }, { quoted: m })
await conn.updateBlockStatus(m.chat, 'block')
}
return false
}
