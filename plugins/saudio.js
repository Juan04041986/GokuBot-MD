import { proto } from '@whiskeysockets/baileys'
import { randomBytes } from 'node:crypto'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const NOMBRE_BOT = 'GOKU-BOT'
const DURACION_AUDIO = 25
const TOPE_WEBP = 700 * 1024

const CARPETA_DISCO = path.join(process.cwd(), 'tmp')
const CARPETA_SISTEMA = os.tmpdir()
const CARPETA_RAM = '/dev/shm'

globalThis.__audioStickerSessions ??= new Map()
const sesiones = globalThis.__audioStickerSessions

// --- PARCHE PARA QUE WHATSAPP NO BORRE EL AUDIO ---
function modificarProto(p) {
    const M = p?.Message
    if (!M || M.__audioStickerPatchedV3) return
    if (M.StickerMessage) {
        const anterior = M.StickerMessage.encode
        M.StickerMessage.encode = function (mensaje, writer) {
            const audio = mensaje?.audioMessage
            if (audio && Object.prototype.hasOwnProperty.call(mensaje, 'audioMessage')) delete mensaje.audioMessage
            const w = anterior.call(this, mensaje, writer)
            if (audio && M.AudioMessage) {
                mensaje.audioMessage = audio
                M.AudioMessage.encode(audio, w.uint32(210).fork()).ldelim()
            }
            return w
        }
    }
    const anteriorMsg = M.encode
    M.encode = function (mensaje, writer) {
        const audioSticker = mensaje?.audioStickerMessage
        if (audioSticker) {
            delete mensaje.stickerMessage
            delete mensaje.audioStickerMessage
        }
        const w = anteriorMsg.call(this, mensaje, writer)
        if (audioSticker && M.FutureProofMessage) {
            mensaje.audioStickerMessage = audioSticker
            M.FutureProofMessage.encode(audioSticker, w.uint32(1074).fork()).ldelim()
        }
        return w
    }
    M.__audioStickerPatchedV3 = true
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Igual que tu play, si descargas está apagado en el grupo no jala
    if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
        return conn.sendMessage(m.chat, { text: `*« 🐲 »* Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
    }

    await modificarProto(proto)
    const clave = `${m.chat}:${m.sender}`

    // .saudio cancelar
    if (text?.toLowerCase().includes('cancelar')) {
        sesiones.delete(clave)
        return conn.sendMessage(m.chat, { text: `Sesión cancelada 🐲` }, { quoted: m })
    }

    const quoted = m.quoted || m
    const mime = (quoted.mimetype || quoted.msg?.mimetype || '').toLowerCase()

    // Si no hay nada citado, avisa como tu play
    if (!m.quoted) return conn.sendMessage(m.chat, { text: `ꕤ Responde a una foto o video con\n*${usedPrefix + command}* para hacer sticker con sonido` }, { quoted: m })

    try {
        await m.react('🎧')

        // 1. Bajar la imagen / video citado
        const buffer = await quoted.download()
        if (!buffer) throw new Error('No pude bajar la imagen')

        // 2. Convertir a webp 512x512 con ffmpeg
        const tmpDir = CARPETA_DISCO
        await fs.mkdir(tmpDir, { recursive: true })
        const id = randomBytes(4).toString('hex')
        const entrada = path.join(tmpDir, `saudio-${id}`)
        const salidaWebp = path.join(tmpDir, `saudio-${id}.webp`)
        await fs.writeFile(entrada, buffer)

        await execFileAsync('ffmpeg', ['-y', '-i', entrada, '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000', '-t', '7', salidaWebp])

        const webp = await fs.readFile(salidaWebp)

        // 3. Si el citado es video, sacar su audio. Si es foto, esperar audio 60s
        // Aquí lo dejamos simple: si es video, usa su audio. Si es foto, guarda sesión
        if (mime.includes('video')) {
            // Sacar audio del video y mandarlo pegado
            const salidaAudio = path.join(tmpDir, `saudio-${id}.ogg`)
            await execFileAsync('ffmpeg', ['-y', '-i', entrada, '-t', String(DURACION_AUDIO), '-vn', '-c:a', 'libopus', salidaAudio])
            const audioBuf = await fs.readFile(salidaAudio)

            // Enviar sticker con audio pegado (campo 1074)
            await conn.sendMessage(m.chat, {
                audioStickerMessage: {
                    message: {
                        stickerMessage: {
                            url: '', fileSha256: Buffer.alloc(32), fileEncSha256: Buffer.alloc(32),
                            mediaKey: Buffer.alloc(32), mimetype: 'image/webp',
                            isAnimated: true, isAvatar: false,
                            audioMessage: { url: '', mimetype: 'audio/ogg; codecs=opus', seconds: 10, ptt: false, mediaKey: Buffer.alloc(32), fileSha256: Buffer.alloc(32), fileEncSha256: Buffer.alloc(32), directPath: '' }
                        }
                    }
                },
                // Baileys necesita el buffer real, por eso lo mandamos con prepare
                sticker: webp
            }, { quoted: m }).catch(async () => {
                // Fallback: manda sticker y audio por separado si el parche falla
                await conn.sendMessage(m.chat, { sticker: webp }, { quoted: m })
                await conn.sendMessage(m.chat, { audio: audioBuf, mimetype: 'audio/ogg; codecs=opus' }, { quoted: m })
            })

            await fs.unlink(entrada).catch(() => {})
            await fs.unlink(salidaWebp).catch(() => {})
            await fs.unlink(salidaAudio).catch(() => {})
            await m.react('✅')
            return
        }

        // Es foto: guarda sesión 60s y espera audio
        sesiones.set(clave, { webp, timer: setTimeout(() => sesiones.delete(clave), 60000) })
        return conn.sendMessage(m.chat, { text: `*Foto guardada* 🐲\nAhora manda el audio en los próximos 60 segundos y te lo pego al sticker.` }, { quoted: m })

    } catch (e) {
        console.log('[SAUDIO ERROR]', e?.message)
        await m.react('❌')
        await conn.sendMessage(m.chat, { text: `❌ Error al crear saudio, intenta de nuevo` }, { quoted: m })
    }
}

// --- ESTO ES LO QUE TE FALTABA ---
handler.command = ['saudio', 's2']
handler.tags = ['sticker']
handler.help = ['saudio']
export default handler
