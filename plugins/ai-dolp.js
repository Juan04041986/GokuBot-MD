import { chatWithMemory, clearMemory, rememberBotAiMessage } from '../lib/ai.js'

let handler = async (m, { conn, usedPrefix, command, text }) => {
  const chat = global.db?.data?.chats?.[m.chat]
  if (m.isGroup && chat && chat.fAis === false) {
    return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ inteligencia artificial ]* estan desactivados...` }, { quoted: m })
  }

  const quotedText = (m.quoted?.text || m.quoted?.caption || '').trim()
  const trimmed = (text || '').trim()
  const prompt = trimmed || quotedText

  if (!prompt) {
    return conn.sendMessage(
      m.chat,
      { text: `ᗢ Proporcione una petición para hablar con Dolphin AI.\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* Hola, dame ideas creativas` },
      { quoted: m }
    )
  }

  const sessionKey = `dolphin:${m.chat}:${m.sender}`
  if (/^(reset|clear|limpiar|reiniciar)$/i.test(prompt)) {
    clearMemory(sessionKey)
    return conn.sendMessage(m.chat, { text: `🧹 Historial con Dolphin AI reiniciado.` }, { quoted: m })
  }

  await m.react('⏰').catch(() => {})
  await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})

  try {
    const { text: respuesta } = await chatWithMemory({
      sessionKey,
      prompt: trimmed || quotedText,
      quotedText: trimmed && quotedText && quotedText !== trimmed ? quotedText : '',
      mode: 'dolphin'
    })

    const sent = await conn.sendMessage(m.chat, { text: respuesta }, { quoted: m })
    rememberBotAiMessage(sent?.key?.id)
    await m.react('✅').catch(() => {})
  } catch (error) {
    await m.react('❌').catch(() => {})
    await conn.sendMessage(m.chat, { text: `❌ No se pudo conectar con Dolphin AI.\n> ${error?.message || error}` }, { quoted: m })
  }
}

handler.command = ['dolphin', 'dolp']
handler.tags = ['ia']
export default handler
