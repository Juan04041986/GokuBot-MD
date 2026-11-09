let handler = async (m, { conn, args, usedPrefix, command }) => {
let bot = global.db.data.settings[conn.user.jid] || {}
if (!bot) global.db.data.settings[conn.user.jid] = {}
bot = global.db.data.settings[conn.user.jid]

let opcion = (args[0] || '').toLowerCase()

if (opcion === 'on' || opcion === 'enable' || opcion === 'activar') {
  bot.fPrivado = true
  return conn.sendMessage(m.chat, { text: `*« 🐲 »* Antiprivado *ACTIVADO* ✅\n\nAhora todo el que le escriba al privado al bot y no sea owner/admin será bloqueado automático.` }, { quoted: m })
}

if (opcion === 'off' || opcion === 'disable' || opcion === 'desactivar') {
  bot.fPrivado = false
  return conn.sendMessage(m.chat, { text: `*« 🐲 »* Antiprivado *DESACTIVADO* ❌\n\nAhora cualquiera puede hablarle al privado al bot.` }, { quoted: m })
}

return conn.sendMessage(m.chat, { text: `*« 🐲 »* Antiprivado actualmente: *${bot.fPrivado ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}*\n\nUsa:\n*${usedPrefix + command} on* - para activar\n*${usedPrefix + command} off* - para desactivar` }, { quoted: m })
}

handler.command = ['antiprivado', 'antiprivate', 'antipv']
handler.tags = ['owner']
handler.rowner = true
export default handler
