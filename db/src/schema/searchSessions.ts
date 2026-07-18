import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchSessionsTable = pgTable("search_sessions", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  postalCode: text("postal_code"),
  radius: integer("radius"),
  category: text("category"),
  maxResults: integer("max_results").default(20).notNull(),
  language: text("language"),
  status: text("status").default("pending").notNull(), // pending, running, completed, cancelled, failed
  businessesFound: integer("businesses_found").default(0).notNull(),
  businessesSaved: integer("businesses_saved").default(0).notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  durationSeconds: integer("duration_seconds"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSearchSessionSchema = createInsertSchema(searchSessionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSearchSession = z.infer<typeof insertSearchSessionSchema>;
export type SearchSession = typeof searchSessionsTable.$inferSelect;
