import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Rocket, PartyPopper, Lightbulb, LayoutDashboard, TrendingUp,
  School, GraduationCap, ClipboardList, Users, Star, CheckCircle,
} from 'lucide-react';
import BIQLogo from './BIQLogo';

const BUSINESS_MESSAGES = [
  { text: "You're all set!",              Icon: Rocket },
  { text: "Welcome aboard!",              Icon: PartyPopper },
  { text: "Let's build something great!", Icon: Lightbulb },
  { text: "Your dashboard is ready!",     Icon: LayoutDashboard },
  { text: "Time to grow your business!",  Icon: TrendingUp },
];

const SCHOOL_MESSAGES = [
  { text: "School portal is ready!",                   Icon: School },
  { text: "Empower every student today!",              Icon: GraduationCap },
  { text: "Track fees, marks and attendance!",         Icon: ClipboardList },
  { text: "Your staff is set to go!",                  Icon: Users },
  { text: "Shaping the future, one student at a time!", Icon: Star },
];

const WORD_INTERVAL  = 180;
const MSG_LINGER     = 900;
const FINAL_LINGER   = 2200;

function calcDuration(messages) {
  return messages.reduce((acc, m) => acc + m.text.split(' ').length * WORD_INTERVAL + MSG_LINGER, 0) + FINAL_LINGER;
}

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function useFireworks(canvasRef, active) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#f43f5e','#ec4899','#a855f7','#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#fff'];

    function burst(x, y) {
      const count = Math.floor(randomBetween(60, 100));
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + randomBetween(-0.2, 0.2);
        const speed = randomBetween(2, 9);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: randomBetween(2, 5),
          decay: randomBetween(0.012, 0.022),
          gravity: randomBetween(0.08, 0.18),
          trail: [],
        });
      }
    }

    const launchBurst = () => burst(
      randomBetween(canvas.width * 0.15, canvas.width * 0.85),
      randomBetween(canvas.height * 0.1, canvas.height * 0.55),
    );

    for (let i = 0; i < 5; i++) setTimeout(launchBurst, i * 180);
    const interval = setInterval(launchBurst, 420);

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 6) p.trail.shift();
        for (let t = 0; t < p.trail.length - 1; t++) {
          ctx.beginPath();
          ctx.moveTo(p.trail[t].x, p.trail[t].y);
          ctx.lineTo(p.trail[t + 1].x, p.trail[t + 1].y);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (p.alpha * t) / p.trail.length * 0.4;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.98; p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(animId); clearInterval(interval); window.removeEventListener('resize', resize); };
  }, [active, canvasRef]);
}

function WordByWord({ text, onComplete }) {
  const words = text.split(' ');
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    let idx = 0;
    const t = setInterval(() => {
      idx++;
      setShown(idx);
      if (idx >= words.length) {
        clearInterval(t);
        setTimeout(onComplete, MSG_LINGER);
      }
    }, WORD_INTERVAL);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span>
      {words.map((w, i) => (
        <span key={i} style={{
          display: 'inline-block', marginRight: '0.3em',
          opacity: i < shown ? 1 : 0,
          transform: i < shown ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}>
          {w}
        </span>
      ))}
    </span>
  );
}

export default function SuccessFireworks({ name = '', businessType = '', onDone }) {
  const isSchool = businessType === 'school';
  const MESSAGES = isSchool ? SCHOOL_MESSAGES : BUSINESS_MESSAGES;
  const TOTAL_DURATION = calcDuration(MESSAGES);

  const canvasRef = useRef(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const isLast = msgIdx === MESSAGES.length - 1;

  useFireworks(canvasRef, visible);

  const handleWordsDone = useCallback(() => {
    if (isLast) {
      setTimeout(() => { setVisible(false); onDone?.(); }, FINAL_LINGER);
    } else {
      setMsgIdx(i => i + 1);
    }
  }, [isLast, onDone]);

  if (!visible) return null;

  const { Icon: MsgIcon } = MESSAGES[msgIdx];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">

        {/* Logo */}
        <div className="drop-shadow-2xl" style={{ animation: 'floatLogo 2s ease-in-out infinite' }}>
          <BIQLogo size={80} />
        </div>

        {/* Checkmark */}
        <div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl"
          style={{ boxShadow: '0 0 40px rgba(16,185,129,0.6)', animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both' }}
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Name */}
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg"
          style={{ animation: 'fadeUp 0.6s ease both' }}
        >
          {name ? `Welcome, ${name}!` : isSchool ? 'Welcome to School Portal!' : 'Welcome to BusinessIQ!'}
        </h1>

        {/* Icon + word-by-word message */}
        <div
          key={msgIdx}
          className="flex items-center justify-center gap-3 text-xl sm:text-2xl font-bold text-purple-300 min-h-[2.5rem]"
          style={{ animation: 'fadeUp 0.3s ease both' }}
        >
          <MsgIcon className="w-7 h-7 flex-shrink-0 text-purple-300" />
          <WordByWord text={MESSAGES[msgIdx].text} onComplete={handleWordsDone} />
        </div>

        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            style={{ animation: `fillBar ${TOTAL_DURATION}ms linear forwards` }}
          />
        </div>

        {isLast && (
          <p className="text-white/60 text-sm" style={{ animation: 'fadeUp 0.5s ease both' }}>
            Taking you to your dashboard…
          </p>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity:0; transform:scale(0.4); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes floatLogo {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-10px); }
        }
        @keyframes fillBar {
          from { width:0%; }
          to   { width:100%; }
        }
      `}</style>
    </div>
  );
}
