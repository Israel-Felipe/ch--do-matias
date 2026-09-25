import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { normalizeGuestCounts } from "@/lib/rsvp-counts";
import type { Rsvp, RsvpInput } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "rsvps.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function ensureStore(): Promise<Rsvp[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return (JSON.parse(raw) as Rsvp[]).map((r) => ({
      ...r,
      adults: r.adults ?? r.guests ?? 0,
      children: r.children ?? 0,
    }));
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

async function persist(rsvps: Rsvp[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(rsvps, null, 2), "utf8");
}

export async function localListRsvps(): Promise<Rsvp[]> {
  return enqueue(async () => {
    const rsvps = await ensureStore();
    return [...rsvps].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  });
}

export async function localCreateRsvp(input: RsvpInput): Promise<Rsvp> {
  return enqueue(async () => {
    const rsvps = await ensureStore();
    const counts = normalizeGuestCounts(input);
    const bringing = input.status === "yes" ? Boolean(input.bringing) : false;
    const rsvp: Rsvp = {
      id: randomUUID(),
      name: input.name.trim(),
      guests: counts.guests,
      adults: counts.adults,
      children: counts.children,
      status: input.status,
      note: input.note?.trim() || null,
      bringing,
      bringing_what:
        bringing ? input.bringing_what?.trim() || null : null,
      created_at: new Date().toISOString(),
    };
    rsvps.push(rsvp);
    await persist(rsvps);
    return rsvp;
  });
}

export async function localUpdateRsvp(
  id: string,
  input: RsvpInput,
): Promise<Rsvp | null> {
  return enqueue(async () => {
    const rsvps = await ensureStore();
    const idx = rsvps.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const counts = normalizeGuestCounts(input);
    const bringing = input.status === "yes" ? Boolean(input.bringing) : false;
    rsvps[idx] = {
      ...rsvps[idx],
      name: input.name.trim(),
      guests: counts.guests,
      adults: counts.adults,
      children: counts.children,
      status: input.status,
      note: input.note?.trim() || null,
      bringing,
      bringing_what:
        bringing ? input.bringing_what?.trim() || null : null,
    };
    await persist(rsvps);
    return rsvps[idx];
  });
}

export async function localDeleteRsvp(id: string): Promise<boolean> {
  return enqueue(async () => {
    const rsvps = await ensureStore();
    const next = rsvps.filter((r) => r.id !== id);
    if (next.length === rsvps.length) return false;
    await persist(next);
    return true;
  });
}
