/**
 * GOKU BOT · prueba1 — video de YouTube en mp4, sin API key.
 * Autor: Gus · Licencia MIT
 * Canal: https://whatsapp.com/channel/0029VbDPchgEAKWO4mMYtC1Q
 */

const CANAL = 'https://whatsapp.com/channel/0029VbDPchgEAKWO4mMYtC1Q';

const caja = (titulo, lineas, pie = 'GOKU BOT') =>
    '╭┈──◯◝ ⬢ *' + titulo + '*\n' +
    lineas.filter(Boolean).map((l) => (l.startsWith('>') ? l : '┆ ❀ ' + l)).join('\n') + '\n' +
    '╰┈──◯◞ ✿ ' + pie + '\n' +
    '> 🌸 Sigue el canal › ' + CANAL;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
// Cliente de YouTube que todavía entrega enlaces directos (sin firma que descifrar).
const CLIENTE = { clientName: 'ANDROID_VR', clientVersion: '1.60.19', androidSdkVersion: 32, deviceModel: 'Quest 3', osName: 'Android', osVersion: '12', hl: 'es', gl: 'US' };
const TOPE = 96 * 1024 * 1024;

const enc = (t) => encodeURIComponent(t);

const idDe = (e) => {
    const m = String(e).match(/(?:v=|youtu\.be\/|shorts\/|live\/|embed\/)([\w-]{11})/) || String(e).match(/^([\w-]{11})$/);
    return m ? m[1] : null;
};

const aSegundos = (v) => {
    if (typeof v === 'number') return v;
    const p = String(v || '').trim().split(':');
    if (!p.length || p.some((x) => !/^\d+$/.test(x))) return 0;
    return p.reduce((t, x) => t * 60 + Number(x), 0);
};

const mmss = (s) => (s ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : '—');

const pedirJson = async (url, ms = 25000) => {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(ms) });
    if (!res.ok) throw new Error('respondió ' + res.status);
    return res.json();
};

// JSON grande dentro del HTML: hay que cerrar llaves a mano, no sirve un regex.
const extraerJson = (html, marca) => {
    const i = html.indexOf(marca);
    if (i < 0) return null;
    const ini = html.indexOf('{', i);
    let prof = 0, fin = -1, enCadena = false, escape = false;
    for (let k = ini; k < html.length; k++) {
        const c = html[k];
        if (escape) { escape = false; continue; }
        if (c === '\\') { escape = true; continue; }
        if (c === '"') enCadena = !enCadena;
        if (enCadena) continue;
        if (c === '{') prof++;
        else if (c === '}') { prof--; if (!prof) { fin = k + 1; break; } }
    }
    if (fin < 0) return null;
    try { return JSON.parse(html.slice(ini, fin)); } catch { return null; }
};

