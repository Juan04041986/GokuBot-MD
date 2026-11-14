import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'talar',
    title: 'TALAR',
    emoji: '🪓',
    cdMs: 5 * MS.m,
    item: 'hacha',
    dangerChance: 10,
    waitTip: 'Compra una #motosierra en la tienda... o sea, #comprar hacha.',
    loot: [
      { w: 26, text: '🌿 Solo juntaste *ramitas* secas', coins: [110, 250], ticks: [3, 8] },
      { w: 22, text: '🪵 Cortaste un *tronco* de pino', coins: [250, 430], ticks: [5, 12] },
      { w: 18, text: '🌳 Un *roble* gigante cayó y lo vendiste', coins: [420, 660], ticks: [6, 15] },
      { w: 14, text: '🪵 Conseguiste *madera de ébano*, muy cotizada', coins: [660, 980], ticks: [8, 20] },
      { w: 9, text: '🌲 Talaste un *árbol ancestral* del Bosque de Korin', coins: [980, 1550], ticks: [12, 26] },
      { w: 6, text: '🍃 El *Árbol Sagrado* te regaló su bendición', coins: [1500, 2200], ticks: [20, 40] },
      { w: 5, text: '🐝 En el tronco había un *panal* con miel de valor', coins: [700, 1200], ticks: [8, 16], inv: { cofre: 1 } }
    ],
    danger: [
      { w: 1, text: '🪚 Se te rompió el hacha y tuviste que comprar otra', coins: [-280, -120] },
      { w: 1, text: '🐍 Una serpiente te asustó y caíste del árbol', coins: [-220, -90] },
      { w: 1, text: '🌩️ Un rayo partió el árbol encima tuyo... qué mala suerte', coins: [-180, -70] }
    ]
  })
}

handler.help = ['talar']
handler.tags = ['economia']
handler.command = ['talar', 'chop', 'hachazo', 'madera']

export default handler
