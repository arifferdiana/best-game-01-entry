// Lightweight particles: ember sparks, landing dust and collect bursts. They are
// purely visual and never affect the rules.
export function createParticles() {
  const list = [];

  function add(p) {
    if (list.length > 400) list.shift();
    list.push(p);
  }

  return {
    get all() {
      return list;
    },
    clear() {
      list.length = 0;
    },
    /** A soft dust puff (landing, running). */
    puff(x, y, count = 6) {
      for (let i = 0; i < count; i += 1) {
        add({
          x: x + (Math.random() - 0.5) * 18,
          y: y - Math.random() * 4,
          vx: (Math.random() - 0.5) * 90,
          vy: -Math.random() * 50 - 10,
          life: 0.45,
          maxLife: 0.45,
          size: 3 + Math.random() * 4,
          color: '#d8b48a',
          gravity: -60,
          glow: false,
        });
      }
    },
    /** Bright ember sparks (jump, collect, portal). */
    burst(x, y, color, count = 14, speed = 160) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.6);
        add({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v - 60,
          life: 0.6,
          maxLife: 0.6,
          size: 2 + Math.random() * 3,
          color,
          gravity: 320,
          glow: true,
        });
      }
    },
    /** One rising ember mote for the ambient air. */
    mote(x, y) {
      add({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: -18 - Math.random() * 22,
        life: 2.5,
        maxLife: 2.5,
        size: 1.5 + Math.random() * 2,
        color: '#ffb347',
        gravity: -8,
        glow: true,
      });
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const p = list[i];
        p.life -= dt;
        if (p.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
  };
}
