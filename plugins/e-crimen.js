import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'crimen',
    title: 'CRIMEN',
    emoji: '🕶️',
    cdMs: 40 * MS.m,
    dangerChance: 40,
    waitTip: 'Riesgo alto, recompensa alta. Si te atrapan, pagas la fianza.',
    loot: [
      { w: 22, text: '🏪 Atracaste un *minimarket* y escapaste en moto', coins: [600, 1200], ticks: [8, 20] },
      { w: 20, text: '💼 Robaste una *maleta* olvidada en la estación', coins: [1000, 1600], ticks: [10, 24] },
      { w: 16, text: '🚗 Desarmaste un *auto* y vendiste las piezas', coins: [1400, 2200], ticks: [12, 28] },
      { w: 14, text: '🏦 Asaltaste la *Capsule Corp* sin que nadie te viera', coins: [2200, 3200], ticks: [18, 40] },
      { w: 11, text: '💎 Entraste a una *joyería* y saliste con todo', coins: [3000, 4500], ticks: [25, 55] },
      { w: 9, text: '🚁 ¡Asalto perfecto a un *camión blindado*!', coins: [4200, 6500], ticks: [30, 70] },
      { w: 8, text: '🐉 Robaste una *Esfera del Dragón* a un coleccionista', coins: [2500, 4000], ticks: [22, 48], inv: { cofre: 1 } }
    ],
    danger: [
      { w: 1, text: '🚔 Te atrapó la *policía* y pagaste la fianza', coins: [-1200, -500] },
      { w: 1, text: '💥 La alarma sonó y tuviste que soltar el botín', coins: [-900, -400] },
      { w: 1, text: '🥊 El dueño era un maestro de artes marciales...', coins: [-1500, -600] },
      { w: 1, text: '📹 Te grabó una cámara y pagaste para que borren el video', coins: [-1000, -450] }
    ]
  })
}

handler.help = ['crimen']
handler.tags = ['economia']
handler.command = ['crimen', 'crime', 'atracar']

export default handler
