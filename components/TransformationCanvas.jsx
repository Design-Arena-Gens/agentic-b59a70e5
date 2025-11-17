"use client";
import { useEffect, useRef, useState } from "react";

const WIDTH = 1280;
const HEIGHT = 720;
const DURATION_MS = 8000; // total animation duration

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function TransformationCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const startRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState("");
  const recRef = useRef({ recorder: null, chunks: [], recording: false, resolveStop: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = true;

    function drawBackground(tNorm) {
      // starry sky
      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      grad.addColorStop(0, "#020615");
      grad.addColorStop(1, "#00040c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // stars flicker
      const rng = (seed) => {
        let x = Math.sin(seed * 999.133) * 10000;
        return x - Math.floor(x);
      };
      const starCount = 220;
      for (let i = 0; i < starCount; i++) {
        const sx = Math.floor(rng(i + 1) * WIDTH);
        const sy = Math.floor(rng(i + 2) * (HEIGHT * 0.7));
        const base = 0.4 + rng(i + 3) * 0.6;
        const twinkle = 0.5 + 0.5 * Math.sin(tNorm * 20 + i);
        const a = base * twinkle * 0.9;
        ctx.fillStyle = `rgba(200,220,255,${a})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // horizon mist
      const g2 = ctx.createLinearGradient(0, HEIGHT * 0.6, 0, HEIGHT);
      g2.addColorStop(0, "rgba(200,220,255,0.0)");
      g2.addColorStop(1, "rgba(150,180,255,0.12)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.45);
    }

    function drawMoon(tNorm) {
      const cx = WIDTH * 0.78;
      const cy = HEIGHT * 0.24;
      const baseR = 100;

      // phase growth 0->1 from 0.1s to 2s
      const phaseStart = 0.1;
      const phaseEnd = 0.25;
      const p = Math.max(0, Math.min(1, (tNorm - phaseStart) / (phaseEnd - phaseStart)));
      const e = easeInOutCubic(p);

      // main disc
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,250,255,${0.15 + 0.6 * e})`;
      ctx.fill();

      // crescent reveal
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.beginPath();
      ctx.arc(cx + lerp(70, 0, e), cy, baseR * (0.2 + 0.8 * e), 0, Math.PI * 2);
      ctx.fillStyle = "#eef6ff";
      ctx.fill();
      ctx.restore();

      // halo
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + 18 * i, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(190,220,255,${0.04 - i * 0.006})`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    }

    function drawFigure(tNorm) {
      // Figure emerges 0.2->0.6, armor coalesces 0.5->1.0
      const appear = Math.max(0, Math.min(1, (tNorm - 0.2) / 0.4));
      const armor = Math.max(0, Math.min(1, (tNorm - 0.5) / 0.5));
      const aE = easeInOutCubic(appear);
      const aA = easeInOutCubic(armor);

      const baseX = WIDTH * 0.35;
      const baseY = HEIGHT * 0.62;

      ctx.save();
      ctx.translate(baseX, baseY);

      const cloakWave = Math.sin(tNorm * Math.PI * 2 * 0.8) * 8 * (0.5 + 0.5 * aE);

      // shadow/ground
      ctx.beginPath();
      ctx.ellipse(0, 8, 120, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.2 + 0.25 * aE})`;
      ctx.fill();

      // cloak
      ctx.beginPath();
      ctx.moveTo(-20, -180);
      ctx.bezierCurveTo(-160 - cloakWave, -120, -180, -40, -100, 10);
      ctx.bezierCurveTo(-40, 20, -20, 30, 0, 0);
      ctx.closePath();
      ctx.fillStyle = `rgba(18,24,40,${0.8 * aE})`;
      ctx.fill();

      // torso
      ctx.beginPath();
      ctx.roundRect(-28, -150, 56, 120, 12);
      ctx.fillStyle = `rgba(15,20,32,${0.9 * aE})`;
      ctx.fill();

      // head
      ctx.beginPath();
      ctx.arc(0, -174, 24, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(12,16,28,${aE})`;
      ctx.fill();

      // arms
      ctx.beginPath();
      ctx.roundRect(-58, -130, 30, 88, 14);
      ctx.roundRect(28, -130, 30, 88, 14);
      ctx.fillStyle = `rgba(12,16,28,${0.95 * aE})`;
      ctx.fill();

      // eyes glow
      const eyeGlow = 0.25 + 0.75 * aA;
      ctx.beginPath();
      ctx.ellipse(-8, -176, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -176, 5, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * eyeGlow})`;
      ctx.fill();

      // armor lines
      ctx.strokeStyle = `rgba(230,240,255,${0.1 + 0.8 * aA})`;
      ctx.lineWidth = 2;
      const rings = 6;
      for (let i = 0; i < rings; i++) {
        ctx.beginPath();
        const r = 26 + i * 12;
        ctx.arc(0, -108, r, Math.PI * 0.1, Math.PI * (1.9 - 0.1));
        ctx.stroke();
      }
      // crescent chest emblem
      ctx.beginPath();
      ctx.arc(0, -92, 20, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245,250,255,${0.2 + 0.8 * aA})`;
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.beginPath();
      ctx.arc(6, -92, 18, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,250,255,${0.4 + 0.6 * aA})`;
      ctx.fill();
      ctx.restore();

      // highlight edges
      ctx.strokeStyle = `rgba(200,230,255,${0.08 + 0.4 * aA})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-28, -150);
      ctx.lineTo(-28, -30);
      ctx.moveTo(28, -150);
      ctx.lineTo(28, -30);
      ctx.stroke();

      ctx.restore();
    }

    function drawSwirls(tNorm) {
      // energy swirls around figure as armor forms
      const s = Math.max(0, Math.min(1, (tNorm - 0.45) / 0.25));
      if (s <= 0) return;
      const e = easeInOutCubic(s);
      const cx = WIDTH * 0.35;
      const cy = HEIGHT * 0.48;

      for (let i = 0; i < 28; i++) {
        const a = i / 28 * Math.PI * 2 + tNorm * 4.0;
        const r = 40 + i * 3 + Math.sin(tNorm * 5 + i) * 3;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.6;
        const alpha = 0.06 + 0.12 * e * (i / 28);
        const size = 1 + (i % 3);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 16 + size * 4);
        grad.addColorStop(0, `rgba(190,220,255,${alpha})`);
        grad.addColorStop(1, "rgba(190,220,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 16 + size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function renderFrame(ts) {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const tNorm = Math.min(1, elapsed / DURATION_MS);

      drawBackground(tNorm);
      drawMoon(tNorm);
      drawFigure(tNorm);
      drawSwirls(tNorm);

      if (elapsed < DURATION_MS) {
        rafRef.current = requestAnimationFrame(renderFrame);
      } else if (recRef.current.recording) {
        recRef.current.recorder?.stop();
      }
    }

    function startAnimation() {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      rafRef.current = requestAnimationFrame(renderFrame);
    }

    function recordAnimation() {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(60);
      const options = { mimeType: "video/webm;codecs=vp9,opus" };
      const recorder = new MediaRecorder(stream, options);
      recRef.current.chunks = [];
      recRef.current.recorder = recorder;
      recRef.current.recording = true;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recRef.current.chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recRef.current.chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        recRef.current.recording = false;
        const link = document.getElementById("downloadLink");
        if (link) {
          link.href = url;
          link.style.display = "inline";
        }
      };

      recorder.start();
      startAnimation();

      setTimeout(() => {
        if (recRef.current.recording) recorder.stop();
      }, DURATION_MS + 120);
    }

    const onPlay = () => startAnimation();
    const onRecord = () => {
      if (!("MediaRecorder" in window)) {
        alert("MediaRecorder not supported in this browser.");
        startAnimation();
      } else {
        recordAnimation();
      }
    };

    document.addEventListener("mk:play", onPlay);
    document.addEventListener("mk:record", onRecord);

    // auto-play once on mount
    startAnimation();

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mk:play", onPlay);
      document.removeEventListener("mk:record", onRecord);
    };
  }, []);

  return (
    <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ width: "100%", height: "100%", display: "block", background: "#000" }} />
  );
}
