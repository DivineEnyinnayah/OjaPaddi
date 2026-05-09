
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "@ojapaddi/env/server";
import { createDb } from "@ojapaddi/db";
import * as schema from "@ojapaddi/db/schema";
import { expo } from "@better-auth/expo";
import { businesses } from "@ojapaddi/db/schema";

export const db = createDb();

export const authd = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	_databaseHooks: {
		user: {
			create: {
				after: async (user: any) => {
					await db.insert(businesses).values({
						userId: user.id,
						name: `${user.name}'s Business`,
						category: "General",
						phone: user.phone || "0000000000",
						city: "Lagos",
						state: "Lagos",
					});
				},
			},
		},
	},
	get databaseHooks() {
		return this._databaseHooks;
	},
	set databaseHooks(value) {
		this._databaseHooks = value;
	},
	user: {
		additionalFields: {
			phone: {
				type: "string",
				required: false,
			},
			plan: {
				type: "string",
				defaultValue: "free",
			},
			planExpiresAt: {
				type: "date",
				required: false,
			},
		},
	},
	trustedOrigins: [
		env.CORS_ORIGIN,
		"ojapaddi://",
		...(env.NODE_ENV === "development"
			? [
				"exp://",
				"exp://**",
				"exp://192.168.*.*:*/**",
				"http://localhost:8081",
			]
			: []),
	],
	emailAndPassword: {
		enabled: true,
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [expo()],
});


