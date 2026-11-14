import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'minar',
    title: 'MINERÍA',
    emoji: '⛏️',
    cdMs: 5 * MS.m,
    item: 'pico',
    dangerChance: 10,
    waitTip: 'Mientras esperas puedes usar #talar, #pescar o #cazar.',
    loot: [
      { w: 26, text: '🪨 Picaste un rato y solo salió *piedra* común', coins: [120, 260], ticks: [3, 8] },
      { w: 22, text: '⚙️ Encontraste una veta de *hierro* oxidado', coins: [260, 460], ticks: [5, 12] },
      { w: 18, text: '🌕 Desenterraste un trozo de *plata* brillante', coins: [400, 650], ticks: [6, 15] },
      { w: 14, text: '🥇 ¡Veta de *oro* puro, Goku estaría orgulloso!', coins: [650, 950], ticks: [8, 20] },
      { w: 9, text: '💎 ¡Encontraste un *diamante* enorme!', coins: [950, 1500], ticks: [12, 26] },
      { w: 6, text: '🐉 Sentiste un *Ki ancestral* en la roca', coins: [1400, 2100], ticks: [20, 40] },
      { w: 5, text: '📦 Había un *cofre* enterrado con monedas viejas', coins: [800, 1300], ticks: [8, 18], inv: { cofre: 1 } }
    ],
    danger: [
      { w: 1, text: '💥 La cueva se derrumbó y pagaste al curandero', coins: [-300, -120] },
      { w: 1, text: '🔥 Una bolsa de lava te quemó el traje', coins: [-250, -100] },
      { w: 1, text: '🪨 Te cayó una roca en el pie, tuviste que descansar', coins: [-150, -60] }
    ]
  })
}

handler.help = ['minar']
handler.tags = ['economia']
handler.command = ['minar', 'mine', 'mina', 'mineria']

export default handler
