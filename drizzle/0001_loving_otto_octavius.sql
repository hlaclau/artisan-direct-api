CREATE TYPE "public"."document_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('kbis');--> statement-breakpoint
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
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "worker_photos_position_nonnegative" CHECK ("worker_photos"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "worker_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"siret" varchar(14) NOT NULL,
	"phone" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"departure_address" text NOT NULL,
	"departure_postal_code" text NOT NULL,
	"departure_city" text NOT NULL,
	"departure_latitude" numeric(10, 7),
	"departure_longitude" numeric(10, 7),
	"service_radius_km" integer NOT NULL,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "worker_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "worker_profile_siret_unique" UNIQUE("siret"),
	CONSTRAINT "worker_profile_siret_format" CHECK ("worker_profile"."siret" ~ '^[0-9]{14}$'),
	CONSTRAINT "worker_profile_service_radius_nonnegative" CHECK ("worker_profile"."service_radius_km" >= 0),
	CONSTRAINT "worker_profile_departure_latitude_range" CHECK ("worker_profile"."departure_latitude" is null or "worker_profile"."departure_latitude" between -90 and 90),
	CONSTRAINT "worker_profile_departure_longitude_range" CHECK ("worker_profile"."departure_longitude" is null or "worker_profile"."departure_longitude" between -180 and 180)
);
--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_worker_id_worker_profile_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_photos" ADD CONSTRAINT "worker_photos_worker_id_worker_profile_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profile" ADD CONSTRAINT "worker_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "worker_documents_worker_type_idx" ON "worker_documents" USING btree ("worker_id","type");--> statement-breakpoint
CREATE INDEX "worker_documents_expiration_idx" ON "worker_documents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "worker_photos_worker_id_idx" ON "worker_photos" USING btree ("worker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "worker_photos_worker_position_idx" ON "worker_photos" USING btree ("worker_id","position");