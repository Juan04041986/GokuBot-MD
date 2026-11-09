let handler = async (m, { conn }) => {
let copy = '.menu'

await conn.sendMessage(m.chat, {
  text: 'Toca para copiar',
  footer: 'Goku Bot',
  interactiveMessage: {
    body: { text: 'Toca para copiar' },
    footer: { text: 'Goku Bot' },
    header: { title: '', subtitle: '', hasMediaAttachment: false },
    nativeFlowMessage: {
      buttons: [
        {
          name: 'cta_copy',
          buttonParamsJson: JSON.stringify({
            display_text: 'Copiar',
            id: 'copy1',
            copy_code: copy
          })
        }
      ]
    }
  }
}, { quoted: m })
}

handler.help = ['copy']
handler.tags = ['main']
handler.command = ['copy']
export default handler
