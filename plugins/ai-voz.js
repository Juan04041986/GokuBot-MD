import { generateVoiceTTS, VOXBOX_VOICES } from '../lib/ai.js'

const handler = async (m, { text, conn, command, usedPrefix }) => {
  const chat = global.db?.data?.chats?.[m.chat]
  if (m.isGroup && chat && chat.fAis === false) {
    return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ inteligencia artificial ]* estan desactivados...` }, { quoted: m })
  }

  const quotedText = (m.quoted?.text || m.quoted?.caption || '').trim()
  const rawInput = (text || '').trim()
  const listado = `• es (Español)\n• toru (Elon Musk)\n• gura (Nahida)\n• onix (Optimus Prime)\n• ax (Eminem)`

  if (!rawInput && !quotedText) {
    return conn.sendMessage(
      m.chat,
      {
        text: `ᗢ Proporciona un texto y opcionalmente el tipo de voz.\n\n> Voces disponibles:\n${listado}\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* hola, como estas=toru\n*${usedPrefix + command}* hola amigos de GokuBot`
      },
      { quoted: m }
    )
  }

  let contenido = ''
  let modelo = 'es'

  if (rawInput.includes('=')) {
    const eqIdx = rawInput.lastIndexOf('=')
    contenido = rawInput.slice(0, eqIdx).trim() || quotedText
    modelo = rawInput.slice(eqIdx + 1).trim().toLowerCase() || 'es'
  } else {
    contenido = rawInput || quotedText
  }

  if (!contenido) {
    return conn.sendMessage(
      m.chat,
      { text: `ᗢ Falta el texto a convertir en audio.\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* hola amigos=toru` },
      { quoted: m }
    )
  }

  if (modelo !== 'es' && modelo !== 'en' && !VOXBOX_VOICES[modelo] && !['espanol', 'español', 'latino', 'narrador', 'goku', 'ingles', 'inglés'].includes(modelo)) {
    return conn.sendMessage(
      m.chat,
      { text: `📍 Voz *[ ${modelo} ]* no válida.\n\n> Voces disponibles:\n${listado}` },
      { quoted: m }
    )
  }

  await m.react('⏰').catch(() => {})
  await conn.sendPresenceUpdate('recording', m.chat).catch(() => {})

  try {
    const tts = await generateVoiceTTS(contenido, modelo)
    await conn.sendMessage(
      m.chat,
      {
        audio: tts.buffer,
        mimetype: tts.mimetype || 'audio/mpeg',
        ptt: false
      },
      { quoted: m }
    )
    await m.react('✅').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    await conn.sendMessage(m.chat, { text: `❌ No se pudo generar el audio.\n> ${e?.message || e}` }, { quoted: m })
  }
}

handler.command = ['voz', 'tts']
handler.tags = ['ia']
export default handler
