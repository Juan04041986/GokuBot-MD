// ===== AUTOREAD TODO EN UNO =====

export async function before(m, { conn }) {
if (!m.message) return true
if (m.isBaileys && m.fromMe) return false

// Si está activado, marca como leído
try {
  const bot = global.db.data.settings[conn.user.jid] || {}
  if (bot.autoRead && m.key) {
    await conn.readMessages([m.key])
  }
} catch (e) {}
return false
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
// Chequeo de owner manual, para que si te lea el config
let senderNum = m.sender.replace(/[^0-9]/g, '')
let owners = global.owner || []
if (typeof owners === 'string') owners = [owners]
let esOwner = false
for (let o of owners) {
  let num = Array.isArray(o) ? String(o[0]) : String(o.number || o.jid || o)
  if (num.replace(/[^0-9]/g, '') === senderNum) esOwner = true
}
if (!esOwner) return conn.sendMessage(m.chat, { text: `㊙️ No puedes usar este comando... solo owner.` }, { quoted: m })

if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {}
let bot = global.db.data.settings[conn.user.jid]
let opcion = (args[0] || '').toLowerCase()

if (opcion === 'on' || opcion === 'activar') {
  bot.autoRead = true
  return conn.sendMessage(m.chat, { text: `*« 👀 »* Autoread *ACTIVADO* ✅\n\nAhora el bot marca como leído todos los mensajes que le llegan, al toque te sale el check azul.` }, { quoted: m })
}

if (opcion === 'off' || opcion === 'desactivar') {
  bot.autoRead = false
  return conn.sendMessage(m.chat, { text: `*« 👀 »* Autoread *DESACTIVADO* ❌\n\nYa no va a marcar como leído.` }, { quoted: m })
}

return conn.sendMessage(m.chat, { text: `*« 👀 »* Autoread actualmente: *${bot.autoRead ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}*\n\nUsa:\n*${usedPrefix + command} on* - para activar\n*${usedPrefix + command} off* - para desactivar` }, { quoted: m })
}

handler.command = ['autoread', 'autoleido', 'leido']
handler.tags = ['owner']
export default handler
