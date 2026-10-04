import { useEffect, useMemo, useRef } from "react";

// Layered animated background (all behind the page, never intercepts clicks):
//   1. soft drifting aurora gradients + a slow-moving grid   (pure CSS)
//   2. a twinkling night-sky of stars                       (canvas)
//   3. a two-layer city skyline whose windows light up and
//      switch off at random — fits the real-estate theme    (canvas)
//   4. gently rising glow particles                          (pure CSS)
// The canvas pauses when the tab is hidden, caps its frame rate, scales down on
// phones, and renders a single still frame for users who prefer reduced motion.
export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 14 + Math.random() * 18,
        delay: Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let lastFrame = 0;
    let layers = [];
    let stars = [];
    let resizeTimer;

    const rand = (a, b) => a + Math.random() * (b - a);

    function makeLayer({ minH, maxH, fill, edge, windowColor, litChance, minW, maxW }) {
      const buildings = [];
      let x = -10;
      while (x < w + 10) {
        const bw = rand(minW, maxW);
        const bh = h * rand(minH, maxH);
        const cell = w < 640 ? 12 : 10;
        const cols = Math.max(1, Math.floor((bw - 8) / cell));
        const rows = Math.max(1, Math.floor((bh - 12) / (cell + 4)));
        const wins = [];
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            wins.push({
              x: x + 5 + c * cell,
              y: h - bh + 8 + r * (cell + 4),
              lit: Math.random() < litChance,
            });
          }
        }
        buildings.push({ x, w: bw, h: bh, wins });
        x += bw + rand(1, 6);
      }
      return { buildings, fill, edge, windowColor, litChance, winSize: w < 640 ? 4 : 3.5 };
    }

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const small = w < 640;
      layers = [
        makeLayer({
          minH: 0.1, maxH: 0.3, fill: "rgba(12,17,30,0.78)", edge: "rgba(251,191,36,0.10)",
          windowColor: "251,191,36", litChance: 0.14, minW: small ? 28 : 44, maxW: small ? 56 : 90,
        }),
        makeLayer({
          minH: 0.05, maxH: 0.2, fill: "rgba(7,10,19,0.92)", edge: "rgba(251,191,36,0.22)",
          windowColor: "253,224,71", litChance: 0.22, minW: small ? 34 : 56, maxW: small ? 70 : 120,
        }),
      ];
      stars = Array.from({ length: small ? 28 : 70 }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        r: rand(0.4, 1.4),
        phase: Math.random() * Math.PI * 2,
        speed: rand(0.4, 1.4),
      }));
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      // stars
      for (const s of stars) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 1000 * s.speed + s.phase));
        ctx.fillStyle = `rgba(255,244,214,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // warm horizon glow
      const glow = ctx.createLinearGradient(0, h * 0.7, 0, h);
      glow.addColorStop(0, "rgba(245,158,11,0)");
      glow.addColorStop(1, "rgba(245,158,11,0.10)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      // skyline (far layer first)
      for (const layer of layers) {
        for (const b of layer.buildings) {
          const top = h - b.h;
          ctx.fillStyle = layer.fill;
          ctx.fillRect(b.x, top, b.w, b.h);
          ctx.fillStyle = layer.edge;
          ctx.fillRect(b.x, top, b.w, 1);
        }
        for (const b of layer.buildings) {
          for (const win of b.wins) {
            if (!win.lit) continue;
            ctx.fillStyle = `rgba(${layer.windowColor},0.55)`;
            ctx.fillRect(win.x, win.y, layer.winSize, layer.winSize);
          }
        }
      }
    }

    // a few random windows switch on/off every frame
    function flicker() {
      for (const layer of layers) {
        for (let i = 0; i < 3; i++) {
          const b = layer.buildings[(Math.random() * layer.buildings.length) | 0];
          if (!b || !b.wins.length) continue;
          const win = b.wins[(Math.random() * b.wins.length) | 0];
          win.lit = !win.lit;
        }
      }
    }

    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (t - lastFrame < 66) return; // ~15 fps is plenty for slow twinkling
      lastFrame = t;
      flicker();
      draw(t);
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduceMotion) raf = requestAnimationFrame(loop);
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        draw(performance.now());
      }, 200);
    }

    build();
    draw(performance.now());
    if (!reduceMotion) raf = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="bg-root" aria-hidden="true">
      <div className="flow-bg" />
      <div className="flow-grid" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
