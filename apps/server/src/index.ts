import "dotenv/config";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";
import { auth } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./drizzle/db";
import { order } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import z from "zod";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// PayTR notification schema
const paytrNotificationSchema = z.object({
	merchant_oid: z.string(),
	status: z.enum(['success', 'failed']),
	total_amount: z.string(),
	hash: z.string(),
	failed_reason_code: z.string().optional(),
	failed_reason_msg: z.string().optional(),
	test_mode: z.string().optional(),
	payment_type: z.enum(['card', 'eft']).optional(),
	currency: z.enum(['TL', 'USD', 'EUR', 'GBP', 'RUB']).optional(),
	payment_amount: z.string().optional(),
});

// PayTR notification webhook - must be accessible without authentication
app.post("/api/paytr/notification", async (c) => {
	try {
		let rawBody = '';
		try {
			rawBody = await c.req.text();
		} catch (err) {
			console.error('Body read error:', err);
			return c.text('Invalid body', 400);
		}

		// Parse URL-encoded form data
		const params = new URLSearchParams(rawBody);
		const data: Record<string, string> = {};
		for (const [key, value] of params.entries()) {
			data[key] = value;
		}

		console.log('Parsed callback data:', data);

		// Validate the data
		const validationResult = paytrNotificationSchema.safeParse(data);
		if (!validationResult.success) {
			console.error('PayTR notification validation failed:', validationResult.error);
			return c.text('Invalid data format', 400);
		}

		const {
			merchant_oid,
			status,
			total_amount,
			hash,
			failed_reason_code,
			failed_reason_msg,
			payment_type = 'card',
			currency = 'TL',
		} = validationResult.data;

		console.log('PayTR notification received:', validationResult.data);

		// Verify hash for security
		const paytr_token = merchant_oid + process.env.PAYTR_MERCHANT_SALT + status + total_amount;
		const token = crypto.createHmac('sha256', process.env.PAYTR_MERCHANT_KEY!).update(paytr_token).digest('base64');

		if (token !== hash) {
			console.error('PayTR notification hash validation failed', {
				received: hash,
				calculated: token,
				merchant_oid
			});
			return c.text('Invalid hash', 400);
		}

		// Find the order
		const orderResult = await db.select().from(order).where(eq(order.id, merchant_oid));
		const foundOrder = orderResult[0];

		if (!foundOrder) {
			console.error('Order not found for PayTR notification', { merchant_oid });
			return c.text('Order not found', 404);
		}

		// Check if already processed to prevent duplicate processing
		if (foundOrder.status !== 'PENDING') {
			console.log('Order already processed', { merchant_oid, status: foundOrder.status });
			return c.text('OK');
		}

		console.log("current status = " + status)

		// Update order status based on payment result
		if (status === 'success') {
			await db.update(order)
				.set({
					status: 'COMPLETED',
					paymentType: payment_type,
					paidAmount: parseFloat(total_amount) / 100, // Convert back from PayTR format
					paymentDate: new Date().toISOString(),
					paymentCurrency: currency,
					updatedAt: new Date().toISOString()
				})
				.where(eq(order.id, merchant_oid));

			console.log('Payment successful', {
				merchant_oid,
				total_amount,
				payment_type
			});
		} else {
			await db.update(order)
				.set({
					status: 'FAILED',
					failureReason: failed_reason_msg,
					failureCode: failed_reason_code,
					updatedAt: new Date().toISOString()
				})
				.where(eq(order.id, merchant_oid));

			console.log('Payment failed', {
				merchant_oid,
				failed_reason_code,
				failed_reason_msg
			});
		}

		// PayTR requires exactly "OK" response
		return c.text("OK");
	} catch (error) {
		console.error('PayTR notification error:', error);
		return c.text("ERROR", 500);
	}
});

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api",
		context: context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
