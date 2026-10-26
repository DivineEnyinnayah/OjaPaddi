import { createMiddleware } from "hono/factory";
export const validate = (schema) => createMiddleware(async (c, next) => {
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
