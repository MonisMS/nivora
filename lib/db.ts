import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon's free-tier compute auto-suspends and the first request after idle (or a
// flaky IPv6 hop) can fail with "fetch failed" before reaching the database. A
// failed fetch never executed the query, so retrying is safe — even for writes.
neonConfig.fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr;
};

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
