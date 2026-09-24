import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { seedGifts } from "@/lib/seed";
import type { Gift, GiftInput } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gifts.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function ensureStore(): Promise<Gift[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Gift[];
    return parsed.map((g) => ({
      ...g,
      brand: g.brand ?? null,
      category: g.category ?? null,
      notes: g.notes ?? null,
      link: g.link ?? null,
      avg_price: g.avg_price ?? null,
    }));
  } catch {
    const gifts: Gift[] = seedGifts.map((g) => ({
      ...g,
      id: randomUUID(),
    }));
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(gifts, null, 2), "utf8");
    return gifts;
  }
}

async function persist(gifts: Gift[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(gifts, null, 2), "utf8");
}

export async function localListGifts(): Promise<Gift[]> {
  return enqueue(async () => {
    const gifts = await ensureStore();
    return [...gifts].sort((a, b) => a.sort_order - b.sort_order);
  });
}

export async function localCreateGift(input: GiftInput): Promise<Gift> {
  return enqueue(async () => {
    const gifts = await ensureStore();
    const maxOrder = gifts.reduce((m, g) => Math.max(m, g.sort_order), 0);
    const gift: Gift = {
      id: randomUUID(),
      title: input.title.trim(),
      brand: input.brand?.trim() || null,
      category: input.category?.trim() || null,
      notes: input.notes?.trim() || null,
      link: input.link?.trim() || null,
      avg_price:
        input.avg_price == null || Number.isNaN(Number(input.avg_price))
          ? null
          : Number(input.avg_price),
      claimed_by: null,
      claimed_at: null,
      sort_order: input.sort_order ?? maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    gifts.push(gift);
    await persist(gifts);
    return gift;
  });
}

export async function localUpdateGift(
  id: string,
  patch: Partial<
    Pick<Gift, "title" | "brand" | "category" | "notes" | "link" | "avg_price" | "sort_order">
  >,
): Promise<Gift | null> {
  return enqueue(async () => {
    const gifts = await ensureStore();
    const idx = gifts.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    gifts[idx] = {
      ...gifts[idx],
      ...patch,
      title: patch.title?.trim() ?? gifts[idx].title,
      brand:
        patch.brand === undefined ? gifts[idx].brand : patch.brand?.trim() || null,
      category:
        patch.category === undefined
          ? gifts[idx].category
          : patch.category?.trim() || null,
      notes:
        patch.notes === undefined ? gifts[idx].notes : patch.notes?.trim() || null,
      link:
        patch.link === undefined ? gifts[idx].link : patch.link?.trim() || null,
      avg_price:
        patch.avg_price === undefined
          ? gifts[idx].avg_price
          : patch.avg_price == null || Number.isNaN(Number(patch.avg_price))
            ? null
            : Number(patch.avg_price),
    };
    await persist(gifts);
    return gifts[idx];
  });
}

export async function localDeleteGift(id: string): Promise<boolean> {
  return enqueue(async () => {
    const gifts = await ensureStore();
    const next = gifts.filter((g) => g.id !== id);
    if (next.length === gifts.length) return false;
    await persist(next);
    return true;
  });
}

export async function localClaimGift(
  id: string,
  name: string,
): Promise<{ gift: Gift | null; conflict: boolean }> {
  return enqueue(async () => {
    const gifts = await ensureStore();
    const idx = gifts.findIndex((g) => g.id === id);
    if (idx === -1) return { gift: null, conflict: false };
    if (gifts[idx].claimed_by) return { gift: gifts[idx], conflict: true };
    gifts[idx] = {
      ...gifts[idx],
      claimed_by: name.trim(),
      claimed_at: new Date().toISOString(),
    };
    await persist(gifts);
    return { gift: gifts[idx], conflict: false };
  });
}

export async function localReleaseGift(
  id: string,
  name?: string,
): Promise<{ gift: Gift | null; mismatch: boolean }> {
  return enqueue(async () => {
    const gifts = await ensureStore();
    const idx = gifts.findIndex((g) => g.id === id);
    if (idx === -1) return { gift: null, mismatch: false };
    if (name !== undefined) {
      const expected = (gifts[idx].claimed_by || "").trim().toLowerCase();
      const actual = name.trim().toLowerCase();
      if (!expected || expected !== actual) {
        return { gift: gifts[idx], mismatch: true };
      }
    }
    gifts[idx] = {
      ...gifts[idx],
      claimed_by: null,
      claimed_at: null,
    };
    await persist(gifts);
    return { gift: gifts[idx], mismatch: false };
  });
}
