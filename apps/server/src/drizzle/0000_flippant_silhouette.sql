-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."OrderStatus" AS ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('CUSTOMER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"_id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" text PRIMARY KEY NOT NULL,
	"carousel" text[] DEFAULT '{"RAY"}',
	"separator" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"role" "Role" DEFAULT 'CUSTOMER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"_id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"_id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"description" text NOT NULL,
	"imageUrls" text[],
	"discount" integer,
	"stockCode" text NOT NULL,
	"available" boolean NOT NULL,
	"categories" text[]
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" text PRIMARY KEY NOT NULL,
	"size" integer NOT NULL,
	"color" text NOT NULL,
	"available" boolean NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"productId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "size" (
	"id" text PRIMARY KEY NOT NULL,
	"size" integer NOT NULL,
	"available" boolean NOT NULL,
	"productId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "color" (
	"id" text PRIMARY KEY NOT NULL,
	"color" text NOT NULL,
	"available" boolean NOT NULL,
	"productId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cartItem" (
	"id" text PRIMARY KEY NOT NULL,
	"cartId" text NOT NULL,
	"productId" text NOT NULL,
	"variantId" text,
	"quantity" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"sizeId" text,
	"colorId" text
);
--> statement-breakpoint
CREATE TABLE "orderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"variantId" text,
	"quantity" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"sizeId" text,
	"colorId" text,
	"orderId" text
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"trackingId" text,
	"totalAmount" double precision NOT NULL,
	"status" "OrderStatus" DEFAULT 'PENDING' NOT NULL,
	"shippingAddress" text,
	"billingAddress" text,
	"phoneNumber" text,
	"notes" text,
	"paymentType" text,
	"paidAmount" double precision,
	"paymentDate" timestamp(3),
	"paymentCurrency" text,
	"failureReason" text,
	"failureCode" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"userId" text
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "size" ADD CONSTRAINT "size_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "color" ADD CONSTRAINT "color_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cartItem" ADD CONSTRAINT "cartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cartItem" ADD CONSTRAINT "cartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cartItem" ADD CONSTRAINT "cartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."product_variant"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cartItem" ADD CONSTRAINT "cartItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."size"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cartItem" ADD CONSTRAINT "cartItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "public"."color"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."product_variant"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."size"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "public"."color"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "product_id_key" ON "product" USING btree ("id" text_ops);--> statement-breakpoint
CREATE INDEX "product_variant_available_idx" ON "product_variant" USING btree ("available" bool_ops);--> statement-breakpoint
CREATE INDEX "product_variant_productId_idx" ON "product_variant" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_productId_size_color_key" ON "product_variant" USING btree ("productId" text_ops,"size" int4_ops,"color" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "cart_userId_key" ON "cart" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "cartItem_cartId_idx" ON "cartItem" USING btree ("cartId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "cartItem_cartId_productId_variantId_key" ON "cartItem" USING btree ("cartId" text_ops,"productId" text_ops,"variantId" text_ops);--> statement-breakpoint
CREATE INDEX "orderItem_orderId_idx" ON "orderItem" USING btree ("orderId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "orderItem_orderId_productId_variantId_key" ON "orderItem" USING btree ("orderId" text_ops,"productId" text_ops,"variantId" text_ops);
*/