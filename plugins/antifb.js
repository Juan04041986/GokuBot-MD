const fbRegex = /(facebook\.com|fb\.com|fb\.watch|fb\.gg|m\.facebook\.com)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat.antifb) return // tienes que activarlo con .on antifb

  if (fbRegex.test(m.text)) {
    await conn.sendMessage(m.chat, { delete: m.key })
    return conn.sendMessage(m.chat, { 
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de Facebook en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
