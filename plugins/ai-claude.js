import { chatWithMemory, clearMemory, rememberBotAiMessage } from '../lib/ai.js'

const THUMB_CLAUDE = 'https://files.catbox.moe/zjt0xe.jpg'

let handler = async (m, { conn, usedPrefix, command, text }) => {
  const chat = global.db?.data?.chats?.[m.chat]
  if (m.isGroup && chat && chat.fAis === false) {
    return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ inteligencia artificial ]* estan desactivados...` }, { quoted: m })
  }

  const quotedText = (m.quoted?.text || m.quoted?.caption || '').trim()
  const prompt = (text || '').trim() || quotedText

  if (!prompt) {
    return conn.sendMessage(
      m.chat,
      { text: `ᗢ Proporcione una petición para hablar con Claude AI.\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* Hola, explícame un tema paso a paso` },
      { quoted: m }
    )
  }

  const sessionKey = `claude:${m.chat}:${m.sender}`
  if (/^(reset|clear|limpiar|reiniciar)$/i.test(prompt)) {
    clearMemory(sessionKey)
    return conn.sendMessage(m.chat, { text: `🧹 Historial con Claude AI reiniciado.` }, { quoted: m })
  }

  await m.react('⏰').catch(() => {})
  await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})

  try {
    const { text: respuesta } = await chatWithMemory({
      sessionKey,
      prompt: (text || '').trim() || quotedText,
      quotedText: (text || '').trim() && quotedText && quotedText !== (text || '').trim() ? quotedText : '',
      mode: 'claude'
    })

    let sent
    try {
      sent = await conn.sendMessage(
        m.chat,
        {
          text: respuesta,
          contextInfo: {
            forwardingScore: 1,
            isForwarded: false,
            externalAdReply: {
              showAdAttribution: false,
              renderLargerThumbnail: false,
              title: 'Claude AI',
              body: global.botname || 'GokuBot',
              containsAutoReply: true,
              mediaType: 1,
              thumbnailUrl: THUMB_CLAUDE,
              sourceUrl: null
            }
          }
        },
        { quoted: m }
      )
    } catch {
      sent = await conn.sendMessage(m.chat, { text: respuesta }, { quoted: m })
    }

    rememberBotAiMessage(sent?.key?.id)
    await m.react('✅').catch(() => {})
  } catch (error) {
    await m.react('❌').catch(() => {})
    await conn.sendMessage(m.chat, { text: `❌ No se pudo conectar con Claude AI.\n> ${error?.message || error}` }, { quoted: m })
  }
}

handler.command = ['claude']
handler.tags = ['ia']
export default handler
