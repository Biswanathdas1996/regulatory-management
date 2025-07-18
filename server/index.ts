import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Add session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key-for-development",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Allow non-HTTPS in development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
    },
    name: "sessionId",
  })
);

// Add authentication middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any).user;
  if (sessionUser) {
    const user = await storage.getUser(sessionUser.id);
    if (user) {
      (req as any).user = {
        id: user.id,
        username: user.username,
        role: sessionUser.role,
      };
    }
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("Setting up Express app...");
  
  // Add a middleware to check if requests are reaching the API routes
  app.use("/api/*", (req, res, next) => {
    console.log(`API Route hit: ${req.method} ${req.originalUrl} (path: ${req.path})`);
    next();
  });
  
  const server = await registerRoutes(app);
  console.log("Routes registered successfully");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log("Setting up Vite middleware...");
    await setupVite(app, server);
    console.log("Vite middleware setup complete");
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
