import os from 'os'
import { detectMode, restartBot, readState, clearState, writeState, MODES, LOG_FILE } from '../lib/restart.js'
import { panel, sign, fmt, human } from '../lib/economia.js'

const notifyReady = () => {
  const pending = readState()
  if (!pending?.chat) return
  const fresh = Date.now() - Number(pending.ts || 0) < 5 * 60 * 1000
  if (!fresh) return clearState()

  let tries = 0
  const timer = setInterval(async () => {
    tries++
    try {
      const sock = global.conn
      const ready = sock && sock.user?.id && sock.ws?.socket?.readyState === 1
      if (ready) {
        clearInterval(timer)
        clearState()
        await new Promise(r => setTimeout(r, 2000))
        const up = Math.max(1, Math.round((Date.now() - Number(pending.ts || Date.now())) / 1000))
        await sock.sendMessage(pending.chat, {
          text: panel('✅ BOT EN LÍNEA', [
            '🔄 Reinicio completado con éxito.',
            '',
            `⏱️ *Tiempo de arranque:* ${up}s`,
            `📦 *Versión:* v${global.vs?.replace(/[^0-9.]/g, '') || '2.5.6'}`,
            `🌐 *Cuenta:* ${String(sock.user.id).split(':')[0]}`,
            `🖥️ *Host:* ${os.hostname()}`,
            '',
            '🐉 GokuBot listo para pelear de nuevo.'
          ], sign())
        }).catch(() => {})
      }
    } catch {}
    if (tries >= 60) {
      clearInterval(timer)
      clearState()
    }
  }, 3000)
  if (timer.unref) timer.unref()
}

notifyReady()

let handler = async (m, { conn, args, command, usedPrefix, isROwner, isOwner }) => {
  const num = String(m.sender).replace(/[^0-9]/g, '').slice(-9)
  const owners = (global.owner || []).map(o => String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '').slice(-9))
  const isDev = isROwner || isOwner || m.fromMe || owners.includes(num)

  if (!isDev) return global.dfail('owner', m, conn)

  const sub = (args[0] || '').toLowerCase()
  const plan = detectMode()

  if (sub && sub !== 'info' && !Object.keys(MODES).includes(sub)) {
    return conn.sendMessage(m.chat, {
      text: panel('🔄 REINICIAR', [
        `📍 El método *${sub}* no existe.`,
        '',
        '*⚶ Métodos disponibles:*',
        ...Object.entries(MODES).map(([k, v]) => `⧡ *${usedPrefix + command} ${k}* — ${v}`),
        '',
        `💡 Por defecto: *${usedPrefix + command}* (auto)`
      ], sign())
    }, { quoted: m })
  }

  if (sub === 'info') {
    return conn.sendMessage(m.chat, {
      text: panel('🔄 REINICIO', [
        `👤 *Owner:* @${String(m.sender).split('@')[0]}`,
        `🧩 *Método detectado:* ${plan.mode}`,
        `🧠 *Motivo:* ${plan.reason}`,
        `⏱️ *Activo desde:* ${human(process.uptime() * 1000)}`,
        `🌐 *Cuenta:* ${String(conn.user?.id || conn.user?.jid || 'desconocida').split(':')[0]}`,
        `🖥️ *Host:* ${os.hostname()}`,
        `📦 *Node:* ${process.version}`,
        '',
        '*⚶ Métodos:*',
        ...Object.entries(MODES).map(([k, v]) => `⧡ *${usedPrefix + command} ${k}* — ${v}`)
      ], sign()),
      mentions: [m.sender]
    }, { quoted: m })
  }

  const chosen = sub || 'auto'
  const finalPlan = chosen === 'auto' ? plan : { mode: chosen, reason: MODES[chosen] }
  const p = usedPrefix

  writeState({ chat: m.chat, by: m.sender, mode: finalPlan.mode, ts: Date.now() })

  await conn.sendMessage(m.chat, {
    text: panel('🔄 REINICIANDO', [
      `👤 *Owner:* @${String(m.sender).split('@')[0]}`,
      `🧩 *Método:* ${finalPlan.mode}`,
      `🧠 *Detalle:* ${finalPlan.reason}`,
      `⏱️ *Activo desde:* ${human(process.uptime() * 1000)}`,
      `🌐 *Cuenta:* ${String(conn.user?.id || conn.user?.jid || 'desconocida').split(':')[0]}`,
      `🖥️ *Host:* ${os.hostname()}`,
      `📦 *RAM usada:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)} MB`,
      '',
      '⚙️ Guardando datos y cerrando sesión...',
      '📲 El bot vuelve en unos segundos.',
      '',
      `💡 Si no vuelve: *${p + command} exit* desde el panel`,
      `📄 Revisa la consola o el archivo *${LOG_FILE}*`
    ], sign()),
    mentions: [m.sender]
  }, { quoted: m })

  try { await m.react?.('🔄') } catch {}

  await restartBot({ mode: finalPlan.mode })
}

handler.help = ['restart [auto|pm2|spawn|exit]']
handler.tags = ['main']
handler.command = ['restart', 'reiniciar', 'reinicio', 'reboot', 'restartbot']

export default handler
