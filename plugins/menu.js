import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix }) => {
let menu = `
╭───〔 *🐉 GOKU BOT* 〕───╮
│ 👤 Usuario: @${m.sender.split('@')[0]}
│ 📌 Prefijo: ${usedPrefix}
╰──────────────────╯

*╭─「 INFO 」*
│ ➤ ${usedPrefix}ping
│ ➤ ${usedPrefix}estado
│ ➤ ${usedPrefix}grupos
│ ➤ ${usedPrefix}canal
│ ➤ ${usedPrefix}restart
*╰────────────*

*╭─「 DRAGON BALL 」*
│ ➤ ${usedPrefix}biografiagoku
│ ➤ ${usedPrefix}biografiavegeta
│ ➤ ${usedPrefix}biografiagohan
│ ➤ ${usedPrefix}biografiafreezer
│ ➤ ${usedPrefix}noticiasdragonball
*╰────────────*

*╭─「 DESCARGAS 」*
│ ➤ ${usedPrefix}play <texto>
│ ➤ ${usedPrefix}ytmp3 <link>
│ ➤ ${usedPrefix}ytmp4 <link>
│ ➤ ${usedPrefix}tiktok <link>
│ ➤ ${usedPrefix}instagram <link>
│ ➤ ${usedPrefix}facebook <link>
│ ➤ ${usedPrefix}spotify <link>
*╰────────────*

*╭─「 BUSQUEDAS 」*
│ ➤ ${usedPrefix}google <texto>
│ ➤ ${usedPrefix}imagen <texto>
│ ➤ ${usedPrefix}yts <texto>
*╰────────────*

*╭─「 GRUPOS 」*
│ ➤ ${usedPrefix}link
│ ➤ ${usedPrefix}invocar <texto>
│ ➤ ${usedPrefix}kick @user
│ ➤ ${usedPrefix}add <numero>
*╰────────────*

*╭─「 IA & CHATBOT 」*
│ ➤ ${usedPrefix}chatgpt <texto>
│ ➤ ${usedPrefix}ia <texto>
│ ➤ ${usedPrefix}claude <texto>
│ ➤ ${usedPrefix}dolphin <texto>
│ ➤ ${usedPrefix}imagina <texto>
│ ➤ ${usedPrefix}voz <texto>=<voz>
│ ➤ ${usedPrefix}bot <texto>
│ ➤ ${usedPrefix}chatbot on/off
*╰────────────*

*╭─「 ECONOMÍA 」*
│ ➤ ${usedPrefix}eco
│ ➤ ${usedPrefix}coins
│ ➤ ${usedPrefix}diario
│ ➤ ${usedPrefix}trabajar
│ ➤ ${usedPrefix}minar
│ ➤ ${usedPrefix}talar
│ ➤ ${usedPrefix}pescar
│ ➤ ${usedPrefix}cazar
│ ➤ ${usedPrefix}slut
│ ➤ ${usedPrefix}crimen
│ ➤ ${usedPrefix}robar @user
│ ➤ ${usedPrefix}cofre
│ ➤ ${usedPrefix}slot <apuesta>
│ ➤ ${usedPrefix}apostar <cant> <op>
│ ➤ ${usedPrefix}banco
│ ➤ ${usedPrefix}pagar <cant> @user
│ ➤ ${usedPrefix}topcoins
│ ➤ ${usedPrefix}tienda
*╰────────────*

> *Goku Bot 🐉*
`.trim()

const portadas = [global.gokuMenu, global.gokuImg, 'https://i.ibb.co/6P4gKQ0/goku.jpg'].filter(Boolean)
for (const url of portadas) {
  try {
    const res = await fetch(url)
    if (!res.ok) continue
    const img = Buffer.from(await res.arrayBuffer())
    if (img.length < 1000) continue
    return conn.sendMessage(m.chat, { image: img, caption: menu, mentions: [m.sender] }, { quoted: m })
  } catch {}
}
await conn.sendMessage(m.chat, { text: menu, mentions: [m.sender] }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menú', 'menus']
export default handler
