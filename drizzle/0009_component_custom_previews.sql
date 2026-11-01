CREATE TABLE "component_custom_previews" (
	"id" text PRIMARY KEY NOT NULL,
	"component_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"args" jsonb NOT NULL,
	"contract_fingerprint" text NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "component_custom_previews_title_not_blank" CHECK (length(btrim("component_custom_previews"."title")) > 0),
	CONSTRAINT "component_custom_previews_args_object" CHECK (jsonb_typeof("component_custom_previews"."args") = 'object')
);
--> statement-breakpoint
ALTER TABLE "component_custom_previews" ADD CONSTRAINT "component_custom_previews_created_by_registry_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."registry_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_custom_previews" ADD CONSTRAINT "component_custom_previews_updated_by_registry_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."registry_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "component_custom_previews_component_idx" ON "component_custom_previews" USING btree ("component_id");