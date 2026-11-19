CREATE TYPE "public"."document_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('kbis', 'identity', 'insurance', 'professional_certification', 'other');--> statement-breakpoint
CREATE TYPE "public"."offering_unit" AS ENUM('hour', 'day', 'job', 'square_meter', 'meter', 'unit');--> statement-breakpoint
CREATE TYPE "public"."pricing_type" AS ENUM('fixed', 'hourly', 'daily', 'per_unit', 'starting_at', 'quote');--> statement-breakpoint
CREATE TABLE "worker_availabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"type" "document_type" NOT NULL,
	"name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"verified_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"name" text NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"siret" varchar(14) NOT NULL,
	"phone" text NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'France' NOT NULL,
	"departure_address" text NOT NULL,
	"departure_postal_code" text NOT NULL,
	"departure_city" text NOT NULL,
	"departure_latitude" numeric(10, 7),
	"departure_longitude" numeric(10, 7),
	"service_radius_km" integer DEFAULT 20 NOT NULL,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "worker_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "worker_profile_siret_unique" UNIQUE("siret")
);
--> statement-breakpoint
CREATE TABLE "worker_service_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"pricing_type" "pricing_type" NOT NULL,
	"amount" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_services" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"job" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_availabilities" ADD CONSTRAINT "worker_availabilities_worker_id_worker_profile_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_worker_id_worker_profile_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_photos" ADD CONSTRAINT "worker_photos_worker_id_worker_profile_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profile" ADD CONSTRAINT "worker_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_service_prices" ADD CONSTRAINT "worker_service_prices_service_id_worker_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."worker_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_services" ADD CONSTRAINT "worker_services_worker_id_worker_profile_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_availabilities_workerId_dayOfWeek_idx" ON "worker_availabilities" USING btree ("worker_id","day_of_week");--> statement-breakpoint
CREATE INDEX "worker_documents_workerId_idx" ON "worker_documents" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "worker_documents_workerId_type_idx" ON "worker_documents" USING btree ("worker_id","type");--> statement-breakpoint
CREATE INDEX "worker_photos_workerId_idx" ON "worker_photos" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "worker_services_workerId_idx" ON "worker_services" USING btree ("worker_id");