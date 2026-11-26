const ttRegex = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com|www\.tiktok\.com)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat?.antitiktok) return // tienes que activarlo con .on antitiktok

  const text = [
    m.text,
    m.msg?.caption,
    m.msg?.matchedText,
    m.msg?.canonicalUrl
  ].filter(Boolean).join(' ')

  if (text && ttRegex.test(text)) {
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
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de TikTok en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
