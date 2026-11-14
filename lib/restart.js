import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export const STATE_FILE = path.join(process.cwd(), '.restart-state.json')
export const LOG_FILE = 'restart.log'

const sleep = ms => new Promise(r => setTimeout(r, ms))

const has = (env, key) => env[key] !== undefined && env[key] !== ''

/**
 * Detecta cómo debe reiniciarse el proceso según el entorno donde corre el bot.
 * Devuelve { mode: 'pm2' | 'spawn' | 'exit', reason }
 */
export function detectMode(env = process.env, opts = {}) {
  const ppid = opts.ppid ?? process.ppid

  if (has(env, 'GOKUBOT_RESTART_MODE')) {
    const forced = String(env.GOKUBOT_RESTART_MODE).toLowerCase()
    if (['pm2', 'spawn', 'exit'].includes(forced))
      return { mode: forced, reason: 'forzado por GOKUBOT_RESTART_MODE' }
  }

  if (has(env, 'pm_id') || has(env, 'PM2_HOME') || has(env, 'pm_exec_path'))
    return { mode: 'pm2', reason: `PM2 detectado${has(env, 'pm_id') ? ` (id ${env.pm_id})` : ''}` }

  const paneles = [
    ['P_SERVER_UUID', 'Pterodactyl'],
    ['PTERODACTYL', 'Pterodactyl'],
    ['RAILWAY_ENVIRONMENT', 'Railway'],
    ['RENDER', 'Render'],
    ['FLY_APP_NAME', 'Fly.io'],
    ['DYNO', 'Heroku'],
    ['K_SERVICE', 'Kubernetes'],
    ['KOYEB_APP_NAME', 'Koyeb'],
    ['REPL_ID', 'Replit'],
    ['GLITCH_PROJECT_ID', 'Glitch'],
    ['SPACE_ID', 'HuggingFace Spaces']
  ]
  for (const [key, name] of paneles)
    if (has(env, key))
      return { mode: 'exit', reason: `${name} reinicia solo (auto-restart del panel)` }

  if (opts.isDocker ?? fs.existsSync('/.dockerenv'))
    return { mode: 'exit', reason: 'Docker detectado (restart policy del contenedor)' }

  if (ppid === 1)
    return { mode: 'exit', reason: 'Proceso lanzado por el panel/servicio (PID 1)' }

  return { mode: 'spawn', reason: 'Servidor propio: se relanza un proceso nuevo' }
}

/** Arranca un proceso nuevo del bot y deja que el actual muera */
function spawnSelf(env = process.env) {
  const args = process.argv.slice(2).map(a => `"${String(a).replace(/"/g, '')}"`).join(' ')
  const cmd = `sleep 2; exec "${process.execPath}" index.js ${args} >> ${LOG_FILE} 2>&1`
  const options = {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
    env: { ...env, GOKUBOT_RESPAWNED: '1' }
  }
  try {
    const child = spawn('/bin/sh', ['-c', cmd], options)
    child.unref()
    return true
  } catch {
    try {
      const child = spawn(process.execPath, ['index.js', ...process.argv.slice(2)], options)
      child.unref()
      return true
    } catch {
      return false
    }
  }
}

/**
 * Reinicia el bot. No vuelve a retornar si el reinicio se ejecuta
 * (el proceso termina con process.exit).
 */
export async function restartBot({ mode = 'auto', delay = 1500, env = process.env, logger = console } = {}) {
  const plan = mode === 'auto'
    ? detectMode(env)
    : { mode, reason: `método elegido: ${mode}` }

  if (env.GOKUBOT_TEST === '1') return plan

  await sleep(delay)

  try { if (global.db?.data) await global.db.write() } catch (e) { logger.error?.('[restart] db:', e?.message || e) }

  if (plan.mode === 'pm2') {
    const target = has(env, 'pm_id') ? String(env.pm_id) : 'all'
    try {
      const child = spawn('pm2', ['restart', target], { detached: true, stdio: 'ignore', env })
      child.unref()
    } catch (e) {
      logger.error?.('[restart] pm2:', e?.message || e)
    }
  } else if (plan.mode === 'spawn') {
    spawnSelf(env)
  }

  try { global.conn?.ws?.close?.() } catch {}
  await sleep(300)
  process.exit(0)
}

export function writeState(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)) } catch {}
}

export function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) } catch { return null }
}

export function clearState() {
  try { fs.unlinkSync(STATE_FILE) } catch {}
}

export const MODES = {
  auto: 'detecta el mejor método solo',
  pm2: 'usa pm2 restart (hosting con PM2)',
  spawn: 'abre un proceso nuevo del bot (VPS/Termux)',
  exit: 'solo cierra el proceso y el panel lo levanta'
}
