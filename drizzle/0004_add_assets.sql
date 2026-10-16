CREATE TABLE "asset_blobs" (
	"hash" text PRIMARY KEY NOT NULL,
	"storage_provider" text NOT NULL,
	"content" "bytea",
	"storage_ref" text,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_collections" (
	"collection" text PRIMARY KEY NOT NULL,
	"source_hash" text,
	"status" text,
	"built_at" timestamp with time zone,
	"builder_version" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"collection" text NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer,
	"content_hash" text NOT NULL,
	"metadata" jsonb,
	"blob_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_collection_path_pk" PRIMARY KEY("collection","path")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_collection_asset_collections_collection_fk" FOREIGN KEY ("collection") REFERENCES "public"."asset_collections"("collection") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_blob_hash_asset_blobs_hash_fk" FOREIGN KEY ("blob_hash") REFERENCES "public"."asset_blobs"("hash") ON DELETE no action ON UPDATE no action;