const buscar = async (consulta) => {
    const res = await fetch('https://www.youtube.com/results?hl=es&search_query=' + enc(consulta), {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' },
        signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error('YouTube respondió ' + res.status);
    const id = ((await res.text()).match(/"videoId":"([\w-]{11})"/) || [])[1];
    if (!id) throw new Error('no encontré nada con esa búsqueda');
    return id;
};

// Ficha del video. Aunque YouTube bloquee la descarga, el título y el canal sí salen.
const pagina = async (id) => {
    const res = await fetch('https://www.youtube.com/watch?v=' + id + '&hl=es', {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' },
        signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error('no pude abrir el video (' + res.status + ')');
    const d = extraerJson(await res.text(), 'ytInitialPlayerResponse');
    if (!d) return { det: {}, formatos: [], estado: null };
    const fs = [...(d?.streamingData?.formats || []), ...(d?.streamingData?.adaptiveFormats || [])].filter((f) => f.url);
    return { det: d.videoDetails || {}, formatos: fs, estado: d?.playabilityStatus?.status || null };
};

const porApi = async (id) => {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
        body: JSON.stringify({ context: { client: CLIENTE }, videoId: id, contentCheckOk: true, racyCheckOk: true }),
        signal: AbortSignal.timeout(15000)
    });
    const d = await res.json();
    const fs = [...(d?.streamingData?.formats || []), ...(d?.streamingData?.adaptiveFormats || [])].filter((f) => f.url);
    return { det: d?.videoDetails || {}, formatos: fs, estado: d?.playabilityStatus?.status || null };
};

// ── respaldos públicos (sin key, sin cuenta) para cuando YouTube bloquea la IP ──
const RESPALDOS = [
    {
        nombre: 'davidcyril',
        url: (id) => 'https://apis.davidcyriltech.my.id/download/ytmp4?url=' + enc('https://youtu.be/' + id),
        sacar: (d) => ({ link: d?.result?.download_url, titulo: d?.result?.title, ext: '.mp4', calidad: d?.result?.quality || '360p' })
    },
    {
        nombre: 'eliteprotech',
        url: (id) => 'https://eliteprotech-apis.zone.id/download/ytmp4?url=' + enc('https://youtu.be/' + id),
        sacar: (d) => ({ link: d?.result?.url, titulo: d?.result?.title, ext: '.mp4', calidad: '360p' })
    }
];

// ── descarga: si el servidor acepta rangos, baja en pedazos (YouTube limita la
//    descarga seguida a ~30 KB/s y un tema de 3 MB tardaría 100 s) ──
const revisar = (buf) => {
    if (buf.length > TOPE) throw new Error('el video pasa de ' + Math.round(TOPE / 1048576) + ' MB');
    if (buf.length < 20000) throw new Error('llegó un archivo vacío');
    return buf;
};

const rango = async (url, desde, hasta, intentos = 3) => {
    for (let i = 1; i <= intentos; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': UA, Range: 'bytes=' + desde + '-' + hasta },
                signal: AbortSignal.timeout(60000)
            });
            if (res.status === 206) return { sigue: true, buf: Buffer.from(await res.arrayBuffer()) };
            if (res.status === 200) return { sigue: false, buf: Buffer.from(await res.arrayBuffer()) };
            throw new Error('la descarga falló (' + res.status + ')');
        } catch (e) {
            if (i === intentos) throw e;
        }
    }
};

const bajar = async (url) => {
    // sonda de 1 byte: dice el tamaño total y si acepta pedazos
    let total = 0;
    try {
        const sonda = await fetch(url, { headers: { 'User-Agent': UA, Range: 'bytes=0-0' }, signal: AbortSignal.timeout(25000) });
        if (sonda.status === 200) return revisar(Buffer.from(await sonda.arrayBuffer()));
        const cr = sonda.headers.get('content-range');
        if (cr) total = Number(String(cr).split('/')[1]) || 0;
    } catch { /* sin sonda se baja de una */ }

    if (!total) {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error('la descarga falló (' + res.status + ')');
        return revisar(Buffer.from(await res.arrayBuffer()));
    }
    if (total > TOPE) throw new Error('el archivo pasa de ' + Math.round(TOPE / 1048576) + ' MB, probá algo más corto');

    const trozos = Math.min(8, Math.max(2, Math.ceil(total / (4 * 1048576))));
    const tam = Math.ceil(total / trozos);
    const partes = await Promise.all(
        Array.from({ length: trozos }, (_, i) => rango(url, i * tam, Math.min(total - 1, (i + 1) * tam - 1)))
    );
    if (partes.some((p) => !p.sigue)) return revisar(partes[0].buf);
    return revisar(Buffer.concat(partes.map((p) => p.buf)));
};

