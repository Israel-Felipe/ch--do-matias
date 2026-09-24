"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const WINDUP_MS = 2000;
const CATCH_RADIUS = 24;
const ESCAPE_RADIUS = 70;
const SPAWN_EVERY_MS = 10_000;
const MAX_BEES = 8;
const BEE_HALF = 28;
const SEPARATION = 72;
/** Depois de 1 min fugindo, acelera a cada 5s. */
const SPEEDUP_AFTER_MS = 60_000;
const SPEEDUP_EVERY_MS = 5_000;
const SPEEDUP_PER_TICK = 0.14;
const SPEEDUP_MAX = 2.8;
/** Depois de 2 min: emboscada — espalham e avançam só de perto. */
const AMBUSH_AFTER_MS = 120_000;
const AMBUSH_RADIUS = 210;
const AMBUSH_GIVE_UP = 280;

const HINT_IDLE = "Passe o mouse e espere um pouco… ela vem brincar";
const HINT_FLEE = "Agora fuja com o mouse antes que a abelha te pegue!";
const RECORD_KEY = "cha-matias-bee-flee-record-ms";

function readRecordMs(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(RECORD_KEY);
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeRecordMs(ms: number) {
  try {
    window.localStorage.setItem(RECORD_KEY, String(Math.floor(ms)));
  } catch {
    // ignore quota / private mode
  }
}

type Bee = {
  id: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  flipX: boolean;
  rotation: number;
  canCatch: boolean;
  primary: boolean;
  /** Persegue o mouse o tempo todo (ninho + abelha da data). */
  chaser: boolean;
  size: "sm" | "md";
  /** Multiplicador de velocidade (cada abelha é um pouco diferente). */
  speed: number;
  /** Fatia do cerco ao redor do cursor. */
  slot: number;
  /** Fase do orbitar (espalha o enxame). */
  phase: number;
  /** Posto na fase de emboscada (espalhadas pela tela). */
  postX: number;
  postY: number;
  /** Se está avançando no mouse na emboscada. */
  lunging: boolean;
};

const DATE_BEE_ID = -1;

function setDateNestHidden(hidden: boolean) {
  document.querySelectorAll<HTMLElement>("[data-bee-nest='date']").forEach((el) => {
    el.style.opacity = hidden ? "0" : "";
  });
}

function canChase() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
}

