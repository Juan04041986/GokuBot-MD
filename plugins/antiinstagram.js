const igRegex = /(instagram\.com|instagr\.am|ig\.me)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (isAdmin) return // los admins sí pueden mandar links de Instagram
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat.antiinstagram) return // tienes que activarlo con .on antiinstagram

  if (m.text && igRegex.test(m.text)) {
    await conn.sendMessage(m.chat, { delete: m.key })
    return conn.sendMessage(m.chat, { 
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de Instagram en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
