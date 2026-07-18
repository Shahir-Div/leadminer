import { Router } from "express";
import { db } from "@workspace/db";
import { logsTable } from "@workspace/db";
import { ListLogsQueryParams } from "@workspace/api-zod";
import { eq, ilike, and, desc, count, sql } from "drizzle-orm";

const router = Router();

// List logs
router.get("/logs", async (req, res) => {
  try {
    const parsed = ListLogsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const { page = 1, pageSize = 50, level, search } = parsed.data;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (level) conditions.push(eq(logsTable.level, level));
    if (search) conditions.push(ilike(logsTable.message, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalResult] = await Promise.all([
      db
        .select()
        .from(logsTable)
        .where(whereClause)
        .orderBy(desc(logsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(logsTable).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    return res.json({
      logs: logs.map((l) => ({
        id: l.id,
        level: l.level,
        module: l.module,
        message: l.message,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list logs");
    return res.status(500).json({ error: "Failed to list logs" });
  }
});

// Clear all logs
router.delete("/logs", async (req, res) => {
  try {
    await db.delete(logsTable);
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to clear logs");
    return res.status(500).json({ error: "Failed to clear logs" });
  }
});

export default router;
