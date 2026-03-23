import { pgTable, varchar, timestamp, text, integer, uniqueIndex, boolean, foreignKey, index, doublePrecision, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("OrderStatus", ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED', 'FAILED'])
export const role = pgEnum("Role", ['CUSTOMER', 'ADMIN'])


export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const verification = pgTable("verification", {
	id: text("_id").primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }),
	updatedAt: timestamp({ precision: 3, mode: 'string' }),
});

export const banners = pgTable("banners", {
	id: text().primaryKey().notNull(),
	carousel: text().array().default(["RAY"]),
	separator: text().default("").notNull(),
	shippingPrice: integer().notNull().default(75)
});

export const user = pgTable("user", {
	id: text("_id").primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	role: role().default('CUSTOMER').notNull(),
	fcmToken: text().default(""),
}, (table) => [
	uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const session = pgTable("session", {
	id: text("_id").primaryKey().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	uniqueIndex("session_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const account = pgTable("account", {
	id: text("_id").primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const product = pgTable("product", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	price: integer().notNull(),
	description: text().notNull(),
	imageUrls: text().array(),
	discount: integer(),
	stockCode: text().notNull(),
	available: boolean().notNull(),
	categories: text().array(),
}, (table) => [
	uniqueIndex("product_id_key").using("btree", table.id.asc().nullsLast().op("text_ops")),
]);

export const productVariant = pgTable("product_variant", {
	id: text().primaryKey().notNull(),
	size: integer().notNull(),
	color: text().notNull(),
	available: boolean().notNull(),
	stock: integer().default(0).notNull(),
	productId: text().notNull(),
}, (table) => [
	index("product_variant_available_idx").using("btree", table.available.asc().nullsLast().op("bool_ops")),
	index("product_variant_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	uniqueIndex("product_variant_productId_size_color_key").using("btree", table.productId.asc().nullsLast().op("text_ops"), table.size.asc().nullsLast().op("int4_ops"), table.color.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "product_variant_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const size = pgTable("size", {
	id: text().primaryKey().notNull(),
	size: integer().notNull(),
	available: boolean().notNull(),
	productId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "size_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const color = pgTable("color", {
	id: text().primaryKey().notNull(),
	color: text().notNull(),
	available: boolean().notNull(),
	productId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "color_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const cart = pgTable("cart", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("cart_userId_key").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "cart_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const cartItem = pgTable("cartItem", {
	id: text().primaryKey().notNull(),
	cartId: text().notNull(),
	productId: text().notNull(),
	variantId: text(),
	quantity: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	sizeId: text(),
	colorId: text(),
}, (table) => [
	index("cartItem_cartId_idx").using("btree", table.cartId.asc().nullsLast().op("text_ops")),
	uniqueIndex("cartItem_cartId_productId_variantId_key").using("btree", table.cartId.asc().nullsLast().op("text_ops"), table.productId.asc().nullsLast().op("text_ops"), table.variantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [cart.id],
			name: "cartItem_cartId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "cartItem_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariant.id],
			name: "cartItem_variantId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.sizeId],
			foreignColumns: [size.id],
			name: "cartItem_sizeId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.colorId],
			foreignColumns: [color.id],
			name: "cartItem_colorId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const orderItem = pgTable("orderItem", {
	id: text().primaryKey().notNull(),
	productId: text().notNull(),
	variantId: text(),
	quantity: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	sizeId: text(),
	colorId: text(),
	orderId: text(),
}, (table) => [
	index("orderItem_orderId_idx").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	uniqueIndex("orderItem_orderId_productId_variantId_key").using("btree", table.orderId.asc().nullsLast().op("text_ops"), table.productId.asc().nullsLast().op("text_ops"), table.variantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "orderItem_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariant.id],
			name: "orderItem_variantId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.sizeId],
			foreignColumns: [size.id],
			name: "orderItem_sizeId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.colorId],
			foreignColumns: [color.id],
			name: "orderItem_colorId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "orderItem_orderId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const order = pgTable("order", {
	id: text().primaryKey().notNull(),
	trackingId: text(),
	totalAmount: doublePrecision().notNull(),
	status: orderStatus().default('PENDING').notNull(),
	shippingAddress: text(),
	billingAddress: text(),
	phoneNumber: text(),
	notes: text(),
	paymentType: text(),
	paidAmount: doublePrecision(),
	paymentDate: timestamp({ precision: 3, mode: 'string' }),
	paymentCurrency: text(),
	failureReason: text(),
	failureCode: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	userId: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "order_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const address = pgTable("address", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	title: text().notNull(),
	name: text().notNull(),
	surname: text().notNull(),
	phone: text().notNull(),
	city: text().notNull(),
	district: text().notNull(),
	fullAddress: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "address_userId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);
