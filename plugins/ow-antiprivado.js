// Chequeo de owner que si lee el config, en cualquier formato
function esOwner(m, conn) {
  let senderNum = m.sender.replace(/[^0-9]/g, '')
  let owners = global.owner || []

  // Si en tu config está como: global.owner = [['51999999999', 'Goku', true]]
  // o como: global.owner = ['51999999999']
  // o como: global.owner = '51999999999'
  if (typeof owners === 'string') owners = [owners]
  if (!Array.isArray(owners)) owners = [owners]

  for (let o of owners) {
    let num = ''
    if (Array.isArray(o)) num = String(o[0])
    else if (typeof o === 'object' && o !== null) num = String(o.number || o.jid || '')
    else num = String(o)
    num = num.replace(/[^0-9]/g, '')
    if (num && num === senderNum) return true
  }

  // También revisa si el bot lo tiene guardado como owner en la DB
  if (global.db?.data?.users?.[m.sender]?.role === 'owner') return true
  if (m.sender === conn.user?.jid) return true

  return false
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
if (!esOwner(m, conn)) {
  return conn.sendMessage(m.chat, { text: `㊙️ No eres owner bro.\nTu número: ${m.sender}\nOwners en config: ${JSON.stringify(global.owner)}` }, { quoted: m })
}

let bot = global.db.data.settings[conn.user.jid] || {}
if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {}
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
// OJO: ya no uso handler.rowner = true, porque ese es el que no lee tu config
handler.rowner = false
handler.owner = false
handler.admin = false
export default handler
