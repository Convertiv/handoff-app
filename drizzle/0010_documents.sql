CREATE TABLE "documents" (
	"owner_kind" text NOT NULL,
	"owner_id" text NOT NULL,
	"collection" text NOT NULL,
	"id" text NOT NULL,
	"data" jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_owner_kind_owner_id_collection_id_pk" PRIMARY KEY("owner_kind","owner_id","collection","id"),
	CONSTRAINT "documents_data_object" CHECK (jsonb_typeof("documents"."data") = 'object'),
	CONSTRAINT "documents_revision_positive" CHECK ("documents"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_registry_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."registry_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_registry_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."registry_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_data_idx" ON "documents" USING gin ("data" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "documents_updated_idx" ON "documents" USING btree ("owner_kind","owner_id","collection","updated_at");