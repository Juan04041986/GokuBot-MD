import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'slut',
    title: 'CLUB NOCTURNO',
    emoji: '💃',
    cdMs: 25 * MS.m,
    dangerChance: 16,
    waitTip: 'Trabajo nocturno: paga bien, pero no siempre sale perfecto.',
    loot: [
      { w: 24, text: '💃 Bailaste toda la noche en el *Club Cápsula*', coins: [300, 600], ticks: [4, 12] },
      { w: 20, text: '🎶 Hiciste un *show privado* y el público aplaudió', coins: [600, 950], ticks: [6, 16] },
      { w: 16, text: '🍾 Un cliente *generoso* te dejó una propina enorme', coins: [950, 1400], ticks: [10, 22] },
      { w: 14, text: '🌟 Fuiste la *estrella de la noche* en el club de Satán City', coins: [1300, 1900], ticks: [14, 30] },
      { w: 10, text: '👑 El dueño te nombró *bailarín/a del mes* con bonus', coins: [1800, 2600], ticks: [20, 42] },
      { w: 8, text: '🎭 Te contrataron para una *fiesta VIP* de ricachones', coins: [2200, 3200], ticks: [25, 50] },
      { w: 8, text: '🕺 Un *famoso* te pidió un baile y pagó el triple', coins: [1500, 2400], ticks: [18, 36], inv: { cofre: 1 } }
    ],
    danger: [
      { w: 1, text: '😾 Un cliente tacaño *no te pagó* y encima te insultó', coins: [-300, -100] },
      { w: 1, text: '📸 Te tomaron una foto y tuviste que *negociar* para borrarla', coins: [-400, -150] },
      { w: 1, text: '🚨 Cayó una *redada* y pagaste la multa', coins: [-600, -200] },
      { w: 1, text: '👠 Te torciste el tobillo en pleno show, gastos médicos', coins: [-250, -80] }
    ]
  })
}

handler.help = ['slut']
handler.tags = ['economia']
handler.command = ['slut', 'striptease', 'club', 'clubnocturno']

export default handler
