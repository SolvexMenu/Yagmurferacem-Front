import { protectedProcedure, publicProcedure } from "../lib/orpc";
import type { RouterClient } from "@orpc/server";
import { productRouter } from "./productRouter";
import { cartRouter } from "./cartRouter";
import { customerRouter } from "./customerRouter";
import { paytrRouter } from "./paytrRouter";
import { orderRouter } from "./orderRouter";
import { bannerRouter } from "./bannerRouter";
import { guestOrderRouter } from "./guestOrderRouter";
import { addressRouter } from "./addressRouter";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),

	productRouter,
	cartRouter,
	customerRouter,
	paytrRouter,
	orderRouter,
	bannerRouter,
	guestOrderRouter,
	addressRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
