import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const logsTable = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // info, warning, error, debug
  module: text("module").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLogSchema = createInsertSchema(logsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logsTable.$inferSelect;
