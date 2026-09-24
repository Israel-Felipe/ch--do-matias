import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "matias_admin";

function hashPassword(password: string): string {
  return createHash("sha256").update(`cha-matias:${password}`).digest("hex");
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "matias2026";
}

export function verifyAdminPassword(password: string): boolean {
  const expected = hashPassword(getAdminPassword());
  const actual = hashPassword(password);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  } catch {
    return false;
  }
}

export function makeAdminToken(): string {
  return hashPassword(getAdminPassword());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = makeAdminToken();
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
