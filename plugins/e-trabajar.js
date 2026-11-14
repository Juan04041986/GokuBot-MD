import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'trabajar',
    title: 'TRABAJO',
    emoji: '💼',
    cdMs: 30 * MS.m,
    dangerChance: 8,
    waitTip: 'El sueldo cambia según el trabajito que te toque.',
    loot: [
      { w: 22, text: '🍜 Repartiste *ramen* por toda la Ciudad del Oeste', coins: [260, 480], ticks: [4, 10] },
      { w: 20, text: '🏋️ Ayudaste a entrenar en el *Templo de Kami*', coins: [380, 620], ticks: [8, 18] },
      { w: 16, text: '🏢 Fuiste cajero de *Capsule Corp*, día tranquilo', coins: [500, 800], ticks: [10, 22] },
      { w: 14, text: '🧹 Limpiaste la *Torre de Karin* de arriba a abajo', coins: [420, 700], ticks: [8, 18] },
      { w: 12, text: '🐄 Cuidaste los animales de la granja de *Ox-Satán*', coins: [600, 950], ticks: [12, 26] },
      { w: 9, text: '🎤 Fuiste guía turístico en el *Torneo de Artes Marciales*', coins: [800, 1250], ticks: [15, 30] },
      { w: 7, text: '🚀 ¡Salvaste a un planeta entero y te pagaron la hazaña!', coins: [1500, 2400], ticks: [25, 50] }
    ],
    danger: [
      { w: 1, text: '😴 Te quedaste dormido y te descontaron del sueldo', coins: [-250, -80] },
      { w: 1, text: '🧾 Tuviste que pagar los platos que rompiste', coins: [-200, -60] },
      { w: 1, text: '💢 Un cliente se quejó con el jefe y te multaron', coins: [-300, -100] }
    ]
  })
}

handler.help = ['trabajar']
handler.tags = ['economia']
handler.command = ['trabajar', 'work', 'chamba', 'curro']

export default handler
