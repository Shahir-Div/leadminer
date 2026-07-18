import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  subcategory: text("subcategory"),
  description: text("description"),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  district: text("district"),
  street: text("street"),
  postalCode: text("postal_code"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  mapsUrl: text("maps_url"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  x: text("x"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  pinterest: text("pinterest"),
  threads: text("threads"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  openingHours: text("opening_hours"),
  status: text("status"),
  notes: text("notes"),
  sources: text("sources"),
  searchSessionId: integer("search_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
