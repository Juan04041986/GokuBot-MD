const ttRegex = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (isAdmin) return // los admins sí pueden mandar links de TikTok
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat.antitiktok) return // tienes que activarlo con .on antitiktok

  if (m.text && ttRegex.test(m.text)) {
    await conn.sendMessage(m.chat, { delete: m.key })
    return conn.sendMessage(m.chat, { 
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de TikTok en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
