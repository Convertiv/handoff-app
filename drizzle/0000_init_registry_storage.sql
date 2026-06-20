CREATE TABLE "build_metadata" (
	"entity_kind" text NOT NULL,
	"entity_id" text NOT NULL,
	"status" text NOT NULL,
	"built_at" timestamp with time zone,
	"builder_version" text,
	"artifact_hash" text,
	"source_hash" text,
	"warnings" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "build_metadata_entity_kind_entity_id_pk" PRIMARY KEY("entity_kind","entity_id")
);
--> statement-breakpoint
CREATE TABLE "component_files" (
	"component_id" text NOT NULL,
	"path" text NOT NULL,
	"kind" text NOT NULL,
	"content" text,
	"storage_ref" text,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "component_files_component_id_path_pk" PRIMARY KEY("component_id","path"),
	CONSTRAINT "component_files_kind_not_declaration" CHECK ("component_files"."kind" <> 'declaration')
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"description" text,
	"group" text,
	"type" text,
	"renderer" text,
	"tags" jsonb,
	"categories" jsonb,
	"record" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "docs_artifacts" (
	"path" text PRIMARY KEY NOT NULL,
	"entity_kind" text NOT NULL,
	"entity_id" text,
	"artifact_kind" text NOT NULL,
	"content" text,
	"storage_ref" text,
	"content_type" text NOT NULL,
	"owner_kind" text,
	"owner_id" text,
	"references" jsonb,
	"format_version" text,
	"build_id" text,
	"hash" text,
	"size" integer,
	"gzip_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pattern_files" (
	"pattern_id" text NOT NULL,
	"path" text NOT NULL,
	"kind" text NOT NULL,
	"content" text,
	"storage_ref" text,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pattern_files_pattern_id_path_pk" PRIMARY KEY("pattern_id","path"),
	CONSTRAINT "pattern_files_kind_not_declaration" CHECK ("pattern_files"."kind" <> 'declaration')
);
--> statement-breakpoint
CREATE TABLE "patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"description" text,
	"group" text,
	"tags" jsonb,
	"components" jsonb,
	"record" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "component_files" ADD CONSTRAINT "component_files_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_files" ADD CONSTRAINT "pattern_files_pattern_id_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "components_group_idx" ON "components" USING btree ("group");--> statement-breakpoint
CREATE INDEX "docs_artifacts_entity_idx" ON "docs_artifacts" USING btree ("entity_kind","entity_id");--> statement-breakpoint
CREATE INDEX "docs_artifacts_owner_idx" ON "docs_artifacts" USING btree ("owner_kind","owner_id");--> statement-breakpoint
CREATE INDEX "patterns_group_idx" ON "patterns" USING btree ("group");