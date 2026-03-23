import { relations } from "drizzle-orm/relations";
import { user, session, account, product, productVariant, size, color, cart, cartItem, orderItem, order } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
	carts: many(cart),
	orders: many(order),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const productVariantRelations = relations(productVariant, ({one, many}) => ({
	product: one(product, {
		fields: [productVariant.productId],
		references: [product.id]
	}),
	cartItems: many(cartItem),
	orderItems: many(orderItem),
}));

export const productRelations = relations(product, ({many}) => ({
	productVariants: many(productVariant),
	sizes: many(size),
	colors: many(color),
	cartItems: many(cartItem),
	orderItems: many(orderItem),
}));

export const sizeRelations = relations(size, ({one, many}) => ({
	product: one(product, {
		fields: [size.productId],
		references: [product.id]
	}),
	cartItems: many(cartItem),
	orderItems: many(orderItem),
}));

export const colorRelations = relations(color, ({one, many}) => ({
	product: one(product, {
		fields: [color.productId],
		references: [product.id]
	}),
	cartItems: many(cartItem),
	orderItems: many(orderItem),
}));

export const cartRelations = relations(cart, ({one, many}) => ({
	user: one(user, {
		fields: [cart.userId],
		references: [user.id]
	}),
	cartItems: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({one}) => ({
	cart: one(cart, {
		fields: [cartItem.cartId],
		references: [cart.id]
	}),
	product: one(product, {
		fields: [cartItem.productId],
		references: [product.id]
	}),
	productVariant: one(productVariant, {
		fields: [cartItem.variantId],
		references: [productVariant.id]
	}),
	size: one(size, {
		fields: [cartItem.sizeId],
		references: [size.id]
	}),
	color: one(color, {
		fields: [cartItem.colorId],
		references: [color.id]
	}),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	product: one(product, {
		fields: [orderItem.productId],
		references: [product.id]
	}),
	productVariant: one(productVariant, {
		fields: [orderItem.variantId],
		references: [productVariant.id]
	}),
	size: one(size, {
		fields: [orderItem.sizeId],
		references: [size.id]
	}),
	color: one(color, {
		fields: [orderItem.colorId],
		references: [color.id]
	}),
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	orderItems: many(orderItem),
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
}));