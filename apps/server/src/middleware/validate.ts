import { createMiddleware } from "hono/factory";
import type { ZodSchema } from "zod";
import type { HonoEnv } from "../types";

export const validate = <T>(schema: ZodSchema<T>) => 
  createMiddleware<HonoEnv>(async (c, next) => {
    const body = await c.req.json().catch(() => ({}));
    
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Invalid request data",
          details: result.error.flatten().fieldErrors 
        } 
      }, 400);
    }
    
    c.set("validatedBody", result.data);
    await next();
  });