function formatFlee(ms: number) {
  const total = Math.max(0, ms) / 1000;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m}:${s.toFixed(1).padStart(4, "0")}`;
  return `${s.toFixed(1)}s`;
}

function randomSpawn(
  mouse: { x: number; y: number },
  others: Bee[],
) {
  const margin = 56;
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < 20; i++) {
    // Prefere bordas da tela pra fechar o espaço de fuga.
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = margin + Math.random() * (w - margin * 2);
      y = margin + Math.random() * 40;
    } else if (edge === 1) {
      x = w - margin - Math.random() * 40;
      y = margin + Math.random() * (h - margin * 2);
    } else if (edge === 2) {
      x = margin + Math.random() * (w - margin * 2);
      y = h - margin - Math.random() * 40;
    } else {
      x = margin + Math.random() * 40;
      y = margin + Math.random() * (h - margin * 2);
    }

    const farFromMouse = Math.hypot(x - mouse.x, y - mouse.y) > 160;
    const farFromPack = others.every(
      (b) => Math.hypot(x - b.x, y - b.y) > SEPARATION,
    );
    if (farFromMouse && farFromPack) return { x, y };
  }

  return { x: margin, y: h / 2 };
}

function packSpeedBoost(elapsedMs: number) {
  if (elapsedMs < SPEEDUP_AFTER_MS) return 1;
  const ticks = Math.floor((elapsedMs - SPEEDUP_AFTER_MS) / SPEEDUP_EVERY_MS) + 1;
  return Math.min(SPEEDUP_MAX, 1 + ticks * SPEEDUP_PER_TICK);
}

function assignAmbushPosts(bees: Bee[]) {
  const margin = 70;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const extras = bees.filter((b) => !b.chaser);
  const cols = Math.max(2, Math.ceil(Math.sqrt(Math.max(extras.length, 1))));
  const rows = Math.max(1, Math.ceil(extras.length / cols));

  extras.forEach((bee, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = (w - margin * 2) / cols;
    const cellH = (h - margin * 2) / rows;
    bee.postX = margin + col * cellW + cellW * (0.25 + Math.random() * 0.5);
    bee.postY = margin + row * cellH + cellH * (0.25 + Math.random() * 0.5);
    bee.lunging = false;
  });
}

function surroundTarget(
  bee: Bee,
  mouse: { x: number; y: number },
  packSize: number,
  elapsedSec: number,
) {
  const extras = Math.max(packSize - 1, 1);
  const tighten = Math.min(0.45, Math.max(0, (elapsedSec - 60) / 90) * 0.45);
  const ring = (48 + (bee.slot % 3) * 36) * (1 - tighten);
  const angle =
    (bee.slot / extras) * Math.PI * 2 + elapsedSec * 0.85 + bee.phase;
  let tx = mouse.x + Math.cos(angle) * ring;
  let ty = mouse.y + Math.sin(angle) * ring;

  const distToMouse = Math.hypot(mouse.x - bee.x, mouse.y - bee.y);
  if (distToMouse < 130) {
    const blend = 1 - distToMouse / 130;
    tx += (mouse.x - tx) * blend * 0.75;
    ty += (mouse.y - ty) * blend * 0.75;
  }

  return { x: tx, y: ty };
}

function ambushTarget(
  bee: Bee,
  mouse: { x: number; y: number },
  elapsedSec: number,
) {
  const distToMouse = Math.hypot(mouse.x - bee.x, mouse.y - bee.y);

  if (bee.lunging) {
    if (distToMouse > AMBUSH_GIVE_UP) bee.lunging = false;
    else return { x: mouse.x, y: mouse.y, lunge: true as const };
  }

  if (distToMouse < AMBUSH_RADIUS) {
    bee.lunging = true;
    return { x: mouse.x, y: mouse.y, lunge: true as const };
  }

  // Fica espalhada no posto, com leve flutuação.
  return {
    x: bee.postX + Math.sin(elapsedSec * 0.7 + bee.phase) * 22,
    y: bee.postY + Math.cos(elapsedSec * 0.55 + bee.phase * 1.3) * 22,
    lunge: false as const,
  };
}

function faceToward(
  bee: Bee,
  targetX: number,
  targetY: number,
): Pick<Bee, "flipX" | "rotation"> {
  const dx = targetX - bee.x;
  const dy = targetY - bee.y;
  if (Math.hypot(dx, dy) < 0.5) return { flipX: bee.flipX, rotation: bee.rotation };
  return {
    flipX: dx < 0,
    rotation: (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI,
  };
}

export function ChaseBee() {
  const nestRef = useRef<HTMLSpanElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const modeRef = useRef<"idle" | "windup" | "chase" | "return">("idle");
  const beesRef = useRef<Bee[]>([]);
  const nestHomeRef = useRef({ x: 0, y: 0 });
  const chaseStartedAtRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const nextIdRef = useRef(1);
  const ambushAssignedRef = useRef(false);
  const rafRef = useRef(0);
  const windupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bees, setBees] = useState<Bee[]>([]);
  const [active, setActive] = useState(false);
  const [hint, setHint] = useState(HINT_IDLE);
  const [fleeMs, setFleeMs] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [caughtLabel, setCaughtLabel] = useState<string | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const [newRecord, setNewRecord] = useState(false);

  useEffect(() => {
    setRecordMs(readRecordMs());
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
      if (windupRef.current) clearTimeout(windupRef.current);
      setDateNestHidden(false);
    };
  }, []);

  const publish = () => setBees(beesRef.current.map((b) => ({ ...b })));

  const captureNestHome = () => {
    if (!nestRef.current) return;
    const rect = nestRef.current.getBoundingClientRect();
    nestHomeRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const ensurePrimaryBee = () => {
    const home = nestHomeRef.current;
    const existing = beesRef.current.find((b) => b.primary);
    if (existing) {
      existing.homeX = home.x;
      existing.homeY = home.y;
      if (modeRef.current === "windup") {
        existing.x = home.x;
        existing.y = home.y;
      }
      return;
    }
    beesRef.current = [
      {
        id: 0,
        x: home.x,
        y: home.y,
        homeX: home.x,
        homeY: home.y,
        flipX: false,
        rotation: 0,
        canCatch: false,
        primary: true,
        chaser: true,
        size: "md",
        speed: 1,
        slot: 0,
        phase: 0,
        postX: home.x,
        postY: home.y,
        lunging: false,
      },
      ...beesRef.current.filter((b) => !b.primary),
    ];
  };

  const ensureDateBee = () => {
    if (beesRef.current.some((b) => b.id === DATE_BEE_ID)) return;
    const el = document.querySelector<HTMLElement>("[data-bee-nest='date']");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    beesRef.current.push({
      id: DATE_BEE_ID,
      x,
      y,
      homeX: x,
      homeY: y,
      flipX: false,
      rotation: 0,
      canCatch: false,
      primary: false,
      chaser: true,
      size: "sm",
      speed: 1.08,
      slot: 0,
      phase: Math.PI / 3,
      postX: x,
      postY: y,
      lunging: false,
    });
    setDateNestHidden(true);
  };

  const spawnBee = () => {
    if (beesRef.current.length >= MAX_BEES) return;
    const spot = randomSpawn(mouseRef.current, beesRef.current);
    const slot = beesRef.current.filter((b) => !b.chaser).length;
    beesRef.current.push({
      id: nextIdRef.current++,
      x: spot.x,
      y: spot.y,
      homeX: spot.x,
      homeY: spot.y,
      flipX: false,
      rotation: 0,
      canCatch: false,
      primary: false,
      chaser: false,
      size: "md",
      speed: 0.82 + Math.random() * 0.45,
      slot,
      phase: Math.random() * Math.PI * 2,
      postX: spot.x,
      postY: spot.y,
      lunging: false,
    });
  };

  const finishToIdle = () => {
    beesRef.current = [];
    setBees([]);
    modeRef.current = "idle";
    ambushAssignedRef.current = false;
    setDateNestHidden(false);
    setActive(false);
    setShowTimer(false);
    setCaughtLabel(null);
    setFleeMs(0);
    setHint(HINT_IDLE);
  };

  const loop = () => {
    const mode = modeRef.current;
    if (mode === "idle") return;

    const mouse = mouseRef.current;
    ensurePrimaryBee();
    ensureDateBee();

    if (mode === "windup") {
      for (const bee of beesRef.current) {
        Object.assign(bee, faceToward(bee, mouse.x, mouse.y));
        // A da data já começa a perseguir na contagem, pra não ficar parada.
        if (bee.chaser && !bee.primary) {
          const dx = mouse.x - bee.x;
          const dy = mouse.y - bee.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.5) {
            const step = Math.min(9, Math.max(3, dist * 0.1)) * bee.speed;
            bee.x += (dx / dist) * step;
            bee.y += (dy / dist) * step;
          }
        }
      }
      publish();
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (mode === "chase") {
      const now = performance.now();
      const elapsedMs = now - chaseStartedAtRef.current;
      const elapsedSec = elapsedMs / 1000;
      setFleeMs(elapsedMs);

      while (
        now >= nextSpawnAtRef.current &&
        beesRef.current.length < MAX_BEES
      ) {
        spawnBee();
        nextSpawnAtRef.current += SPAWN_EVERY_MS;
      }

      const pack = beesRef.current;
      const ambush = elapsedMs >= AMBUSH_AFTER_MS;

      if (ambush && !ambushAssignedRef.current) {
        assignAmbushPosts(pack);
        ambushAssignedRef.current = true;
      }

      let caught = false;
      const boost = packSpeedBoost(elapsedMs);

      for (const bee of pack) {
        let target: { x: number; y: number };
        let speedMul = bee.speed * boost;

        if (bee.chaser) {
          target = { x: mouse.x, y: mouse.y };
        } else if (ambush) {
          const amb = ambushTarget(bee, mouse, elapsedSec);
          target = { x: amb.x, y: amb.y };
          speedMul *= amb.lunge ? 1.55 : 0.62;
        } else {
          target = surroundTarget(bee, mouse, pack.length, elapsedSec);
        }

        const dx = target.x - bee.x;
        const dy = target.y - bee.y;
        const dist = Math.hypot(dx, dy);
        Object.assign(bee, faceToward(bee, mouse.x, mouse.y));

        const distToMouse = Math.hypot(mouse.x - bee.x, mouse.y - bee.y);
        if (distToMouse > ESCAPE_RADIUS) bee.canCatch = true;
        if (bee.canCatch && distToMouse < CATCH_RADIUS) {
          caught = true;
          break;
        }

        if (dist > 0.5) {
          const base = Math.min(11, Math.max(3.4, dist * 0.11));
          const step = base * speedMul;
          bee.x += (dx / dist) * step;
          bee.y += (dy / dist) * step;
        }
      }

      // Separação: evita empilhar uma em cima da outra.
      for (let i = 0; i < pack.length; i++) {
        for (let j = i + 1; j < pack.length; j++) {
          const a = pack[i];
          const b = pack[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < SEPARATION) {
            const push = ((SEPARATION - d) / SEPARATION) * 3.4;
            const nx = dx / d;
            const ny = dy / d;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
          }
        }
      }

      publish();

      if (caught) {
        const finalMs = performance.now() - chaseStartedAtRef.current;
        setFleeMs(finalMs);
        const prev = readRecordMs();
        if (finalMs > prev) {
          writeRecordMs(finalMs);
          setRecordMs(finalMs);
          setNewRecord(true);
          setCaughtLabel(`Novo recorde! Você fugiu por ${formatFlee(finalMs)}`);
        } else {
          setNewRecord(false);
          setCaughtLabel(`Pegou! Você fugiu por ${formatFlee(finalMs)}`);
        }
        setHint(HINT_IDLE);
        modeRef.current = "return";
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (mode === "return") {
      let allHome = true;
      const remaining: Bee[] = [];

      for (const bee of beesRef.current) {
        const dx = bee.homeX - bee.x;
        const dy = bee.homeY - bee.y;
        const dist = Math.hypot(dx, dy);
        Object.assign(bee, faceToward(bee, bee.homeX, bee.homeY));

        if (dist < 2) {
          bee.x = bee.homeX;
          bee.y = bee.homeY;
          if (bee.primary) {
            bee.flipX = false;
            bee.rotation = 0;
            remaining.push(bee);
          }
          // date / swarm: some ao chegar em casa
          continue;
        }

        allHome = false;
        const step = Math.min(14, Math.max(4, dist * 0.14));
        bee.x += (dx / dist) * step;
        bee.y += (dy / dist) * step;
        remaining.push(bee);
      }

      beesRef.current = remaining;
      publish();

      if (allHome) {
        finishToIdle();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }
  };

  const beginChase = () => {
    if (modeRef.current !== "windup") return;
    captureNestHome();
    ensurePrimaryBee();
    ensureDateBee();
    for (const bee of beesRef.current) bee.canCatch = false;
    chaseStartedAtRef.current = performance.now();
    nextSpawnAtRef.current = chaseStartedAtRef.current + SPAWN_EVERY_MS;
    ambushAssignedRef.current = false;
    setFleeMs(0);
    setShowTimer(true);
    setCaughtLabel(null);
    modeRef.current = "chase";
  };

  const onMouseEnter = () => {
    if (!canChase() || modeRef.current !== "idle") return;

    modeRef.current = "windup";
    setActive(true);
    setHint(HINT_FLEE);
    setCaughtLabel(null);
    setShowTimer(false);
    setNewRecord(false);
    captureNestHome();
    ensurePrimaryBee();
    ensureDateBee();
    publish();

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);

    if (windupRef.current) clearTimeout(windupRef.current);
    windupRef.current = setTimeout(beginChase, WINDUP_MS);
  };

  const primary = bees.find((b) => b.primary);
  const flying = bees.filter((b) => !b.primary || (active && b.primary));
  const useFixedPrimary = active && primary;

  return (
    <div
      className={`pointer-events-none absolute inset-0 hidden lg:block ${
        active ? "z-30" : "z-[5]"
      }`}
    >
      <div className="absolute top-[22%] right-[18%] xl:right-[22%]">
        {/* Ninho / abelha principal (slot fixo no layout) */}
        <span
          ref={nestRef}
          className={`relative z-[1] inline-flex h-14 w-14 items-center justify-center xl:h-16 xl:w-16 ${
            useFixedPrimary ? "pointer-events-none opacity-0" : "pointer-events-auto"
          }`}
          onMouseEnter={onMouseEnter}
        >
          <Image
            src="/images/abelha.png"
            alt=""
            width={120}
            height={120}
            draggable={false}
            className="illus-bee pointer-events-none w-14 select-none opacity-90 xl:w-16"
          />
        </span>

        <div className="absolute top-full left-1/2 mt-1.5 flex w-max max-w-[11.5rem] -translate-x-1/2 flex-col items-center gap-1 text-center xl:mt-2 xl:max-w-[13rem]">
          <p
            className={
              caughtLabel
                ? "font-body text-[0.78rem] leading-snug font-semibold tracking-wide text-copper xl:text-[0.85rem]"
                : hint === HINT_FLEE
                  ? "animate-soft-pulse font-display text-[0.95rem] leading-snug font-semibold tracking-wide text-copper drop-shadow-[0_1px_0_rgba(255,252,247,0.9)] xl:text-[1.05rem]"
                  : "font-body text-[0.62rem] leading-snug tracking-wide text-ink-soft/70 xl:text-[0.68rem]"
            }
          >
            {caughtLabel ?? hint}
          </p>
          {showTimer ? (
            <p className="font-body text-[0.95rem] font-bold tracking-wide text-ink xl:text-[1.05rem]">
              {formatFlee(fleeMs)}
            </p>
          ) : null}
          {recordMs > 0 ? (
            <p
              className={`font-body text-[0.68rem] tracking-wide xl:text-[0.72rem] ${
                newRecord
                  ? "font-bold text-copper"
                  : "font-semibold text-ink-soft/80"
              }`}
            >
              Recorde: {formatFlee(recordMs)}
            </p>
          ) : null}
        </div>
      </div>

      {flying.map((bee) => {
        if (bee.primary && !useFixedPrimary) return null;
        const half = bee.size === "sm" ? 16 : BEE_HALF;
        const box = bee.size === "sm" ? "h-8 w-8" : "h-14 w-14 xl:h-16 xl:w-16";
        const img = bee.size === "sm" ? "h-7 w-auto sm:h-8" : "w-14 xl:w-16";
        return (
          <span
            key={bee.id}
            className={`pointer-events-none fixed inline-flex items-center justify-center ${box}`}
            style={{
              left: bee.x - half,
              top: bee.y - half,
              willChange: "left, top, transform",
            }}
          >
            <Image
              src="/images/abelha.png"
              alt=""
              width={120}
              height={120}
              draggable={false}
              className={`pointer-events-none select-none opacity-90 ${img}`}
              style={{
                transform: `scaleX(${bee.flipX ? -1 : 1}) rotate(${bee.rotation}deg)`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
