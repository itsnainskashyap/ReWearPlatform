import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateDatabaseConnection, closeDatabaseConnection } from "./db";

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Startup logging
console.log(`[STARTUP] Application starting in ${NODE_ENV} mode`);
console.log(`[STARTUP] Production mode: ${IS_PRODUCTION}`);
console.log(`[STARTUP] Node.js version: ${process.version}`);
console.log(`[STARTUP] Platform: ${process.platform}`);

// Validate required environment variables for production
if (IS_PRODUCTION) {
  console.log('[STARTUP] Validating production environment variables...');
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`[STARTUP ERROR] Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  // Warn about PORT but don't fail (server defaults to 5000)
  if (!process.env.PORT) {
    console.warn('[STARTUP WARNING] PORT environment variable not set, defaulting to 5000');
  }
  
  console.log('[STARTUP] Environment variables validation passed');
}

const app = express();

// Set production environment explicitly
if (IS_PRODUCTION) {
  app.set('env', 'production');
  console.log('[STARTUP] Express environment set to production');
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  try {
    // Validate database connection before starting the server
    console.log('[STARTUP] Validating database connection...');
    await validateDatabaseConnection();
    console.log('[STARTUP] Database validation completed successfully');
    
    console.log('[STARTUP] Registering routes...');
    const server = await registerRoutes(app);
    console.log('[STARTUP] Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error for debugging
    console.error(`[ERROR] ${status} - ${message}`, err.stack);
    
    res.status(status).json({ message });
    
    // Don't throw in production to prevent crashes
    if (!IS_PRODUCTION) {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`[STARTUP] Starting server on port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`[STARTUP] Server successfully started on port ${port}`);
      console.log(`[STARTUP] Environment: ${NODE_ENV}`);
      console.log(`[STARTUP] Health check: http://0.0.0.0:${port}/api/health`);
      log(`serving on port ${port}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`[SHUTDOWN] Received ${signal}, shutting down gracefully...`);
      try {
        server.close(() => {
          console.log('[SHUTDOWN] HTTP server closed');
        });
        await closeDatabaseConnection();
        console.log('[SHUTDOWN] Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('[SHUTDOWN ERROR] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    console.error('[STARTUP ERROR] Failed to start application:', error);
    console.error('[STARTUP ERROR] Stack trace:', (error as Error).stack);
    
    if (IS_PRODUCTION) {
      console.error('[STARTUP ERROR] Application startup failed in production');
      process.exit(1);
    } else {
      console.error('[STARTUP ERROR] Application startup failed in development');
      throw error;
    }
  }
})();
