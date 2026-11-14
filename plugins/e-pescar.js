import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'pescar',
    title: 'PESCA',
    emoji: '🎣',
    cdMs: 4 * MS.m,
    item: 'cana',
    dangerChance: 9,
    waitTip: 'Con una *caña* comprada en la #tienda pescas más monedas.',
    loot: [
      { w: 24, text: '🥾 Sacaste una *bota vieja*... al menos huele a dinero', coins: [80, 200], ticks: [2, 7] },
      { w: 22, text: '🐟 Pescaste una *sardina* pequeñita', coins: [200, 380], ticks: [4, 10] },
      { w: 18, text: '🐠 ¡Un *pez tropical* de colores!', coins: [380, 620], ticks: [6, 14] },
      { w: 14, text: '🍣 Pescaste un *salmón* gigante del Lago de Gohan', coins: [620, 950], ticks: [8, 18] },
      { w: 10, text: '🦈 ¡Un *tiburón*! Lo vendiste carísimo', coins: [950, 1500], ticks: [12, 26] },
      { w: 7, text: '🐉 ¡Era un *Dragón de agua*! Casi te arrastra al lago', coins: [1500, 2400], ticks: [20, 45] },
      { w: 5, text: '💍 Sacaste un *anillo* que alguien perdió en el lago', coins: [800, 1300], ticks: [8, 16], inv: { cofre: 1 } }
    ],
    danger: [
      { w: 1, text: '🌊 Una ola te arrastró y perdiste tus cosas', coins: [-300, -100] },
      { w: 1, text: '🦑 Un calamar te robó la carnada (y unas monedas)', coins: [-200, -80] },
      { w: 1, text: '🪝 Se te enganchó el anzuelo en la ropa, fuiste al médico', coins: [-180, -60] }
    ]
  })
}

handler.help = ['pescar']
handler.tags = ['economia']
handler.command = ['pescar', 'pesca', 'fish', 'pescado']

export default handler
