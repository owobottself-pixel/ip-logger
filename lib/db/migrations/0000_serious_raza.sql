CREATE TABLE IF NOT EXISTS "tracking_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" text NOT NULL,
  	"token" text NOT NULL,
  	"slug" text,
  	"description" text,
  	"redirect_url" text,
  	"visit_count" integer DEFAULT 0 NOT NULL,
  	"og_title" text,
  	"og_description" text,
  	"og_image" text,
  	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
  	CONSTRAINT "tracking_links_token_unique" UNIQUE("token"),
  	CONSTRAINT "tracking_links_slug_unique" UNIQUE("slug")
  );
  --> statement-breakpoint
  CREATE TABLE IF NOT EXISTS "ip_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_id" integer NOT NULL,
  	"ip" text NOT NULL,
  	"user_agent" text,
  	"country" text,
  	"region" text,
  	"city" text,
  	"zip" text,
  	"lat" real,
  	"lon" real,
  	"gps_accuracy" real,
  	"timezone" text,
  	"isp" text,
  	"org" text,
  	"asn" text,
  	"mobile" boolean,
  	"proxy" boolean,
  	"hosting" boolean,
  	"referrer" text,
  	"photo" text,
  	"created_at" timestamp with time zone DEFAULT now() NOT NULL
  );
  --> statement-breakpoint
  DO $$ BEGIN
  	ALTER TABLE "ip_logs" ADD CONSTRAINT "ip_logs_link_id_tracking_links_id_fk"
  		FOREIGN KEY ("link_id") REFERENCES "public"."tracking_links"("id")
  		ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  --> statement-breakpoint
  ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "description" text;
  --> statement-breakpoint
  ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "redirect_url" text;
  --> statement-breakpoint
  ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "visit_count" integer DEFAULT 0;
  --> statement-breakpoint
  ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "og_title" text;
  --> statement-breakpoint
  ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "og_description" text;
  --> statement-breakpoint
  ALTER TABLE "tracking_links" ADD COLUMN IF NOT EXISTS "og_image" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "user_agent" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "country" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "region" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "city" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "zip" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "lat" real;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "lon" real;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "gps_accuracy" real;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "timezone" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "isp" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "org" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "asn" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "mobile" boolean;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "proxy" boolean;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "hosting" boolean;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "referrer" text;
  --> statement-breakpoint
  ALTER TABLE "ip_logs" ADD COLUMN IF NOT EXISTS "photo" text;
  