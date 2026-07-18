import { Router } from "express";
import { db } from "@workspace/db";
import { searchSessionsTable, logsTable } from "@workspace/db";
import { CreateSearchBody, ListSearchesQueryParams } from "@workspace/api-zod";
import { eq, sql, count, desc } from "drizzle-orm";

const router = Router();

// List search sessions
router.get("/searches", async (req, res) => {
  try {
    const parsed = ListSearchesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const { page = 1, pageSize = 20 } = parsed.data;
    const offset = (page - 1) * pageSize;

    const [sessions, totalResult] = await Promise.all([
      db
        .select()
        .from(searchSessionsTable)
        .orderBy(desc(searchSessionsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(searchSessionsTable),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    return res.json({
      sessions: sessions.map(serializeSession),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list searches");
    return res.status(500).json({ error: "Failed to list searches" });
  }
});

// Create search session (simulates starting a search)
router.post("/searches", async (req, res) => {
  try {
    const parsed = CreateSearchBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid search parameters" });
    }

    const { keyword, city, country, state, postalCode, radius, category, maxResults = 20, language } = parsed.data;

    const [session] = await db
      .insert(searchSessionsTable)
      .values({
        keyword,
        city,
        country: country ?? null,
        state: state ?? null,
        postalCode: postalCode ?? null,
        radius: radius ?? null,
        category: category ?? null,
        maxResults,
        language: language ?? null,
        status: "running",
        businessesFound: 0,
        businessesSaved: 0,
        startedAt: new Date(),
      })
      .returning();

    // Log the search start
    await db.insert(logsTable).values({
      level: "info",
      module: "SearchService",
      message: `Search started: "${keyword}" in ${city}${country ? `, ${country}` : ""}`,
    });

    // Simulate completing the search after a brief delay (in background)
    simulateSearch(session.id, keyword, city, maxResults).catch(() => {});

    return res.status(201).json(serializeSession(session));
  } catch (err) {
    req.log.error({ err }, "Failed to create search");
    return res.status(500).json({ error: "Failed to create search" });
  }
});

// Get single search session
router.get("/searches/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [session] = await db
      .select()
      .from(searchSessionsTable)
      .where(eq(searchSessionsTable.id, id));

    if (!session) return res.status(404).json({ error: "Search session not found" });

    return res.json(serializeSession(session));
  } catch (err) {
    req.log.error({ err }, "Failed to get search");
    return res.status(500).json({ error: "Failed to get search" });
  }
});

// Cancel a running search
router.post("/searches/:id/cancel", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [session] = await db
      .update(searchSessionsTable)
      .set({
        status: "cancelled",
        finishedAt: new Date(),
      })
      .where(eq(searchSessionsTable.id, id))
      .returning();

    if (!session) return res.status(404).json({ error: "Search session not found" });

    await db.insert(logsTable).values({
      level: "info",
      module: "SearchService",
      message: `Search #${id} cancelled by user`,
    });

    return res.json(serializeSession(session));
  } catch (err) {
    req.log.error({ err }, "Failed to cancel search");
    return res.status(500).json({ error: "Failed to cancel search" });
  }
});

// Simulate a search completing (generates sample businesses)
async function simulateSearch(sessionId: number, keyword: string, city: string, maxResults: number) {
  const { businessesTable } = await import("@workspace/db") as typeof import("@workspace/db");

  await new Promise((r) => setTimeout(r, 3000));

  // Check if session was cancelled
  const [session] = await db
    .select()
    .from(searchSessionsTable)
    .where(eq(searchSessionsTable.id, sessionId));

  if (!session || session.status === "cancelled") return;

  // Generate sample businesses based on keyword
  const categories = [keyword, `${keyword} Services`, `Local ${keyword}`];
  const businessCount = Math.min(maxResults, Math.floor(Math.random() * 8) + 3);

  const sampleBusinesses = Array.from({ length: businessCount }, (_, i) => ({
    name: `${keyword} ${["Pro", "Express", "Elite", "Central", "Plus", "Hub", "Co.", "Group", "Studio", "Works"][i % 10]}`,
    category: categories[i % categories.length],
    city,
    country: session.country ?? "United States",
    phone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    email: Math.random() > 0.4 ? `info@${keyword.toLowerCase().replace(/\s/g, "")}${i + 1}.com` : null,
    website: Math.random() > 0.3 ? `https://www.${keyword.toLowerCase().replace(/\s/g, "")}${i + 1}.com` : null,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    reviewCount: Math.floor(Math.random() * 500) + 5,
    status: "active",
    searchSessionId: sessionId,
  }));

  await db.insert(businessesTable).values(sampleBusinesses);

  await db
    .update(searchSessionsTable)
    .set({
      status: "completed",
      businessesFound: businessCount,
      businessesSaved: businessCount,
      finishedAt: new Date(),
      durationSeconds: 3,
    })
    .where(eq(searchSessionsTable.id, sessionId));

  await db.insert(logsTable).values({
    level: "info",
    module: "SearchService",
    message: `Search #${sessionId} completed: ${businessCount} businesses saved`,
  });
}

function serializeSession(s: typeof searchSessionsTable.$inferSelect) {
  return {
    id: s.id,
    keyword: s.keyword,
    country: s.country ?? null,
    state: s.state ?? null,
    city: s.city ?? null,
    postalCode: s.postalCode ?? null,
    radius: s.radius ?? null,
    category: s.category ?? null,
    maxResults: s.maxResults,
    language: s.language ?? null,
    status: s.status,
    businessesFound: s.businessesFound,
    businessesSaved: s.businessesSaved,
    startedAt: s.startedAt?.toISOString() ?? null,
    finishedAt: s.finishedAt?.toISOString() ?? null,
    durationSeconds: s.durationSeconds ?? null,
    errorMessage: s.errorMessage ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

export default router;
