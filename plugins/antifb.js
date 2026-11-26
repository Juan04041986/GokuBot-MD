const fbRegex = /(facebook\.com|fb\.com|fb\.watch|fb\.gg|m\.facebook\.com)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat.antifb) return // tienes que activarlo con .on antifb

  if (m.text && fbRegex.test(m.text)) {
    try {
      await conn.sendMessage(m.chat, {
        delete: m.fromMe
          ? { remoteJid: m.chat, fromMe: true, id: m.key.id }
          : { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant || m.sender }
      })
    } catch (e) {
      console.log('Error al eliminar mensaje:', e)
    }
    return conn.sendMessage(m.chat, { 
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de Facebook en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
