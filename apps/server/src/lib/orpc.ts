import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAdminAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user && context.session?.user.role != "ADMIN") {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const userProcedure = publicProcedure.use(requireAuth);
export const protectedProcedure = publicProcedure.use(requireAdminAuth);
