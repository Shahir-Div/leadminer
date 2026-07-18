import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable, searchSessionsTable, logsTable } from "@workspace/db";
import { sql, count, gte } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const [totalBusinessesResult] = await db
      .select({ count: count() })
      .from(businessesTable);
    const totalBusinesses = Number(totalBusinessesResult?.count ?? 0);

    const [totalSearchesResult] = await db
      .select({ count: count() })
      .from(searchSessionsTable);
    const totalSearches = Number(totalSearchesResult?.count ?? 0);

    const [withEmailResult] = await db
      .select({ count: count() })
      .from(businessesTable)
      .where(sql`${businessesTable.email} IS NOT NULL AND ${businessesTable.email} != ''`);
    const businessesWithEmail = Number(withEmailResult?.count ?? 0);

    const [withWebsiteResult] = await db
      .select({ count: count() })
      .from(businessesTable)
      .where(sql`${businessesTable.website} IS NOT NULL AND ${businessesTable.website} != ''`);
    const businessesWithWebsite = Number(withWebsiteResult?.count ?? 0);

    const lastSearch = await db
      .select({ createdAt: searchSessionsTable.createdAt })
      .from(searchSessionsTable)
      .orderBy(sql`${searchSessionsTable.createdAt} DESC`)
      .limit(1);
    const lastSearchAt = lastSearch[0]?.createdAt?.toISOString() ?? null;

    // Recent activity from logs
    const recentLogs = await db
      .select()
      .from(logsTable)
      .orderBy(sql`${logsTable.createdAt} DESC`)
      .limit(10);

    const recentActivity = recentLogs.map((log) => ({
      type: log.level,
      message: log.message,
      timestamp: log.createdAt.toISOString(),
    }));

    // Category breakdown
    const categoryBreakdown = await db
      .select({
        category: businessesTable.category,
        count: count(),
      })
      .from(businessesTable)
      .where(sql`${businessesTable.category} IS NOT NULL AND ${businessesTable.category} != ''`)
      .groupBy(businessesTable.category)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Daily growth — last 14 days
    const dailyGrowthRows = await db.execute(sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM businesses
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const dailyGrowth = (dailyGrowthRows.rows as Array<{ date: string; count: string }>).map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));

    return res.json({
      totalBusinesses,
      totalSearches,
      businessesWithEmail,
      businessesWithWebsite,
      lastSearchAt,
      recentActivity,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category ?? "Unknown",
        count: Number(c.count),
      })),
      dailyGrowth,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dashboard summary");
    return res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

export default router;
