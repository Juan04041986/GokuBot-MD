import { chatWithMemory, clearMemory, rememberBotAiMessage } from '../lib/ai.js'

const THUMB_GPT = 'https://files.catbox.moe/3rhs2g.jpg'

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
      { text: `ᗢ Proporcione una petición para hablar con la IA.\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* Explica qué es un Super Saiyajin\n\n> Usa *${usedPrefix + command} limpiar* para reiniciar tu historial.` },
      { quoted: m }
    )
  }

  const sessionKey = `ia:${m.chat}:${m.sender}`
  if (/^(reset|clear|limpiar|reiniciar)$/i.test(prompt)) {
    clearMemory(sessionKey)
    return conn.sendMessage(m.chat, { text: `🧹 Historial de conversación con la IA reiniciado.` }, { quoted: m })
  }

  await m.react('⏰').catch(() => {})
  await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})

  try {
    const mode = command === 'gokuia' ? 'gokuia' : command === 'gemini' ? 'gemini' : 'chatgpt'
    const title = command === 'gokuia' ? 'GokuBot IA' : command === 'gemini' ? 'Gemini AI' : 'Chat GPT'
    const { text: respuesta } = await chatWithMemory({
      sessionKey,
      prompt: (text || '').trim() || quotedText,
      quotedText: (text || '').trim() && quotedText && quotedText !== (text || '').trim() ? quotedText : '',
      mode
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
              title,
              body: global.botname || 'GokuBot',
              containsAutoReply: true,
              mediaType: 1,
              thumbnailUrl: THUMB_GPT,
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
    await conn.sendMessage(m.chat, { text: `❌ No se pudo obtener respuesta de la IA.\n> ${error?.message || error}` }, { quoted: m })
  }
}

handler.command = ['chatgpt', 'gpt', 'ia', 'ai', 'gokuia', 'gemini']
handler.tags = ['ia']
export default handler
