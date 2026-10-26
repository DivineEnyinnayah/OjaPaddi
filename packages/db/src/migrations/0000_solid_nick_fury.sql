CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`full_name` text,
	`phone` text,
	`plan` text DEFAULT 'free',
	`plan_expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_phone_idx` ON `user` (`phone`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`description` text,
	`category` text,
	`logo_url` text,
	`phone` text,
	`email` text,
	`address` text,
	`city` text,
	`state` text,
	`country` text DEFAULT 'Nigeria' NOT NULL,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`whatsapp_number` text,
	`is_published` integer DEFAULT false NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_slug_unique` ON `businesses` (`slug`);--> statement-breakpoint
CREATE INDEX `businesses_user_id_idx` ON `businesses` (`user_id`);--> statement-breakpoint
CREATE INDEX `businesses_slug_idx` ON `businesses` (`slug`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text,
	`customer_type` text DEFAULT 'individual' NOT NULL,
	`expected_payment_period_days` integer,
	`supplied_product_ids` text DEFAULT '[]',
	`total_spent` text DEFAULT '0' NOT NULL,
	`order_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customers_business_id_idx` ON `customers` (`business_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_business_phone_uniq` ON `customers` (`business_id`,`phone`) WHERE "customers"."phone" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` text NOT NULL,
	`category` text,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurring_frequency` text,
	`due_date` integer,
	`is_paid` integer DEFAULT true NOT NULL,
	`reminder_days_before` integer DEFAULT 3,
	`incurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expenses_business_id_idx` ON `expenses` (`business_id`);--> statement-breakpoint
CREATE INDEX `expenses_business_incurred_at_idx` ON `expenses` (`business_id`,`incurred_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sku` text,
	`category` text,
	`price` text NOT NULL,
	`cost_price` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_business_id_idx` ON `products` (`business_id`);--> statement-breakpoint
CREATE INDEX `products_business_category_idx` ON `products` (`business_id`,`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_business_sku_uniq` ON `products` (`business_id`,`sku`) WHERE "products"."sku" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`customer_id` text,
	`reference` text NOT NULL,
	`order_type` text DEFAULT 'customer' NOT NULL,
	`expected_payment_date` integer,
	`subtotal` text NOT NULL,
	`discount` text DEFAULT '0' NOT NULL,
	`returned_amount` text DEFAULT '0' NOT NULL,
	`total` text NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'paid' NOT NULL,
	`amount_paid` text NOT NULL,
	`notes` text,
	`sold_at` integer,
	`created_at` integer NOT NULL,
	`voided_at` integer,
	`voided_by` text,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_reference_unique` ON `sales` (`reference`);--> statement-breakpoint
CREATE INDEX `sales_business_id_idx` ON `sales` (`business_id`);--> statement-breakpoint
CREATE INDEX `sales_business_sold_at_idx` ON `sales` (`business_id`,`sold_at`);--> statement-breakpoint
CREATE INDEX `sales_business_customer_idx` ON `sales` (`business_id`,`customer_id`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`product_name` text NOT NULL,
	`unit_price` text NOT NULL,
	`cost_price` text,
	`quantity` integer NOT NULL,
	`returned_quantity` integer DEFAULT 0 NOT NULL,
	`total` text NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `sale_items_sale_id_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_product_id_idx` ON `sale_items` (`product_id`);