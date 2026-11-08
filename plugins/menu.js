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

*╭─「 IA 」*
│ ➤ ${usedPrefix}chatgpt <texto>
│ ➤ ${usedPrefix}imagina <texto>
*╰────────────*

*╭─「 RPG 」*
│ ➤ ${usedPrefix}minar
│ ➤ ${usedPrefix}talar
│ ➤ ${usedPrefix}cazar
│ ➤ ${usedPrefix}work
│ ➤ ${usedPrefix}coins
*╰────────────*

> *Goku Bot 🐉*
`.trim()

try {
  let res = await fetch('https://cdn.dev-ander.xyz/file/9xgopy.jpg ')
  let img = Buffer.from(await res.arrayBuffer())
  await conn.sendMessage(m.chat, { image: img, caption: menu, mentions: [m.sender] }, { quoted: m })
} catch {
  await conn.sendMessage(m.chat, { text: menu, mentions: [m.sender] }, { quoted: m })
}
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menú', 'menus']
export default handler
