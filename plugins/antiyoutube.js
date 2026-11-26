const ytRegex = /(youtube\.com|youtu\.be|m\.youtube\.com|youtube-nocookie\.com)/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (!isBotAdmin) return

  let chat = global.db.data.chats[m.chat]
  if (!chat.antiyoutube) return // tienes que activarlo con .on antiyoutube

  if (m.text && ytRegex.test(m.text)) {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: m.fromMe,
        id: m.key.id,
        participant: m.sender
      }
    })
    return conn.sendMessage(m.chat, { 
      text: `🚫 @${m.sender.split('@')[0]} No se permiten links de YouTube en este grupo.`, 
      mentions: [m.sender] 
    })
  }
}
