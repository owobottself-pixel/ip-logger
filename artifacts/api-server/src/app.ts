import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import shortRouter from "./routes/short";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Short link slug handler — must come after /api
app.use("/", shortRouter);

// Serve frontend static files + SPA catch-all.
// The ip-logger frontend builds to artifacts/ip-logger/dist/public/,
// which is two levels up then into ip-logger from the api-server dist dir.
const publicDir = path.join(import.meta.dirname, "../../ip-logger/dist/public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  logger.info({ publicDir }, "Serving frontend static files");
} else {
  logger.warn({ publicDir }, "Frontend static files not found — frontend will not be served");
}

export default app;