// Sólo sirven los formatos "progresivos" (video + audio en el mismo archivo).
// Los 1080p vienen sin audio: unirlos necesitaría ffmpeg y acá no hay dependencias.
const elegirVideo = (formatos) => {
    const mp4 = formatos.filter((f) => (f.mimeType || '').startsWith('video/mp4'));
    const progresivo = mp4.filter((f) => f.itag === 18 || f.itag === 22);
    if (progresivo.length) return progresivo.sort((a, b) => (b.itag === 22 ? 1 : 0) - (a.itag === 22 ? 1 : 0))[0];
    return mp4.find((f) => f.audioQuality || f.audioChannels) || null;
};

// 1) directo de YouTube, 2) respaldos públicos. Devuelve el archivo ya bajado.
const conseguir = async (id) => {
    let det = {};
    let motivo = 'YouTube no entregó el enlace de descarga';

    for (const intento of [porApi, pagina]) {
        try {
            const r = await intento(id);
            det = r.det?.title ? r.det : det;
            const video = elegirVideo(r.formatos);
            if (video) {
                const buf = await bajar(video.url);
                return { buf, ext: '.mp4', det, fuente: 'YouTube', calidad: video.qualityLabel || '360p' };
            }
            if (r.estado === 'LOGIN_REQUIRED') motivo = 'YouTube pidió iniciar sesión desde esta IP';
        } catch (e) {
            motivo = e?.message || motivo;
        }
    }

    for (const r of RESPALDOS) {
        try {
            const d = await pedirJson(r.url(id));
            const dato = r.sacar(d);
            if (!dato?.link) continue;
            const buf = await bajar(dato.link);
            return {
                buf,
                ext: dato.ext,
                det: { title: det.title || dato.titulo, author: det.author || dato.canal, lengthSeconds: det.lengthSeconds || dato.dur },
                fuente: r.nombre,
                calidad: dato.calidad || 'mp3'
            };
        } catch { /* pasa al siguiente respaldo */ }
    }

    throw new Error(motivo + ' (y los respaldos tampoco contestaron)');
};

let handler = async (m, { conn, args, usedPrefix }) => {
    const p = usedPrefix || '.';
    const responder = (payload) => conn.sendMessage(m.chat, payload, { quoted: m });
    const consulta = String(args?.join(' ') || '').trim();

    if (!consulta) {
        return responder({ text: caja('PRUEBA1', [
            `*Uso* › ${p}prueba1 <link o nombre>`,
            `*Ejemplo* › ${p}prueba1 coldplay - yellow`,
            '> Sale en mp4 360p, sin API key ♡'
        ]) });
    }

    try {
        const id = idDe(consulta) || (await buscar(consulta));
        const { buf, ext, det, fuente, calidad } = await conseguir(id);
        const titulo = det?.title || 'audio';
        const canal = det?.author || '—';
        const dur = mmss(aSegundos(det?.lengthSeconds));

        if (process.env.GOKU_TEST === '1') {
            return responder({ text: caja('PRUEBA1 · OK', [
                '*' + titulo + '*',
                '👤 ' + canal + ' · ⏱️ ' + dur,
                '🎬 ' + calidad + ' · 📦 ' + (buf.length / 1048576).toFixed(1) + ' MB',
                '> vía ' + fuente + ' ♡'
            ]) });
        }

        return responder({
            video: buf,
            mimetype: 'video/mp4',
            fileName: titulo.replace(/[\\/:*?"<>|]/g, '').slice(0, 70) + ext,
            caption: caja('PRUEBA1', [
                '*' + titulo + '*',
                '👤 ' + canal + ' · ⏱️ ' + dur,
                '🎬 ' + calidad + ' · 📦 ' + (buf.length / 1048576).toFixed(1) + ' MB',
                '> vía ' + fuente + ' ♡'
            ])
        });
    } catch (e) {
        return responder({ text: caja('NO PUDE', [
            '› ' + (e?.message || 'algo salió mal'),
            '> Probá con otro link ♡'
        ]) });
    }
};

handler.command = ['prueba1'];
handler.tags = ['descargas'];
handler.help = ['prueba1 <link o nombre>'];
export default handler;
