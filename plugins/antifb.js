const fbRegex = /(facebook\.com|fb\.com|fb\.watch|fb\.gg|m\.facebook\.com)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat.antifb) return // tienes que activarlo con .on antifb

  if (m.text && fbRegex.test(m.text)) {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: m.fromMe,
        id: m.key.id,
        participant: m.sender
      }
    })
    return conn.sendMessage(m.chat, { 
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de Facebook en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
