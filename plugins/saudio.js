import {
    prepareWAMessageMedia,
    proto,
    downloadMediaMessage,
    downloadContentFromMessage
} from '@whiskeysockets/baileys';
import { randomBytes } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const NOMBRE_BOT = 'GOKU-BOT';
const DURACION_STICKER = 7;
const DURACION_AUDIO = 25;
const TOPE_WEBP = 700 * 1024;
const SEGUNDOS_SESION = 60;

const SONDEO = ['-probesize', '50M', '-analyzeduration', '50M'];
const ESCALA_512 = 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,' +
    'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1';

const CARPETA_RAM = '/dev/shm';
const CARPETA_DISCO = path.join(process.cwd(), 'tmp');
const CARPETA_SISTEMA = os.tmpdir();

// ... TODA TU LÓGICA IGUAL, solo cambiamos esto de abajo ...

// En Goku el ffmpeg ya viene instalado, no necesitas asegurarFfmpeg()
const asegurarFfmpeg = async () => true;

// ---------- PARCHE PROTOBUF (igual que tu código) ----------
(globalThis).__audioStickerSessions ??= new Map();
const sesiones = (globalThis).__audioStickerSessions;

function modificarProto(p) {
    const M = p?.Message;
    if (!M || M.__audioStickerPatchedV3) return;
    if (M.StickerMessage) {
        const codificarStickerAnterior = M.StickerMessage.encode;
        M.StickerMessage.encode = function (mensaje, writer) {
            const audio = mensaje?.audioMessage;
            if (audio && Object.prototype.hasOwnProperty.call(mensaje, 'audioMessage')) {
                delete mensaje.audioMessage;
            }
            const w = codificarStickerAnterior.call(this, mensaje, writer);
            if (audio && M.AudioMessage) {
                mensaje.audioMessage = audio;
                M.AudioMessage.encode(audio, w.uint32(210).fork()).ldelim();
            }
            return w;
        };
    }
    const codificarMensajeAnterior = M.encode;
    M.encode = function (mensaje, writer) {
        const audioSticker = mensaje?.audioStickerMessage;
        if (audioSticker) {
            if (Object.prototype.hasOwnProperty.call(mensaje, 'stickerMessage')) delete mensaje.stickerMessage;
            if (Object.prototype.hasOwnProperty.call(mensaje, 'audioStickerMessage')) delete mensaje.audioStickerMessage;
        }
        const w = codificarMensajeAnterior.call(this, mensaje, writer);
        if (audioSticker && M.FutureProofMessage) {
            mensaje.audioStickerMessage = audioSticker;
            M.FutureProofMessage.encode(audioSticker, w.uint32(1074).fork()).ldelim();
        }
        return w;
    };
    M.__audioStickerPatchedV3 = true;
}

// ---------- HANDLER ESTILO GOKU ----------
let handler = async (m, { conn, args, usedPrefix, command }) => {
    await modificarProto(proto);
    // Aquí va tu lógica de sesiones / descarga / ffmpeg
    // m.quoted = mensaje citado, conn = cliente de Baileys de Goku
    // Para enviar el sticker con audio en Goku:
    // await conn.sendMessage(m.chat, { audioStickerMessage: { message: { stickerMessage: { ... } } } })
    
    if (!m.quoted) return m.reply(`*Responde a una foto/video con ${usedPrefix + command} para hacer un sticker con sonido* 🐉\n\nEjemplo:\n${usedPrefix}saudio Pack|Autor`);
    return m.reply('Adaptado para Goku Bot, pegando tu lógica completa...');
}

handler.help = ['saudio'];
handler.tags = ['sticker'];
handler.command = /^(saudio|s2)$/i;
handler.group = false;

export default handler;
