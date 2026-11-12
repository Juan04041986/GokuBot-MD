import { generateImage } from '../lib/ai.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const chat = global.db?.data?.chats?.[m.chat]
  if (m.isGroup && chat && chat.fAis === false) {
    return conn.sendMessage(m.chat, { text: `📍  Los comandos de *[ inteligencia artificial ]* estan desactivados...` }, { quoted: m })
  }

  const prompt = (text || '').trim() || (m.quoted?.text || m.quoted?.caption || '').trim()
  if (!prompt) {
    return conn.sendMessage(
      m.chat,
      { text: `ᗢ Proporciona un texto para crear una imagen.\n\n\t⚶ Por ejemplo:\n*${usedPrefix + command}* Un caballo blanco corriendo bajo la luna` },
      { quoted: m }
    )
  }

  await m.react('⏰').catch(() => {})
  try {
    const res = await generateImage(prompt)
    const caption = `${global.botname || 'GokuBot'}\n> ${global.textbot || 'Imagen generada con IA'}`
    await conn.sendMessage(m.chat, { image: res.buffer, caption }, { quoted: m })
    await m.react('✅').catch(() => {})
  } catch (error) {
    await m.react('❌').catch(() => {})
    await conn.sendMessage(m.chat, { text: `❌ No se pudo generar la imagen.\n> ${error?.message || error}` }, { quoted: m })
  }
}

handler.command = ['imagina', 'dalle', 'iaimg', 'generarimg']
handler.tags = ['ia']
export default handler
