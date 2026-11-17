// Ember Leap: everything the eye sees, drawn on one canvas. The view is a fixed
// 960x540 logical frame scaled to the window; the world scrolls under a camera.
// All art is canvas-drawn (no images): a purple night sky, glowing lava, rocky
// ember-islands, a little flame spirit, gold orbs, fire-bats and a teal portal.
import { LAVA_Y, PALETTE, VIEW } from './config.js';
import { createRandom, randomRange } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const stars = [];
  const starRandom = createRandom(1337);
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: starRandom() * VIEW.width,
      y: starRandom() * 320,
      r: 0.6 + starRandom() * 1.4,
      phase: starRandom() * Math.PI * 2,
    });
  }
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    scale = Math.min(w / VIEW.width, h / VIEW.height);
    offsetX = (w - VIEW.width * scale) / 2;
    offsetY = (h - VIEW.height * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  }

  function drawSky(time, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Stars, twinkling.
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(time * 1.4 + s.phase);
      ctx.globalAlpha = 0.35 + 0.6 * tw;
      ctx.fillStyle = PALETTE.star;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // A big low moon.
    const moonX = 760 - camX * 0.05;
    const moonY = 92;
    const mg = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
    mg.addColorStop(0, 'rgba(255, 217, 160, 0.9)');
    mg.addColorStop(0.35, 'rgba(255, 217, 160, 0.25)');
    mg.addColorStop(1, 'rgba(255, 217, 160, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(moonX - 90, moonY - 90, 180, 180);
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();
    // Distant mountain ridges, two parallax layers.
    for (const [parallax, color, base, amp] of [
      [0.22, PALETTE.mountainFar, 430, 46],
      [0.4, PALETTE.mountainNear, 460, 34],
    ]) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, VIEW.height);
      for (let x = -20; x <= VIEW.width + 20; x += 20) {
        const wx = x + camX * parallax;
        const y = base + Math.sin(wx * 0.012) * amp + Math.sin(wx * 0.031 + 2) * amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(VIEW.width, VIEW.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawLava(time) {
    const g = ctx.createLinearGradient(0, LAVA_Y, 0, VIEW.height);
    g.addColorStop(0, PALETTE.lavaBright);
    g.addColorStop(0.25, PALETTE.lava);
    g.addColorStop(1, PALETTE.lavaDeep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, VIEW.height);
    ctx.lineTo(0, LAVA_Y + 4);
    for (let x = 0; x <= VIEW.width; x += 16) {
      ctx.lineTo(x, LAVA_Y + Math.sin(x * 0.03 + time * 2.2) * 4 + Math.sin(x * 0.011 - time * 1.3) * 3);
    }
    ctx.lineTo(VIEW.width, VIEW.height);
    ctx.closePath();
    ctx.fill();
    // Hot glow just above the surface.
    const glow = ctx.createLinearGradient(0, LAVA_Y - 34, 0, LAVA_Y);
    glow.addColorStop(0, 'rgba(255, 122, 26, 0)');
    glow.addColorStop(1, 'rgba(255, 122, 26, 0.35)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, LAVA_Y - 34, VIEW.width, 34);
    // Rising bubbles.
    ctx.fillStyle = 'rgba(255, 179, 71, 0.8)';
    for (let i = 0; i < 8; i += 1) {
      const bx = ((i * 137 + time * 24) % (VIEW.width + 40)) - 20;
      const by = LAVA_Y + 14 + ((i * 53) % 20);
      ctx.beginPath();
      ctx.arc(bx, by, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatform(p, time) {
    // Rocky island body.
    ctx.fillStyle = PALETTE.rock;
    roundRect(ctx, p.x, p.y, p.w, p.h, 10);
    ctx.fill();
    // Warm grassy top.
    ctx.fillStyle = PALETTE.rockTop;
    roundRect(ctx, p.x, p.y, p.w, 12, 6);
    ctx.fill();
    // Glowing rim along the top edge.
    ctx.strokeStyle = PALETTE.rockEdge;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 2 + p.x * 0.01);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 6, p.y + 2);
    ctx.lineTo(p.x + p.w - 6, p.y + 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Cracks in the rock.
    ctx.strokeStyle = PALETTE.rockDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.3, p.y + 14);
    ctx.lineTo(p.x + p.w * 0.36, p.y + p.h - 8);
    ctx.moveTo(p.x + p.w * 0.68, p.y + 14);
    ctx.lineTo(p.x + p.w * 0.62, p.y + p.h - 12);
    ctx.stroke();
    // Moving platforms get a pulsing chevron underneath.
    if (p.move) {
      ctx.fillStyle = `rgba(255, 179, 71, ${0.5 + 0.4 * Math.sin(time * 4)})`;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h + 12;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 4);
      ctx.lineTo(cx + 12, cy - 4);
      ctx.lineTo(cx, cy + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawSpikes(s) {
    const count = Math.max(2, Math.round(s.w / 15));
    const step = s.w / count;
    for (let i = 0; i < count; i += 1) {
      const x0 = s.x + i * step;
      const grad = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
      grad.addColorStop(0, PALETTE.spikeTip);
      grad.addColorStop(1, PALETTE.spike);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x0, s.y + s.h);
      ctx.lineTo(x0 + step / 2, s.y);
      ctx.lineTo(x0 + step, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawOrb(o, time) {
    const bob = Math.sin(time * 2 + o.x * 0.01) * 4;
    const pulse = 1 + 0.12 * Math.sin(time * 3 + o.x * 0.02);
    const r = 11 * pulse;
    const g = ctx.createRadialGradient(o.x, o.y + bob, 1, o.x, o.y + bob, r * 2.6);
    g.addColorStop(0, 'rgba(255, 210, 63, 0.55)');
    g.addColorStop(1, 'rgba(255, 210, 63, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(o.x, o.y + bob, r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.orb;
    ctx.beginPath();
    ctx.arc(o.x, o.y + bob, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.orbCore;
    ctx.beginPath();
    ctx.arc(o.x - 3, o.y + bob - 3, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBat(b, time) {
    const flap = Math.sin(time * 11 + b.phase);
    ctx.fillStyle = PALETTE.bat;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wings.
    ctx.fillStyle = PALETTE.batWing;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(b.x + side * 8, b.y);
      ctx.lineTo(b.x + side * 26, b.y - 10 - flap * 10);
      ctx.lineTo(b.x + side * 20, b.y + 8);
      ctx.closePath();
      ctx.fill();
    }
    // Eyes.
    ctx.fillStyle = '#ff5a3c';
    ctx.beginPath();
    ctx.arc(b.x - 4, b.y - 2, 1.8, 0, Math.PI * 2);
    ctx.arc(b.x + 4, b.y - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPortal(portal, time) {
    const cx = portal.x + portal.w / 2;
    const cy = portal.y + portal.h / 2;
    const pulse = 1 + 0.06 * Math.sin(time * 2.4);
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 64);
    g.addColorStop(0, 'rgba(45, 225, 194, 0.5)');
    g.addColorStop(1, 'rgba(45, 225, 194, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.portal;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20 * pulse, 34 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.portalCore;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12 * pulse, 22 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Swirling inner arc.
    ctx.strokeStyle = 'rgba(216, 255, 244, 0.9)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 28, 0, time * 2, time * 2 + Math.PI * 1.2);
    ctx.stroke();
  }

  function drawPlayer(p, time) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    // Blink while invincible.
    if (p.invincible > 0 && Math.floor(time * 12) % 2 === 0) return;
    // Squash and stretch.
    const k = p.squashT > 0 ? (p.squashT / 0.15) * 0.16 * p.squashSign : 0;
    const flick = Math.sin(time * 9 + p.x * 0.05) * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 - k * 0.7, 1 + k);
    // Glow.
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    g.addColorStop(0, 'rgba(255, 210, 63, 0.5)');
    g.addColorStop(1, 'rgba(255, 122, 26, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    // Flame tuft.
    ctx.fillStyle = PALETTE.playerCore;
    ctx.beginPath();
    ctx.moveTo(-7, -12);
    ctx.quadraticCurveTo(-12 - flick * 20, -26, 0, -30 - flick * 8);
    ctx.quadraticCurveTo(12 + flick * 20, -26, 7, -12);
    ctx.closePath();
    ctx.fill();
    // Body.
    const body = ctx.createRadialGradient(-4, -6, 2, 0, 0, 17);
    body.addColorStop(0, PALETTE.playerCore);
    body.addColorStop(0.55, PALETTE.playerBody);
    body.addColorStop(1, '#d63d00');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    // Eyes, looking the way the ember faces.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5 + p.face * 2, -2, 3.4, 0, Math.PI * 2);
    ctx.arc(5 + p.face * 2, -2, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#241428';
    ctx.beginPath();
    ctx.arc(-5 + p.face * 3.4, -2, 1.7, 0, Math.PI * 2);
    ctx.arc(5 + p.face * 3.4, -2, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles(particles, camX) {
    for (const pt of particles.all) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = alpha;
      if (pt.glow) ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function flameIcon(x, y, r, lit) {
    ctx.fillStyle = lit ? PALETTE.playerBody : 'rgba(255, 122, 26, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.6);
    ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.4, x, y - r);
    ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.4, x + r * 0.7, y + r * 0.6);
    ctx.quadraticCurveTo(x, y + r * 1.1, x - r * 0.7, y + r * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  function drawHud(state, screen) {
    // Top bar.
    ctx.fillStyle = 'rgba(21, 10, 46, 0.55)';
    roundRect(ctx, 12, 10, 300, 56, 10);
    ctx.fill();
    roundRect(ctx, VIEW.width - 262, 10, 250, 56, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.hudText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 21px system-ui, sans-serif';
    ctx.fillText(`SCORE ${String(state.score).padStart(5, '0')}`, 26, 30);
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.orb;
    ctx.beginPath();
    ctx.arc(34, 54, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.hudText;
    ctx.fillText(`${state.orbs} / ${state.orbsTotal}`, 48, 54);
    // Lives, level and timer on the right.
    for (let i = 0; i < 3; i += 1) {
      flameIcon(VIEW.width - 238 + i * 26, 30, 9, i < state.lives);
    }
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.hudText;
    ctx.fillText(state.level.name, VIEW.width - 26, 30);
    const mins = Math.floor(state.levelTime / 60);
    const secs = Math.floor(state.levelTime % 60);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}  •  LV ${state.levelIndex + 1}/3`, VIEW.width - 26, 54);
    // Controls hint at the start of level one.
    if (screen === SCREEN_PLAY && state.levelIndex === 0 && state.levelTime < 6) {
      ctx.textAlign = 'center';
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 243, 214, 0.85)';
      ctx.fillText('← → / A D move    •    SPACE jump (twice!)    •    P pause    •    R restart    •    M mute', VIEW.width / 2, VIEW.height - 18);
    }
  }

  function overlay(alpha) {
    ctx.fillStyle = `rgba(12, 6, 28, ${alpha})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  function centreText(lines, startY = 150) {
    let y = startY;
    for (const line of lines) {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(line.text, VIEW.width / 2, y);
      y += line.gap;
    }
  }

  function drawTitle(state, best) {
    overlay(0.45);
    // Title with a warm glow.
    ctx.save();
    ctx.shadowColor = '#ff7a1a';
    ctx.shadowBlur = 28;
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillStyle = '#ffd23f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EMBER LEAP', VIEW.width / 2, 150);
    ctx.restore();
    centreText([
      { text: 'A small ember crosses the lava sea.', font: '22px system-ui, sans-serif', color: PALETTE.hudText, gap: 44 },
      { text: 'Jump the spikes, dodge the fire-bats, gather every flame-orb,', font: '17px system-ui, sans-serif', color: PALETTE.hudDim, gap: 28 },
      { text: 'and reach the portal — three islands, three lives.', font: '17px system-ui, sans-serif', color: PALETTE.hudDim, gap: 52 },
      { text: '← → / A D  move      SPACE  jump ×2      P  pause      R  restart', font: '16px system-ui, sans-serif', color: PALETTE.hudText, gap: 44 },
      { text: best > 0 ? `BEST  ${best}` : 'No best score yet — set one!', font: 'bold 18px system-ui, sans-serif', color: PALETTE.orb, gap: 56 },
      { text: 'Press SPACE or click to start', font: 'bold 20px system-ui, sans-serif', color: '#fff', gap: 0 },
    ], 218);
  }

  function drawPaused() {
    overlay(0.55);
    centreText([
      { text: 'PAUSED', font: 'bold 48px system-ui, sans-serif', color: PALETTE.hudText, gap: 54 },
      { text: 'P to resume    •    R to restart', font: '18px system-ui, sans-serif', color: PALETTE.hudDim, gap: 0 },
    ]);
  }

  function drawClear(state) {
    overlay(0.5);
    centreText([
      { text: 'LEVEL CLEAR!', font: 'bold 52px system-ui, sans-serif', color: PALETTE.portal, gap: 52 },
      { text: `${state.level.name}  •  orbs ${state.orbs} / ${state.orbsTotal}`, font: '20px system-ui, sans-serif', color: PALETTE.hudText, gap: 36 },
      { text: `Time bonus  +${state.clearBonus - 500}    •    Level bonus  +500`, font: '18px system-ui, sans-serif', color: PALETTE.hudDim, gap: 44 },
      { text: `SCORE  ${state.score}`, font: 'bold 26px system-ui, sans-serif', color: PALETTE.orb, gap: 56 },
      { text: 'Press SPACE for the next island', font: 'bold 20px system-ui, sans-serif', color: '#fff', gap: 0 },
    ]);
  }

  function drawOver(state, best) {
    overlay(0.6);
    centreText([
      { text: 'GAME OVER', font: 'bold 56px system-ui, sans-serif', color: '#ff5a3c', gap: 52 },
      { text: 'The lava claims another ember…', font: '20px system-ui, sans-serif', color: PALETTE.hudText, gap: 40 },
      { text: `SCORE  ${state.score}      BEST  ${Math.max(best, state.score)}`, font: 'bold 22px system-ui, sans-serif', color: PALETTE.orb, gap: 56 },
      { text: 'Press R or SPACE to try again', font: 'bold 20px system-ui, sans-serif', color: '#fff', gap: 0 },
    ]);
  }

  function drawWin(state, best) {
    overlay(0.45);
    centreText([
      { text: 'EMBER MASTER!', font: 'bold 56px system-ui, sans-serif', color: PALETTE.portal, gap: 52 },
      { text: 'Three islands crossed. The lava sea is yours.', font: '20px system-ui, sans-serif', color: PALETTE.hudText, gap: 40 },
      { text: `FINAL SCORE  ${state.score}      BEST  ${Math.max(best, state.score)}`, font: 'bold 24px system-ui, sans-serif', color: PALETTE.orb, gap: 56 },
      { text: 'Press R or SPACE to play again', font: 'bold 20px system-ui, sans-serif', color: '#fff', gap: 0 },
    ]);
  }

  function draw(state, screen, best) {
    resize();
    const time = state.time;
    const camX = state.camera.x;
    drawSky(time, camX);
    ctx.save();
    ctx.translate(-camX, 0);
    for (const p of state.level.platforms) drawPlatform(p, time);
    for (const s of state.level.spikes) drawSpikes(s);
    for (const o of state.level.orbs) {
      if (!o.taken) drawOrb(o, time);
    }
    for (const b of state.level.bats) drawBat(b, time);
    drawPortal(state.level.portal, time);
    drawPlayer(state.player, time);
    drawParticles(state.particles, camX);
    ctx.restore();
    drawLava(time);
    drawHud(state, screen);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_CLEAR) drawClear(state);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
  }

  return { draw };
}
