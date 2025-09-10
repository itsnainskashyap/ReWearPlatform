import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateDatabaseConnection, closeDatabaseConnection } from "./db";
import { seedDatabase } from "./seed";

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Startup logging
console.log(`[STARTUP] Application starting in ${NODE_ENV} mode`);
console.log(`[STARTUP] Production mode: ${IS_PRODUCTION}`);
console.log(`[STARTUP] Node.js version: ${process.version}`);
console.log(`[STARTUP] Platform: ${process.platform}`);

// Track startup health for production (no process.exit)
let startupHealthy = true;
let startupError = '';

// Validate required environment variables for production
if (IS_PRODUCTION) {
  console.log('[STARTUP] Validating production environment variables...');
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    startupHealthy = false;
    startupError = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(`[STARTUP ERROR] ${startupError}`);
  }
  
  // Warn about PORT but don't fail (server defaults to 5000)
  if (!process.env.PORT) {
    console.warn('[STARTUP WARNING] PORT environment variable not set, defaulting to 5000');
  }
  
  if (startupHealthy) {
    console.log('[STARTUP] Environment variables validation passed');
  }
}

const app = express();

// Set production environment explicitly
if (IS_PRODUCTION) {
  app.set('env', 'production');
  console.log('[STARTUP] Express environment set to production');
}

// Early health check middleware - must be FIRST to avoid Vite interception
app.use((req, res, next) => {
  if (req.path === '/') {
    // Handle HEAD requests (common for health checks)
    if (req.method === 'HEAD') {
      return startupHealthy ? res.status(200).end() : res.status(503).end();
    }
    
    // Handle GET requests - check if it's a health check request
    if (req.method === 'GET') {
      const userAgent = req.headers['user-agent'] || '';
      const acceptHeader = req.headers.accept || '';
      
      // Detect health check requests by:
      // 1. Explicit health check query parameter
      // 2. Common health checker user agents
      // 3. Requests that don't accept HTML
      const isHealthCheck = (
        req.query.health === 'check' ||
        /GoogleHC|kube-probe|curl|wget|health/i.test(userAgent) ||
        (!acceptHeader.includes('text/html') && !acceptHeader.includes('*/*'))
      );
      
      if (isHealthCheck) {
        if (startupHealthy) {
          return res.status(200).json({ 
            status: 'healthy',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV
          });
        } else {
          // Generic error message in production, detailed in development
          const errorMessage = IS_PRODUCTION ? 'Service temporarily unavailable' : startupError;
          return res.status(503).json({ 
            status: 'unhealthy',
            message: errorMessage,
            timestamp: new Date().toISOString(),
            environment: NODE_ENV
          });
        }
      }
      
      // Let all other GET requests pass through to serve the SPA
    }
  }
  next();
});

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
    // Validate database connection before starting the server (non-fatal)
    console.log('[STARTUP] Validating database connection...');
    try {
      await validateDatabaseConnection();
      console.log('[STARTUP] Database validation completed successfully');
      
      // Seed database in production to ensure data is available
      if (IS_PRODUCTION) {
        console.log('[STARTUP] Seeding production database...');
        await seedDatabase();
      }
    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('endpoint has been disabled')) {
        console.warn('[STARTUP] DB unavailable (Neon endpoint disabled). Continuing with in-memory storage.');
      } else {
        console.warn('[STARTUP] DB connection failed. Continuing with in-memory storage. Error:', dbError.message);
      }
    }
    

    console.log('[STARTUP] Registering routes...');
    const server = await registerRoutes(app);
    console.log('[STARTUP] Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Log error for debugging (always log full details server-side)
    console.error(`[ERROR] ${status} - ${err.message}`, err.stack);
    
    // Return generic error messages in production, detailed in development
    const payload = IS_PRODUCTION 
      ? { message: status >= 500 ? 'Internal Server Error' : 'Request failed' }
      : { message: err.message || "Internal Server Error", stack: err.stack };
    
    res.status(status).json(payload);
    
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
      console.log(`[STARTUP] Health check: http://0.0.0.0:${port}/`);
      console.log(`[STARTUP] API health check: http://0.0.0.0:${port}/api/health`);
      log(`serving on port ${port}`);
    });

    // Graceful shutdown handling (no process.exit in production)
    const shutdown = async (signal: string) => {
      console.log(`[SHUTDOWN] Received ${signal}, shutting down gracefully...`);
      try {
        server.close(() => {
          console.log('[SHUTDOWN] HTTP server closed');
        });
        await closeDatabaseConnection();
        console.log('[SHUTDOWN] Graceful shutdown completed');
        if (!IS_PRODUCTION) {
          process.exit(0);
        }
      } catch (error) {
        console.error('[SHUTDOWN ERROR] Error during shutdown:', error);
        if (!IS_PRODUCTION) {
          process.exit(1);
        }
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    startupHealthy = false;
    startupError = error instanceof Error ? error.message : 'Unknown startup error';
    console.error('[STARTUP ERROR] Failed to start application:', error);
    console.error('[STARTUP ERROR] Stack trace:', (error as Error).stack);
    
    if (IS_PRODUCTION) {
      console.error('[STARTUP ERROR] Application startup failed in production - server will respond with 503');
      // Continue running to serve 503 responses, don't exit
    } else {
      console.error('[STARTUP ERROR] Application startup failed in development');
      throw error;
    }
  }
})();
