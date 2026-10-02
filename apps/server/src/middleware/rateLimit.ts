import { createMiddleware } from "hono/factory";

// In-memory rate limit store (resets on server restart).
// For Cloudflare Workers production, use KV or Durable Objects.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (limit: number, windowMs: number) => 
  createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const clientIp = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "anonymous";
    const key = authHeader ? `token:${authHeader.substring(0, 100)}` : `ip:${clientIp}`;
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
    
    if (currentRecord.count > limit) {
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
