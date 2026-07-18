import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULTS = {
  language: "en",
  theme: "system",
  exportFolder: "./exports",
  maxResults: "20",
  requestDelay: "1000",
  requestTimeout: "30000",
  headlessMode: "true",
  cacheEnabled: "true",
  loggingEnabled: "true",
  logLevel: "info",
};

async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

function mapToSettings(map: Record<string, string>) {
  return {
    language: map.language ?? DEFAULTS.language,
    theme: map.theme ?? DEFAULTS.theme,
    exportFolder: map.exportFolder ?? DEFAULTS.exportFolder,
    maxResults: parseInt(map.maxResults ?? DEFAULTS.maxResults, 10),
    requestDelay: parseInt(map.requestDelay ?? DEFAULTS.requestDelay, 10),
    requestTimeout: parseInt(map.requestTimeout ?? DEFAULTS.requestTimeout, 10),
    headlessMode: map.headlessMode === "true",
    cacheEnabled: map.cacheEnabled === "true",
    loggingEnabled: map.loggingEnabled === "true",
    logLevel: map.logLevel ?? DEFAULTS.logLevel,
  };
}

// Get settings
router.get("/settings", async (req, res) => {
  try {
    const map = await getSettingsMap();
    return res.json(mapToSettings(map));
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    return res.status(500).json({ error: "Failed to get settings" });
  }
});

// Update settings
router.patch("/settings", async (req, res) => {
  try {
    const parsed = UpdateSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid settings data" });
    }

    const updates = parsed.data;
    const entries: Array<{ key: string; value: string }> = [];

    if (updates.language !== undefined) entries.push({ key: "language", value: updates.language });
    if (updates.theme !== undefined) entries.push({ key: "theme", value: updates.theme });
    if (updates.exportFolder !== undefined) entries.push({ key: "exportFolder", value: updates.exportFolder });
    if (updates.maxResults !== undefined) entries.push({ key: "maxResults", value: String(updates.maxResults) });
    if (updates.requestDelay !== undefined) entries.push({ key: "requestDelay", value: String(updates.requestDelay) });
    if (updates.requestTimeout !== undefined) entries.push({ key: "requestTimeout", value: String(updates.requestTimeout) });
    if (updates.headlessMode !== undefined) entries.push({ key: "headlessMode", value: String(updates.headlessMode) });
    if (updates.cacheEnabled !== undefined) entries.push({ key: "cacheEnabled", value: String(updates.cacheEnabled) });
    if (updates.loggingEnabled !== undefined) entries.push({ key: "loggingEnabled", value: String(updates.loggingEnabled) });
    if (updates.logLevel !== undefined) entries.push({ key: "logLevel", value: updates.logLevel });

    for (const entry of entries) {
      await db
        .insert(settingsTable)
        .values({ key: entry.key, value: entry.value })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: { value: entry.value, updatedAt: new Date() },
        });
    }

    const map = await getSettingsMap();
    return res.json(mapToSettings(map));
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
