import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PixPledge } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "pix-pledges.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function ensureStore(): Promise<PixPledge[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as PixPledge[];
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

async function persist(items: PixPledge[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function localListPixPledges(): Promise<PixPledge[]> {
  return enqueue(async () => {
    const items = await ensureStore();
    return [...items].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  });
}

export async function localCreatePixPledge(name: string): Promise<PixPledge> {
  return enqueue(async () => {
    const items = await ensureStore();
    const pledge: PixPledge = {
      id: randomUUID(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };
    items.push(pledge);
    await persist(items);
    return pledge;
  });
}

export async function localDeletePixPledge(id: string): Promise<boolean> {
  return enqueue(async () => {
    const items = await ensureStore();
    const next = items.filter((p) => p.id !== id);
    if (next.length === items.length) return false;
    await persist(next);
    return true;
  });
}
