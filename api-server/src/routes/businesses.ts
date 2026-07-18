import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable } from "@workspace/db";
import { CreateBusinessBody, UpdateBusinessBody, ListBusinessesQueryParams, ExportBusinessesBody } from "@workspace/api-zod";
import { eq, sql, ilike, and, isNotNull, ne, or, asc, desc, count } from "drizzle-orm";

const router = Router();

// List businesses with pagination + filtering
router.get("/businesses", async (req, res) => {
  try {
    const parsed = ListBusinessesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const {
      page = 1,
      pageSize = 25,
      search,
      category,
      city,
      country,
      hasEmail,
      hasWebsite,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = parsed.data;

    const conditions: ReturnType<typeof and>[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(businessesTable.name, `%${search}%`),
          ilike(businessesTable.email, `%${search}%`),
          ilike(businessesTable.website, `%${search}%`),
          ilike(businessesTable.phone, `%${search}%`)
        )!
      );
    }
    if (category) conditions.push(ilike(businessesTable.category, `%${category}%`)!);
    if (city) conditions.push(ilike(businessesTable.city, `%${city}%`)!);
    if (country) conditions.push(ilike(businessesTable.country, `%${country}%`)!);
    if (hasEmail === true) {
      conditions.push(and(isNotNull(businessesTable.email), ne(businessesTable.email, ""))!);
    }
    if (hasWebsite === true) {
      conditions.push(and(isNotNull(businessesTable.website), ne(businessesTable.website, ""))!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const validSortColumns = ["name", "category", "city", "country", "rating", "createdAt", "updatedAt"] as const;
    type SortableColumn = (typeof validSortColumns)[number];
    const safeSortBy: SortableColumn = (validSortColumns as readonly string[]).includes(sortBy ?? "")
      ? (sortBy as SortableColumn)
      : "createdAt";

    const columnMap = {
      name: businessesTable.name,
      category: businessesTable.category,
      city: businessesTable.city,
      country: businessesTable.country,
      rating: businessesTable.rating,
      createdAt: businessesTable.createdAt,
      updatedAt: businessesTable.updatedAt,
    } as const;
    const orderCol = columnMap[safeSortBy];
    const orderFn = sortOrder === "asc" ? asc : desc;

    const offset = (page - 1) * pageSize;

    const [businesses, totalResult] = await Promise.all([
      db
        .select()
        .from(businessesTable)
        .where(whereClause)
        .orderBy(orderFn(orderCol))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(businessesTable).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    return res.json({
      businesses: businesses.map(serializeBusiness),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list businesses");
    return res.status(500).json({ error: "Failed to list businesses" });
  }
});

// Create business
router.post("/businesses", async (req, res) => {
  try {
    const parsed = CreateBusinessBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid business data" });
    }

    const [business] = await db
      .insert(businessesTable)
      .values({ ...parsed.data })
      .returning();

    return res.status(201).json(serializeBusiness(business));
  } catch (err) {
    req.log.error({ err }, "Failed to create business");
    return res.status(500).json({ error: "Failed to create business" });
  }
});

// Export businesses
router.post("/businesses/export", async (req, res) => {
  try {
    const parsed = ExportBusinessesBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid export request" });
    }

    const { format, businessIds, includeNotes = true, includeSources = true, includeEmptyFields = false } = parsed.data;

    let businesses;
    if (businessIds && businessIds.length > 0) {
      businesses = await db
        .select()
        .from(businessesTable)
        .where(sql`${businessesTable.id} = ANY(${businessIds})`);
    } else {
      businesses = await db.select().from(businessesTable);
    }

    const serialized = businesses.map(serializeBusiness);

    const getFields = (b: ReturnType<typeof serializeBusiness>) => {
      const fields: Record<string, unknown> = {
        id: b.id,
        name: b.name,
        category: b.category,
        subcategory: b.subcategory,
        description: b.description,
        country: b.country,
        state: b.state,
        city: b.city,
        street: b.street,
        postalCode: b.postalCode,
        phone: b.phone,
        email: b.email,
        website: b.website,
        mapsUrl: b.mapsUrl,
        facebook: b.facebook,
        instagram: b.instagram,
        linkedin: b.linkedin,
        x: b.x,
        youtube: b.youtube,
        tiktok: b.tiktok,
        rating: b.rating,
        reviewCount: b.reviewCount,
        openingHours: b.openingHours,
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
      if (includeNotes) fields.notes = b.notes;
      if (includeSources) fields.sources = b.sources;

      if (!includeEmptyFields) {
        return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null && v !== undefined && v !== ""));
      }
      return fields;
    };

    let content = "";
    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `leadminer-export-${timestamp}`;

    if (format === "json") {
      content = JSON.stringify(serialized.map(getFields), null, 2);
      filename += ".json";
    } else if (format === "csv" || format === "xlsx") {
      const rows = serialized.map(getFields);
      if (rows.length === 0) {
        content = "";
      } else {
        const headers = Object.keys(rows[0]);
        const csvRows = [
          headers.join(","),
          ...rows.map((r) =>
            headers.map((h) => {
              const val = r[h];
              if (val === null || val === undefined) return "";
              const str = String(val).replace(/"/g, '""');
              return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
            }).join(",")
          ),
        ];
        content = csvRows.join("\n");
      }
      filename += format === "xlsx" ? ".csv" : ".csv"; // Return CSV for xlsx too (no native xlsx in Node without deps)
    }

    return res.json({
      content,
      filename,
      format,
      recordCount: serialized.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to export businesses");
    return res.status(500).json({ error: "Failed to export businesses" });
  }
});

// Get single business
router.get("/businesses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!business) return res.status(404).json({ error: "Business not found" });

    return res.json(serializeBusiness(business));
  } catch (err) {
    req.log.error({ err }, "Failed to get business");
    return res.status(500).json({ error: "Failed to get business" });
  }
});

// Update business
router.patch("/businesses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const parsed = UpdateBusinessBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid business data" });
    }

    const [business] = await db
      .update(businessesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    if (!business) return res.status(404).json({ error: "Business not found" });

    return res.json(serializeBusiness(business));
  } catch (err) {
    req.log.error({ err }, "Failed to update business");
    return res.status(500).json({ error: "Failed to update business" });
  }
});

// Delete business
router.delete("/businesses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = await db
      .delete(businessesTable)
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id });

    if (!deleted) return res.status(404).json({ error: "Business not found" });

    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete business");
    return res.status(500).json({ error: "Failed to delete business" });
  }
});

function serializeBusiness(b: typeof businessesTable.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    category: b.category ?? null,
    subcategory: b.subcategory ?? null,
    description: b.description ?? null,
    country: b.country ?? null,
    state: b.state ?? null,
    city: b.city ?? null,
    district: b.district ?? null,
    street: b.street ?? null,
    postalCode: b.postalCode ?? null,
    latitude: b.latitude ?? null,
    longitude: b.longitude ?? null,
    phone: b.phone ?? null,
    email: b.email ?? null,
    website: b.website ?? null,
    mapsUrl: b.mapsUrl ?? null,
    facebook: b.facebook ?? null,
    instagram: b.instagram ?? null,
    linkedin: b.linkedin ?? null,
    x: b.x ?? null,
    youtube: b.youtube ?? null,
    tiktok: b.tiktok ?? null,
    pinterest: b.pinterest ?? null,
    threads: b.threads ?? null,
    rating: b.rating ?? null,
    reviewCount: b.reviewCount ?? null,
    openingHours: b.openingHours ?? null,
    status: b.status ?? null,
    notes: b.notes ?? null,
    sources: b.sources ?? null,
    searchSessionId: b.searchSessionId ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export default router;
