import { runJob, MS } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  return runJob(m, { conn, usedPrefix, command }, {
    key: 'cazar',
    title: 'CAZA',
    emoji: '🏹',
    cdMs: 6 * MS.m,
    item: 'rifle',
    dangerChance: 14,
    waitTip: 'El *Rifle Kame* de la #tienda aumenta tus recompensas (+50%).',
    loot: [
      { w: 25, text: '🐗 Cazaste un *jabalí* cerca del Monte Paoz', coins: [220, 420], ticks: [4, 10] },
      { w: 22, text: '🦌 Un *venado* cayó con un solo tiro', coins: [420, 700], ticks: [6, 14] },
      { w: 18, text: '🐊 ¡Un *cocodrilo* del pantano! Buena venta', coins: [700, 1050], ticks: [8, 18] },
      { w: 14, text: '🐺 Cazaste un *lobo* solitario de la montaña', coins: [1050, 1400], ticks: [10, 22] },
      { w: 10, text: '🦖 ¡Un *dinosaurio* pequeño! Esto vale una fortuna', coins: [1400, 2000], ticks: [15, 32] },
      { w: 6, text: '🦅 Cazaste un *águila* del ejército de Freezer', coins: [1800, 2600], ticks: [20, 45] },
      { w: 5, text: '🐲 Encontraste un *nido de dragón* abandonado', coins: [900, 1500], ticks: [10, 20], inv: { cofre: 1 } }
    ],
    danger: [
      { w: 1, text: '🐻 Un *oso* te persiguió y perdiste tus provisiones', coins: [-350, -120] },
      { w: 1, text: '💢 La presa peleó de vuelta y saliste con moretones', coins: [-250, -100] },
      { w: 1, text: '🚔 Un guardabosques te multó por cazar sin permiso', coins: [-450, -150] }
    ]
  })
}

handler.help = ['cazar']
handler.tags = ['economia']
handler.command = ['cazar', 'caza', 'hunt', 'caceria']

export default handler
