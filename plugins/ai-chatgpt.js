import { chatWithMemory, clearMemory, rememberBotAiMessage } from '../lib/ai.js'

let handler = async (m, { conn, usedPrefix, command, text, isAdmin, isOwner, isROwner }) => {
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  const trimmed = (text || '').trim()
  if (/^(on|off|activar|desactivar)$/i.test(trimmed)) {
    if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
      return conn.sendMessage(m.chat, { text: global.fargs?.admins || '㊙️ *Solo administradores...*' }, { quoted: m })
    }
    const enable = /^(on|activar)$/i.test(trimmed)
    chat.fAis = enable
    return conn.sendMessage(
      m.chat,
      { text: `✅ Se ha *${enable ? 'activado' : 'desactivado'}* la inteligencia artificial en este chat.` },
      { quoted: m }
    )
  }

  if (m.isGroup && chat.fAis === false) {
    return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ inteligencia artificial ]* estan desactivados...` }, { quoted: m })
  }

  const quotedText = (m.quoted?.text || m.quoted?.caption || '').trim()
  const prompt = trimmed || quotedText

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
    const { text: respuesta } = await chatWithMemory({
      sessionKey,
      prompt: trimmed || quotedText,
      quotedText: trimmed && quotedText && quotedText !== trimmed ? quotedText : '',
      mode
    })

    const sent = await conn.sendMessage(m.chat, { text: respuesta }, { quoted: m })
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
