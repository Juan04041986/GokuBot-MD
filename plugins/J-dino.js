/**
 * GOKU BOT · Dino Runner
 * Autor: Gus · Licencia MIT
 * Comando: .dino
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GOKU · Dino Runner</title>
<style>
:root {--fondo:#070a14;--panel:#0e1526;--panel2:#141d33;--linea:#1e2c4a;--texto:#eaf2ff;--suave:#8fa2c4;--celeste:#4dd2ff;--rosa:#ff4dd2;--verde:#5cff9d;--amarillo:#ffd93d;--acento:#3ef0ff;--cielo1:#0a1120;--cielo2:#122a44;--tierra:#1b3a56;--lejos:#123049;--medio:#0e2338;--bicho:#5cff9d;--obst:#2f8fa8;--roca:#3c6a80;}
#app[data-paleta="neon"] {--acento:#3ef0ff;--cielo1:#080f1e;--cielo2:#0d2b4a;--tierra:#1c4a66;--lejos:#10344c;--medio:#0b2334;--bicho:#4df5ff;--obst:#2aa3c4;--roca:#3d6f86;}
#app[data-paleta="atardecer"] {--acento:#ffb03d;--cielo1:#2a1030;--cielo2:#8c3b4a;--tierra:#4a2233;--lejos:#5c2a3e;--medio:#361a29;--bicho:#ffd93d;--obst:#c4743c;--roca:#8a4f4a;}
#app[data-paleta="noche"] {--acento:#a97bff;--cielo1:#05060f;--cielo2:#141033;--tierra:#241a45;--lejos:#1a1436;--medio:#120e26;--bicho:#d4b6ff;--obst:#6f56a8;--roca:#4a3a72;}
#app[data-paleta="menta"] {--acento:#5cff9d;--cielo1:#04120f;--cielo2:#0d3a33;--tierra:#14524a;--lejos:#0e3a34;--medio:#0a2823;--bicho:#9dffcb;--obst:#2f9c74;--roca:#3a6b5c;}
html {overflow-x:hidden;}
body {margin:0;padding:0;background-color:#070a14;background-image:linear-gradient(180deg,#0a1120,#060911);color:var(--texto);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;overflow-x:hidden;}
::-webkit-scrollbar {width:0;height:0;}
* {box-sizing:border-box;}
.app {width:100%;padding:12px 12px 14px;}
.cab {display:flex;align-items:center;gap:10px;padding:10px 11px;background-color:var(--panel);background-image:linear-gradient(135deg,#131f36,#0c1424);border:1px solid var(--linea);border-radius:14px;box-shadow:inset 0 0 0 1px rgba(126,200,255,.10);}
.cab .ic {width:34px;height:34px;flex-shrink:0;border-radius:10px;background-image:linear-gradient(135deg,#22d3ee,#7c3aed);display:flex;align-items:center;justify-content:center;line-height:0;box-shadow:0 4px 14px rgba(77,210,255,.35);}
.cab .ic svg {width:22px;height:22px;display:block;}
.cab .ic path, .cab .ic rect, .cab .ic circle {fill:#fff;stroke:none;}
.cab .tx {display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;}
.cab .tx b {font-size:13.5px;letter-spacing:.6px;white-space:nowrap;}
.cab .tx span {font-size:10.5px;color:var(--suave);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.chip {margin-left:6px;flex-shrink:0;border:1px solid var(--linea);background-color:#17233c;color:#cddcf5;font-family:inherit;font-size:10px;font-weight:800;letter-spacing:1.2px;padding:7px 11px;border-radius:9px;}
.sonido {flex-shrink:0;width:30px;height:30px;margin-left:auto;padding:0;border:1px solid var(--linea);border-radius:9px;background-color:#17233c;color:#cddcf5;font-family:inherit;font-size:15px;line-height:1;cursor:pointer;}
.sonido:active {background-color:#20304f;}
.sonido.off {color:#64748f;}
@media (max-width:350px) {.cab .tx span {display:none;}.cab .tx b {font-size:12px;}.sonido {width:27px;height:27px;font-size:14px;}}
.raya {height:1px;margin:9px 2px 0;background-color:rgba(126,200,255,.24);border-radius:1px;}
.pant {display:none;padding-top:14px;}
.pant.on {display:block;}
.icono-grande {display:flex;align-items:center;justify-content:center;height:46px;}
.icono-grande svg {width:52px;height:46px;display:block;overflow:visible;}
h1 {text-align:center;font-size:23px;font-weight:800;letter-spacing:-.4px;margin:8px 0 2px;}
.sub2 {text-align:center;font-size:11.5px;color:var(--suave);margin:0 0 16px;line-height:1.45;}
.rotulo {font-size:9.5px;letter-spacing:2px;font-weight:800;color:#7d93b8;margin:0 0 8px;}
.grid2 {display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.nivel-carta {text-align:left;padding:11px 10px;border:1px solid var(--linea);border-radius:14px;background-color:var(--panel);font-family:inherit;color:var(--texto);cursor:pointer;display:flex;flex-direction:column;gap:3px;}
.nivel-carta:active {transform:scale(.98);border-color:#37507a;}
.nivel-carta .em {font-size:19px;line-height:1.2;}
.nivel-carta b {font-size:13px;}
.nivel-carta .d {font-size:10px;color:var(--suave);line-height:1.35;}
.nivel-carta[data-n="0"] b {color:#5cff9d;} .nivel-carta[data-n="1"] b {color:#4dd2ff;}
.nivel-carta[data-n="2"] b {color:#ffb03d;} .nivel-carta[data-n="3"] b {color:#ff5c8a;}
.paletas {display:flex;gap:7px;}
.paleta {flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:7px 2px 6px;border:1px solid var(--linea);border-radius:11px;background-color:var(--panel);color:#7d93b8;font-family:inherit;font-size:8px;font-weight:800;letter-spacing:.4px;cursor:pointer;}
.paleta.on {border-color:var(--celeste);background-color:#122038;color:#d6ecff;}
.paleta .muestra {display:flex;align-items:center;gap:5px;height:22px;}
.paleta .muestra i {display:block;width:11px;height:11px;border-radius:50%;}
.paleta[data-paleta="neon"] .muestra i.a {background-color:#3ef0ff;box-shadow:0 0 8px #3ef0ff;}
.paleta[data-paleta="neon"] .muestra i.b {background-color:#1c4a66;box-shadow:0 0 8px #1c4a66;}
.paleta[data-paleta="atardecer"] .muestra i.a {background-color:#ffb03d;box-shadow:0 0 8px #ffb03d;}
.paleta[data-paleta="atardecer"] .muestra i.b {background-color:#8c3b4a;box-shadow:0 0 8px #8c3b4a;}
.paleta[data-paleta="noche"] .muestra i.a {background-color:#a97bff;box-shadow:0 0 8px #a97bff;}
.paleta[data-paleta="noche"] .muestra i.b {background-color:#141033;box-shadow:0 0 8px #4a3a8a;}
.paleta[data-paleta="menta"] .muestra i.a {background-color:#5cff9d;box-shadow:0 0 8px #5cff9d;}
.paleta[data-paleta="menta"] .muestra i.b {background-color:#14524a;box-shadow:0 0 8px #14524a;}
.reglas {display:flex;flex-direction:column;gap:5px;margin-top:11px;}
.regla {display:flex;gap:7px;align-items:flex-start;font-size:10.5px;color:var(--suave);line-height:1.4;}
.regla i {flex-shrink:0;width:5px;height:5px;margin-top:5px;border-radius:50%;background-color:var(--acento);box-shadow:0 0 6px var(--acento);}
.hud {display:flex;align-items:center;gap:8px;margin-bottom:9px;}
.hud .caja {flex:1;background-color:var(--panel);border:1px solid var(--linea);border-radius:11px;padding:6px 10px;}
.hud .caja.der {text-align:right;}
.hud span {display:block;font-size:8px;letter-spacing:1.2px;color:#7d93b8;font-weight:800;}
.hud b {font-size:16px;font-variant-numeric:tabular-nums;letter-spacing:-.3px;}
.hud .caja.der b {color:var(--amarillo);}
.marco {position:relative;width:100%;padding-bottom:56.25%;border-radius:16px;overflow:hidden;background-color:#0a1120;box-shadow:0 14px 34px rgba(0,0,0,.55),inset 0 0 0 1px rgba(126,200,255,.22);}
.marco canvas {position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;display:block;}
.esq {position:absolute;width:10px;height:10px;border:2px solid var(--acento);border-radius:2px;pointer-events:none;opacity:.45;z-index:4;}
.esq.tl {top:5px;left:5px;border-right:0;border-bottom:0;}
.esq.tr {top:5px;right:5px;border-left:0;border-bottom:0;}
.esq.bl {bottom:5px;left:5px;border-right:0;border-top:0;}
.esq.br {bottom:5px;right:5px;border-left:0;border-top:0;}
.aviso {text-align:center;font-size:10.5px;color:var(--suave);margin:9px 0 8px;min-height:13px;}
.aviso.alerta {color:var(--amarillo);}
.teclas {display:flex;gap:8px;}
.saltar {flex:1;padding:15px 8px;border:0;border-radius:14px;background-image:linear-gradient(135deg,#22d3ee,#7c3aed);color:#fff;font-family:inherit;font-size:14px;font-weight:800;letter-spacing:1px;cursor:pointer;box-shadow:0 8px 20px rgba(77,210,255,.30);}
.saltar:active {transform:scale(.985);}
.frenar {width:86px;border:1px solid var(--linea);background-color:var(--panel2);color:var(--texto);border-radius:14px;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer;}
.stats {display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:9px;}
.stat {background-color:var(--panel);border:1px solid var(--linea);border-radius:10px;padding:6px 8px;text-align:center;}
.stat span {display:block;font-size:8px;letter-spacing:1.1px;color:#7d93b8;font-weight:800;}
.stat b {font-size:13px;font-variant-numeric:tabular-nums;}
.stat.rec b {color:var(--amarillo);}
.fila {display:flex;gap:7px;margin-top:10px;}
.boton {flex:1;padding:11px 6px;background-color:var(--panel2);border:1px solid var(--linea);border-radius:12px;color:var(--texto);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;}
.boton:active {background-color:#1b2740;}
.volver {width:100%;margin-top:8px;padding:11px;background-color:transparent;border:1px solid var(--linea);border-radius:12px;color:var(--suave);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;}
.pie {margin-top:8px;text-align:center;font-size:9.5px;color:#5b6c8c;letter-spacing:1px;}
.modal {position:fixed;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;background:rgba(4,7,14,.78);padding:20px;z-index:20;}
.modal[hidden] {display:none;}
.modal-caja {width:100%;max-width:290px;text-align:center;background-image:linear-gradient(180deg,#131f36,#0b1220);border:1px solid var(--linea);border-radius:18px;padding:22px 18px;box-shadow:0 22px 50px rgba(0,0,0,.6);}
.modal-em {font-size:34px;}
.modal-t {font-size:19px;font-weight:800;margin-top:5px;}
.modal-t.gana {color:var(--verde);} .modal-t.pierde {color:var(--rosa);} .modal-t.rec {color:var(--amarillo);}
.modal-x {font-size:12px;color:var(--suave);margin-top:6px;line-height:1.5;}
.modal-b {margin-top:15px;width:100%;padding:11px;border:0;border-radius:11px;background-image:linear-gradient(90deg,#22d3ee,#7c3aed);color:#fff;font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer;}
</style>
</head>
<body>
<main class="app" id="app" data-pantalla="nivel" data-paleta="neon">
<header class="cab">
<div class="ic" id="icCab"></div>
<div class="tx"><b>GOKU DINO</b><span>Corredor infinito · 4 velocidades</span></div>
<button class="sonido" id="btnSonido" aria-label="Sonido">🔊</button>
<button class="chip" id="chip">MENÚ</button>
</header>
<section class="pant on" id="pNivel">
<div class="icono-grande" id="icNivel"></div>
<h1>Dino Runner</h1>
<p class="sub2">Elegí la velocidad de la carrera</p>
<div class="rotulo">VELOCIDAD</div>
<div class="grid2" id="niveles"></div>
<div class="raya"></div>
<div class="rotulo" style="margin-top:12px">PALETA DEL CIELO</div>
<div class="paletas" id="paletas"></div>
<div class="raya"></div>
<div class="reglas">
<div class="regla"><i></i><span>Tocá la pantalla o el botón para saltar. Tocá otra vez en el aire y caés rápido.</span></div>
<div class="regla"><i></i><span>Los cactus se saltan. Los pájaros bajos también; a los altos se les pasa por abajo.</span></div>
<div class="regla"><i></i><span>La velocidad sube sola: aguantá lo más que puedas.</span></div>
</div>
</section>
<section class="pant" id="pJuego">
<div class="hud">
<div class="caja"><span>PUNTOS</span><b id="hudPuntos">0</b></div>
<div class="caja der"><span>RÉCORD</span><b id="hudRecord">0</b></div>
</div>
<div class="marco" id="marco">
<i class="esq tl"></i><i class="esq tr"></i><i class="esq bl"></i><i class="esq br"></i>
<canvas id="cv" width="320" height="180" role="img" aria-label="Dino Runner"></canvas>
</div>
<p class="aviso" id="aviso">Tocá para saltar.</p>
<div class="teclas">
<button class="saltar" id="btnSaltar">SALTAR</button>
<button class="frenar" id="btnPausa">⏸</button>
</div>
<div class="stats">
<div class="stat"><span>VELOCIDAD</span><b id="stVel">1,0×</b></div>
<div class="stat"><span>SALTOS</span><b id="stSaltos">0</b></div>
<div class="stat rec"><span>RÉCORD</span><b id="stRecord">0</b></div>
</div>
<div class="fila">
<button class="boton" id="btnNueva">↻ Nueva carrera</button>
<button class="boton" id="btnBorrar">🗑 Récord</button>
</div>
<button class="volver" id="btnMenu">‹ Menú</button>
</section>
<div class="raya"></div>
<div class="pie">goku-bot</div>
</main>
<div class="modal" id="modal" hidden>
<div class="modal-caja" role="dialog" aria-modal="true">
<div class="modal-em" id="modalEm">💀</div>
<div class="modal-t" id="modalT">Te chocaste</div>
<div class="modal-x" id="modalX">Puntos: 0</div>
<button class="modal-b" id="modalB">Otra carrera</button>
</div>
</div>
<script>
var eApp = document.getElementById('app');
var porId = function (id) { return document.getElementById(id); };
var AN = 320, AL = 180, SUELO = 146;
var GRAVEDAD = 0.46, SALTO = -9.0, CAIDA = 0.9;
var NIVELES = [
{ em: '🐢', nombre: 'Tranquilo', detalle: 'Para calentar', base: 2.6, rampa: 0.00030 },
{ em: '🦎', nombre: 'Normal', detalle: 'El de siempre', base: 3.4, rampa: 0.00055 },
{ em: '🔥', nombre: 'Rápido', detalle: 'Ya cuesta', base: 4.4, rampa: 0.00085 },
{ em: '💀', nombre: 'Insano', detalle: 'Sin piedad', base: 5.6, rampa: 0.00130 }
];
var PALETAS = [['neon', 'NEÓN'], ['atardecer', 'ATARDECER'], ['noche', 'NOCHE'], ['menta', 'MENTA']];
var nivel = 1, paleta = 'neon', pantalla = 'nivel';
var puntos = 0, record = 0, saltos = 0;
var mejorVel = 1;
var enJuego = false, pausado = false, muerto = false;
var manual = false;
var dino = { x: 46, y: 0, vy: 0, alto: 30, ancho: 24, enAire: false, patas: 0 };
var obstaculos = [];
var particulas = [];
var nubes = [{ x: 60, y: 34, s: 1 }, { x: 180, y: 22, s: 0.75 }, { x: 280, y: 44, s: 1.1 }];
var fondo = 0, distancia = 0, proximo = 60, tic = 0;
var cv = porId('cv'), ctx = cv ? cv.getContext('2d') : null;
function color(nombre, respaldo) {
var el = porId('app');
if (!el) return respaldo;
var v = getComputedStyle(el).getPropertyValue(nombre);
return v ? v.trim() : respaldo;
}
function redondear(x, y, w, h, r) {
if (!ctx) return;
var rr = Math.min(r, w / 2, h / 2);
ctx.beginPath();
ctx.moveTo(x + rr, y);
ctx.lineTo(x + w - rr, y);
ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
ctx.lineTo(x + w, y + h - rr);
ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
ctx.lineTo(x + rr, y + h);
ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
ctx.lineTo(x, y + rr);
ctx.quadraticCurveTo(x, y, x + rr, y);
ctx.closePath();
}
function cuerpo(x, y, w, h, r, relleno) {
if (!ctx) return;
ctx.fillStyle = relleno;
redondear(x, y, w, h, r);
ctx.fill();
ctx.strokeStyle = 'rgba(3,10,18,.45)';
ctx.lineWidth = 1.3;
ctx.stroke();
}
function circulo(x, y, r, relleno, borde) {
if (!ctx) return;
ctx.fillStyle = relleno;
ctx.beginPath();
ctx.arc(x, y, r, 0, Math.PI * 2);
ctx.fill();
if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = 1.2; ctx.stroke(); }
}
function dibujarDino() {
var yo = color('--bicho', '#4df5ff');
var x = dino.x, y = SUELO - dino.alto + dino.y;
if (!ctx) return;
var altura = Math.max(0, -dino.y);
ctx.globalAlpha = Math.max(0.05, 0.20 - altura / 520);
ctx.fillStyle = '#000';
ctx.beginPath();
ctx.ellipse(x + 12, SUELO + 1, Math.max(6, 13 - altura / 16), 3, 0, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 1;
ctx.fillStyle = yo;
ctx.beginPath();
ctx.moveTo(x + 4, y + 12);
ctx.quadraticCurveTo(x - 5, y + 7, x - 9, y + 9);
ctx.quadraticCurveTo(x - 4, y + 14, x + 4, y + 20);
ctx.closePath();
ctx.fill();
ctx.strokeStyle = 'rgba(3,10,18,.45)';
ctx.lineWidth = 1.3;
ctx.stroke();
var paso1 = dino.enAire ? 2 : (Math.sin(dino.patas * 1.6) > 0 ? 0 : 3);
var paso2 = dino.enAire ? 3 : (Math.sin(dino.patas * 1.6) > 0 ? 3 : 0);
cuerpo(x + 4, y + 22, 5.5, 6 + paso1, 2.4, yo);
cuerpo(x + 12, y + 22, 5.5, 6 + paso2, 2.4, yo);
cuerpo(x + 3.4, y + 26 + paso1, 7.2, 3.6, 1.8, yo);
cuerpo(x + 11.4, y + 26 + paso2, 7.2, 3.6, 1.8, yo);
cuerpo(x + 1, y + 11, 18, 12, 5.5, yo);
cuerpo(x + 10, y + 1, 13, 13, 5, yo);
cuerpo(x + 19, y + 6, 9, 6.5, 3, yo);
cuerpo(x + 12, y + 15, 7, 3.2, 1.6, yo);
circulo(x + 19, y + 6, 2.7, '#ffffff');
circulo(x + 19.6, y + 6.2, 1.5, '#08131f');
ctx.strokeStyle = 'rgba(3,10,18,.55)';
ctx.lineWidth = 1.2;
ctx.beginPath();
ctx.moveTo(x + 22, y + 10.6);
ctx.lineTo(x + 26, y + 10.6);
ctx.stroke();
circulo(x + 26.4, y + 7.6, 1, 'rgba(3,10,18,.5)');
}
function dibujarCactus(o) {
var verde = color('--obst', '#2aa3c4');
var roca = color('--roca', '#3d6f86');
if (!ctx) return;
var x = o.x, y = o.y;
if (o.tipo === 'roca') {
ctx.fillStyle = 'rgba(3,10,18,.5)';
ctx.beginPath();
ctx.moveTo(x + o.ancho * 0.5, y - 1.5);
ctx.lineTo(x + o.ancho * 0.95, y + o.alto * 0.42);
ctx.lineTo(x + o.ancho + 1, SUELO - 1);
ctx.lineTo(x - 1, SUELO - 1);
ctx.lineTo(x + o.ancho * 0.05, y + o.alto * 0.40);
ctx.closePath();
ctx.fill();
ctx.fillStyle = roca;
ctx.beginPath();
ctx.moveTo(x + o.ancho * 0.5, y);
ctx.lineTo(x + o.ancho * 0.92, y + o.alto * 0.42);
ctx.lineTo(x + o.ancho, SUELO - 2);
ctx.lineTo(x, SUELO - 2);
ctx.lineTo(x + o.ancho * 0.08, y + o.alto * 0.40);
ctx.closePath();
ctx.fill();
ctx.strokeStyle = 'rgba(255,255,255,.20)';
ctx.lineWidth = 1.4;
ctx.beginPath();
ctx.moveTo(x + o.ancho * 0.5, y + 1.5);
ctx.lineTo(x + o.ancho * 0.88, y + o.alto * 0.44);
ctx.stroke();
return;
}
var partes = [
[x, y, o.ancho, o.alto, 3.4],
[x - 6.5, y + o.alto * 0.46, 9, 4.6, 2.3],
[x - 6.5, y + o.alto * 0.24, 4.6, o.alto * 0.28, 2.3],
[x + o.ancho - 2.5, y + o.alto * 0.58, 9, 4.6, 2.3],
[x + o.ancho - 2.1, y + o.alto * 0.36, 4.6, o.alto * 0.26, 2.3]
];
var k;
ctx.fillStyle = 'rgba(3,10,18,.55)';
for (k = 0; k < partes.length; k++) {
redondear(partes[k][0] - 1.4, partes[k][1] - 1.4, partes[k][2] + 2.8, partes[k][3] + 2.8, partes[k][4] + 1.4);
ctx.fill();
}
ctx.fillStyle = verde;
for (k = 0; k < partes.length; k++) {
redondear(partes[k][0], partes[k][1], partes[k][2], partes[k][3], partes[k][4]);
ctx.fill();
}
}
function dibujarPajaro(o) {
var yo = color('--obst', '#2aa3c4');
if (!ctx) return;
var cx = o.x + o.ancho / 2, cy = o.y + o.alto / 2;
var arriba = Math.sin(o.fase) > 0;
ctx.fillStyle = yo;
ctx.beginPath();
ctx.ellipse(cx, cy + 1, 7.5, 5, 0, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = 'rgba(3,10,18,.45)';
ctx.lineWidth = 1.2;
ctx.stroke();
ctx.fillStyle = yo;
ctx.beginPath();
if (arriba) {
ctx.moveTo(cx - 2, cy - 2);
ctx.quadraticCurveTo(cx - 9, cy - 13, cx + 3, cy - 10);
ctx.quadraticCurveTo(cx + 4, cy - 4, cx - 2, cy - 2);
} else {
ctx.moveTo(cx - 2, cy + 2);
ctx.quadraticCurveTo(cx - 9, cy + 12, cx + 3, cy + 9);
ctx.quadraticCurveTo(cx + 4, cy + 3, cx - 2, cy + 2);
}
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.fillStyle = color('--acento', '#3ef0ff');
ctx.beginPath();
ctx.moveTo(cx + 7, cy - 0.5);
ctx.lineTo(cx + 12.5, cy + 1.6);
ctx.lineTo(cx + 7, cy + 3);
ctx.closePath();
ctx.fill();
circulo(cx + 3.4, cy - 1.4, 1.5, '#ffffff');
circulo(cx + 3.8, cy - 1.3, 0.9, '#08131f');
}
function dibujar() {
if (!ctx) return;
var c1 = color('--cielo1', '#080f1e');
var c2 = color('--cielo2', '#0d2b4a');
var tierra = color('--tierra', '#1c4a66');
var lejos = color('--lejos', '#10344c');
var medio = color('--medio', '#0b2334');
var acento = color('--acento', '#3ef0ff');
var g = ctx.createLinearGradient(0, 0, 0, AL);
g.addColorStop(0, c1);
g.addColorStop(1, c2);
ctx.fillStyle = g;
ctx.fillRect(0, 0, AN, AL);
var astro = paleta === 'noche' ? 42 : 34;
ctx.globalAlpha = 0.85;
ctx.fillStyle = acento;
ctx.beginPath();
ctx.arc(262, 38, astro / 3, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 0.12;
ctx.beginPath();
ctx.arc(262, 38, astro / 2.2, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 1;
if (paleta === 'noche' || paleta === 'neon') {
ctx.fillStyle = '#ffffff';
var puntosEstrella = [[20, 18], [70, 30], [120, 14], [160, 40], [210, 22], [300, 26], [40, 52], [250, 60]];
for (var i = 0; i < puntosEstrella.length; i++) {
ctx.globalAlpha = 0.25 + 0.25 * Math.sin(fondo * 0.02 + i);
ctx.beginPath();
ctx.arc(puntosEstrella[i][0], puntosEstrella[i][1], 1.1, 0, Math.PI * 2);
ctx.fill();
}
ctx.globalAlpha = 1;
}
ctx.fillStyle = c2;
for (var n = 0; n < nubes.length; n++) {
var nu = nubes[n];
ctx.globalAlpha = 0.55;
redondear(nu.x, nu.y, 34 * nu.s, 7 * nu.s, 3.5);
ctx.fill();
redondear(nu.x + 10 * nu.s, nu.y - 5 * nu.s, 18 * nu.s, 8 * nu.s, 4);
ctx.fill();
ctx.globalAlpha = 1;
}
ctx.fillStyle = lejos;
ctx.beginPath();
ctx.moveTo(0, SUELO);
var desfase = -(fondo * 0.18) % 160;
for (var m = -1; m < 4; m++) {
var bx = desfase + m * 160;
ctx.lineTo(bx, SUELO);
ctx.lineTo(bx + 40, SUELO - 46);
ctx.lineTo(bx + 78, SUELO - 12);
ctx.lineTo(bx + 108, SUELO - 56);
ctx.lineTo(bx + 160, SUELO);
}
ctx.lineTo(AN, SUELO);
ctx.closePath();
ctx.fill();
ctx.fillStyle = medio;
ctx.beginPath();
ctx.moveTo(0, SUELO);
var desfase2 = -(fondo * 0.42) % 120;
for (var d = -1; d < 4; d++) {
var dx = desfase2 + d * 120;
ctx.quadraticCurveTo(dx + 30, SUELO - 22, dx + 60, SUELO);
ctx.quadraticCurveTo(dx + 90, SUELO - 15, dx + 120, SUELO);
}
ctx.lineTo(AN, SUELO);
ctx.closePath();
ctx.fill();
ctx.fillStyle = tierra;
ctx.fillRect(0, SUELO, AN, AL - SUELO);
ctx.strokeStyle = acento;
ctx.globalAlpha = 0.85;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(0, SUELO);
ctx.lineTo(AN, SUELO);
ctx.stroke();
ctx.globalAlpha = 0.35;
ctx.lineWidth = 2;
for (var r = -1; r < 12; r++) {
var rx = (r * 34 - (fondo * 1.0) % 34);
ctx.beginPath();
ctx.moveTo(rx, SUELO + 9);
ctx.lineTo(rx + 16, SUELO + 9);
ctx.stroke();
}
ctx.globalAlpha = 1;
if (velocidad() > 4.4) {
ctx.globalAlpha = 0.18;
ctx.strokeStyle = acento;
ctx.lineWidth = 1.6;
for (var v = 0; v < 4; v++) {
var vy2 = 40 + v * 22;
var vx = (AN - (fondo * 2 + v * 70) % (AN + 60));
ctx.beginPath();
ctx.moveTo(vx, vy2);
ctx.lineTo(vx + 22, vy2);
ctx.stroke();
}
ctx.globalAlpha = 1;
}
for (var o = 0; o < obstaculos.length; o++) {
if (obstaculos[o].tipo === 'pajaro') dibujarPajaro(obstaculos[o]);
else dibujarCactus(obstaculos[o]);
}
for (var p = 0; p < particulas.length; p++) {
var pa = particulas[p];
ctx.globalAlpha = Math.max(0, pa.vida / pa.total);
ctx.fillStyle = pa.color;
ctx.beginPath();
ctx.arc(pa.x, pa.y, pa.r, 0, Math.PI * 2);
ctx.fill();
}
ctx.globalAlpha = 1;
dibujarDino();
}
function polvo(x, y, cuantas, colorPart) {
for (var i = 0; i < cuantas; i++) {
particulas.push({
x: x + (Math.random() * 16 - 8), y: y + (Math.random() * 4 - 2),
vx: Math.random() * -1.6 - 0.2, vy: Math.random() * -1.2,
r: 1 + Math.random() * 1.8, vida: 26, total: 26,
color: colorPart || '#9fd4ff'
});
}
}
function velocidad() {
var cfg = NIVELES[nivel];
return Math.min(cfg.base * 1.9, cfg.base + distancia * cfg.rampa);
}
function salto() {
if (!enJuego || pausado || muerto) return false;
if (dino.enAire) {
dino.vy = Math.max(dino.vy, 3.6);
return false;
}
dino.vy = SALTO;
dino.enAire = true;
saltos++;
polvo(dino.x, SUELO, 6, color('--bicho', '#3ef0ff'));
sonar('salto');
pintarHud();
return true;
}
function nuevoObstaculo() {
var r = Math.random();
var tipo = 'cactus', alto = 24, ancho = 12, y = 0;
if (r > 0.78 && puntos > 40) {
var bajo = Math.random() > 0.45;
tipo = 'pajaro';
ancho = 20;
alto = 14;
y = bajo ? SUELO - 36 : SUELO - 66;
} else if (r > 0.62) {
tipo = 'roca';
alto = 18 + Math.random() * 8;
ancho = 16 + Math.random() * 8;
} else {
alto = 21 + Math.random() * 11;
ancho = Math.random() > 0.6 ? 17 : 12;
}
if (tipo !== 'pajaro') y = SUELO - alto;
obstaculos.push({ tipo: tipo, x: AN + 12, y: y, ancho: ancho, alto: alto, fase: Math.random() * 6 });
}
function paso(ms) {
if (!enJuego || pausado || muerto) return;
var f = Math.min(ms, 34) / 16.67;
var vel = velocidad();
if (vel > mejorVel) mejorVel = vel;
distancia += vel * f;
puntos = Math.floor(distancia / 6);
fondo += vel * f;
dino.patas += 0.34 * f;
dino.vy += GRAVEDAD * f;
dino.y += dino.vy * f;
if (dino.y >= 0) {
if (dino.enAire) polvo(dino.x, SUELO, 5, color('--bicho', '#3ef0ff'));
dino.y = 0;
dino.vy = 0;
dino.enAire = false;
}
for (var n = 0; n < nubes.length; n++) {
nubes[n].x -= vel * 0.22 * f;
if (nubes[n].x < -40) { nubes[n].x = AN + 20 + Math.random() * 60; nubes[n].y = 16 + Math.random() * 46; }
}
for (var i = obstaculos.length - 1; i >= 0; i--) {
var o = obstaculos[i];
o.x -= vel * f;
if (o.tipo === 'pajaro') o.fase += 0.22 * f;
if (o.x + o.ancho < -10) { obstaculos.splice(i, 1); continue; }
if (choca(o)) { morir(); return; }
}
for (var p = particulas.length - 1; p >= 0; p--) {
var pa = particulas[p];
pa.x += pa.vx * f; pa.y += pa.vy * f; pa.vy += 0.06 * f; pa.vida -= f;
if (pa.vida <= 0) particulas.splice(p, 1);
}
proximo -= vel * f;
if (proximo <= 0) {
nuevoObstaculo();
proximo = Math.max(140, vel * (40 + Math.random() * 30));
}
tic += f;
if (tic >= 18) {
tic = 0;
if (puntos > 0 && puntos % 100 === 0) {
sonar('punto');
polvo(dino.x + 12, SUELO - 40, 8, color('--acento', '#3ef0ff'));
}
}
pintarHud();
}
function cajaDino() {
return { x: dino.x + 3, y: SUELO - dino.alto + dino.y + 2, ancho: dino.ancho - 6, alto: dino.alto - 3 };
}
function choca(o) {
var a = cajaDino();
var bx = o.x + 2, by = o.tipo === 'pajaro' ? o.y + 3 : o.y + 2;
var bw = o.ancho - 4, bh = o.alto - (o.tipo === 'pajaro' ? 6 : 4);
return a.x < bx + bw && a.x + a.ancho > bx && a.y < by + bh && a.y + a.alto > by;
}
function morir() {
muerto = true;
enJuego = false;
polvo(dino.x + 10, SUELO - dino.alto, 14, '#ff6b8a');
sonar('choque');
var nuevoRecord = puntos > record;
if (nuevoRecord) { record = puntos; try{ localStorage.setItem('goku_dino_record', String(record)); }catch(e){} }
pintarHud();
dibujar();
porId('aviso').textContent = nuevoRecord ? '¡Récord nuevo: ' + puntos + ' puntos!' : 'Te chocaste en ' + puntos + ' puntos.';
porId('aviso').className = 'aviso' + (nuevoRecord ? ' alerta' : '');
abrirModal(nuevoRecord ? '🏆' : '💀', nuevoRecord ? '¡Récord!' : 'Te chocaste',
nuevoRecord ? 'Nuevo récord: ' + puntos + ' puntos en ' + NIVELES[nivel].nombre + '.' : 'Hiciste ' + puntos + ' puntos. El récord es ' + record + '.',
nuevoRecord ? 'rec' : 'pierde');
if (nuevoRecord) sonar('record');
}
function nuevaCarrera() {
dino = { x: 46, y: 0, vy: 0, alto: 30, ancho: 24, enAire: false, patas: 0 };
obstaculos = [];
particulas = [];
distancia = 0; puntos = 0; saltos = 0; proximo = 150; tic = 0; fondo = 0;
muerto = false; pausado = false; enJuego = true;
nubes = [{ x: 60, y: 34, s: 1 }, { x: 180, y: 24, s: 0.8 }, { x: 280, y: 46, s: 1.1 }];
porId('modal').hidden = true;
porId('aviso').textContent = 'Tocá para saltar.';
porId('aviso').className = 'aviso';
porId('btnPausa').textContent = '⏸';
pintarHud();
dibujar();
}
function pausar(estado) {
if (muerto) return;
pausado = typeof estado === 'boolean' ? estado : !pausado;
porId('btnPausa').textContent = pausado ? '▶' : '⏸';
porId('aviso').textContent = pausado ? 'En pausa · tocá ▶ para seguir.' : 'Tocá para saltar.';
}
function pintarHud() {
porId('hudPuntos').textContent = String(puntos);
porId('hudRecord').textContent = String(record);
porId('stSaltos').textContent = String(saltos);
porId('stRecord').textContent = String(record);
porId('stVel').textContent = (velocidad() / NIVELES[1].base).toFixed(1).replace('.', ',') + '×';
}
function mostrar(id) {
var pantallas = ['pNivel', 'pJuego'];
for (var i = 0; i < pantallas.length; i++) porId(pantallas[i]).className = 'pant' + (pantallas[i] === id ? ' on' : '');
pantalla = id === 'pNivel' ? 'nivel' : 'juego';
eApp.setAttribute('data-pantalla', pantalla);
porId('chip').textContent = id === 'pNivel' ? 'MENÚ' : 'JUEGO';
if (id === 'pNivel') { enJuego = false; pausado = true; }
}
function pintarIconos() {
porId('icCab').innerHTML = '<svg viewBox="0 0 26 26">' +
'<rect x="2" y="12" width="10" height="8" rx="2.6"></rect>' +
'<rect x="8" y="5" width="10" height="9" rx="2.6"></rect>' +
'<rect x="15" y="8" width="7" height="4.4" rx="1.8"></rect>' +
'<rect x="4" y="19" width="3.2" height="4.4" rx="1.4"></rect>' +
'<rect x="9.4" y="19" width="3.2" height="4.4" rx="1.4"></rect>' +
'<circle cx="13.6" cy="8.4" r="1.15" fill="#08131f"></circle></svg>';
porId('icNivel').innerHTML = '<svg viewBox="0 0 60 46">' +
'<g fill="var(--acento)">' +
'<rect x="6" y="20" width="24" height="17" rx="5.5"></rect>' +
'<rect x="19" y="6" width="21" height="19" rx="5.5"></rect>' +
'<rect x="34" y="13" width="15" height="8.5" rx="3.4"></rect>' +
'<rect x="10" y="35" width="6.5" height="9" rx="2.6"></rect>' +
'<rect x="22" y="35" width="6.5" height="9" rx="2.6"></rect>' +
'<circle cx="31.5" cy="14" r="2.3" fill="#08131f"></circle>' +
'</g></svg>';
}
function pintarNiveles() {
var caja = porId('niveles');
caja.innerHTML = '';
for (var i = 0; i < NIVELES.length; i++) {
(function (idx) {
var n = NIVELES[idx];
var b = document.createElement('button');
b.className = 'nivel-carta';
b.setAttribute('data-n', String(idx));
b.innerHTML = '<span class="em">' + n.em + '</span><b>' + n.nombre + '</b><span class="d">' + n.detalle + '</span>';
b.addEventListener('click', function () {
sonar('tocar');
nivel = idx;
mostrar('pJuego');
nuevaCarrera();
});
caja.appendChild(b);
})(i);
}
}
function pintarPaletas() {
var caja = porId('paletas');
caja.innerHTML = '';
for (var i = 0; i < PALETAS.length; i++) {
(function (par) {
var b = document.createElement('button');
b.className = 'paleta' + (paleta === par[0] ? ' on' : '');
b.setAttribute('data-paleta', par[0]);
b.innerHTML = '<span class="muestra"><i class="a"></i><i class="b"></i></span>' + par[1];
b.addEventListener('click', function () { ponerPaleta(par[0]); sonar('tocar'); });
caja.appendChild(b);
})(PALETAS[i]);
}
}
function ponerPaleta(nombre) {
paleta = nombre;
eApp.setAttribute('data-paleta', nombre);
pintarPaletas();
dibujar();
}
function abrirModal(em, titulo, texto, clase) {
porId('modalEm').textContent = em;
porId('modalT').textContent = titulo;
porId('modalT').className = 'modal-t ' + clase;
porId('modalX').textContent = texto;
porId('modal').hidden = false;
}
var audioCtx = null, sonidoOn = true;
var NOTAS = {
tocar: [[600, 0, .05, 'sine', .06]],
salto: [[420, 0, .05, 'square', .09], [680, .04, .08, 'square', .07]],
punto: [[880, 0, .06, 'triangle', .07], [1320, .05, .07, 'triangle', .05]],
choque: [[180, 0, .12, 'sawtooth', .12], [110, .10, .18, 'sawtooth', .10], [70, .22, .22, 'square', .08]],
record: [[660, 0, .09, 'triangle', .11], [880, .09, .09, 'triangle', .11], [1175, .18, .12, 'triangle', .11], [1568, .30, .20, 'triangle', .10]]
};
function audio() {
if (audioCtx) return audioCtx;
try {
var C = window.AudioContext || window.webkitAudioContext;
if (!C) return null;
audioCtx = new C();
if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
} catch (e) { audioCtx = null; }
return audioCtx;
}
function nota(f, retraso, dur, tipo, vol) {
var a = audio();
if (!a) return;
try {
var t = a.currentTime + (retraso || 0);
var o = a.createOscillator(), g = a.createGain();
o.type = tipo || 'triangle';
o.frequency.value = f;
g.gain.setValueAtTime(0.0001, t);
g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
o.connect(g); g.connect(a.destination);
o.start(t); o.stop(t + dur + 0.03);
} catch (e) { }
}
function sonar(que) {
if (!sonidoOn) return;
var lista = NOTAS[que];
if (!lista) return;
for (var i = 0; i < lista.length; i++) nota(lista[i][0], lista[i][1], lista[i][2], lista[i][3], lista[i][4]);
}
var ultimo = 0;
function bucle(t) {
var ms = ultimo ? t - ultimo : 16;
ultimo = t;
if (manual) { requestAnimationFrame(bucle); return; }
if (enJuego && !pausado && !muerto) { paso(ms); dibujar(); }
else if (pausado && !muerto && pantalla === 'juego') dibujar();
requestAnimationFrame(bucle);
}
porId('btnSonido').addEventListener('click', function () {
sonidoOn = !sonidoOn;
porId('btnSonido').textContent = sonidoOn ? '🔊' : '🔇';
porId('btnSonido').className = 'sonido' + (sonidoOn ? '' : ' off');
if (sonidoOn) sonar('tocar');
});
porId('btnSaltar').addEventListener('click', function () { salto(); });
porId('btnPausa').addEventListener('click', function () { sonar('tocar'); pausar(); });
porId('marco').addEventListener('click', function () {
if (muerto) return;
if (pausado) pausar(false);
else salto();
});
porId('btnNueva').addEventListener('click', function () { sonar('tocar'); nuevaCarrera(); });
porId('btnBorrar').addEventListener('click', function () { sonar('tocar'); record = 0; try{ localStorage.removeItem('goku_dino_record'); }catch(e){} pintarHud(); });
porId('btnMenu').addEventListener('click', function () { sonar('tocar'); mostrar('pNivel'); });
porId('modalB').addEventListener('click', function () { sonar('tocar'); nuevaCarrera(); });
try{ record = parseInt(localStorage.getItem('goku_dino_record')||'0',10)||0; }catch(e){}
pintarIconos();
pintarNiveles();
pintarPaletas();
mostrar('pNivel');
dibujar();
pintarHud();
requestAnimationFrame(bucle);
</script>
</body>
</html>`

let handler = async (m, { conn, usedPrefix }) => {
  await conn.sendMessage(m.chat, {
    text: `╭┈──◯◝ ⬢ *GOKU DINO* 🦕\n┆ ❀ *Corredor infinito · 4 velocidades*\n┆ ❀ 🐢 Tranquilo · 🦎 Normal · 🔥 Rápido · 💀 Insano\n┆ ❀ 4 paletas: Neón, Atardecer, Noche, Menta\n┆ ❀ Tocá para saltar, aguantá lo más que puedas\n╰┈──◯◞ ✿ GOKU BOT\n> 🌸 Abre el archivo y juega ♡`
  }, { quoted: m })

  const file = path.join(os.tmpdir(), 'goku-dino-' + Date.now() + '.html')
  fs.writeFileSync(file, HTML)

  await conn.sendMessage(m.chat, {
    document: fs.readFileSync(file),
    mimetype: 'text/html',
    fileName: 'goku-dino-runner.html'
  }, { quoted: m })

  try { fs.unlinkSync(file) } catch {}
}

handler.command = ['dino', 'dinorunner', 'dinosaurio', 'dinogame']
handler.tags = ['juegos']
handler.help = ['dino']
export default handler
