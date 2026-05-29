CREATE TABLE "tracking_links" (
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
CREATE TABLE "ip_logs" (
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
ALTER TABLE "ip_logs" ADD CONSTRAINT "ip_logs_link_id_tracking_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."tracking_links"("id") ON DELETE cascade ON UPDATE no action;