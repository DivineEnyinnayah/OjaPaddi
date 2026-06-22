import { createMiddleware } from "hono/factory";
import { env } from "@ojapaddi/env/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (limit: number, windowMs: number) => 
  createMiddleware(async (c, next) => {
    // Multiply limits by 10 in development mode for a smoother developer experience
    const actualLimit = env.NODE_ENV === "development" ? limit * 10 : limit;

    // Identify client by Authorization token if present, otherwise by IP
    const authHeader = c.req.header("Authorization");
    const key = authHeader ? authHeader.substring(0, 100) : (c.req.header("x-forwarded-for") || "anonymous");
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
    } else {
      record.count++;
    }
    
    const currentRecord = rateLimitStore.get(key)!;
    
    if (currentRecord.count > actualLimit) {
      return c.json({ 
        success: false, 
        error: { 
          code: "TOO_MANY_REQUESTS", 
          message: "Too many requests. Please try again later." 
        } 
      }, 429);
    }
    
    await next();
  });

