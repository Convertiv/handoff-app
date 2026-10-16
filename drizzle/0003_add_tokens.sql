CREATE TABLE "token_artifacts" (
	"token_set_id" text NOT NULL,
	"path" text NOT NULL,
	"format" text NOT NULL,
	"content" text,
	"storage_ref" text,
	"content_type" text NOT NULL,
	"hash" text,
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_artifacts_token_set_id_path_pk" PRIMARY KEY("token_set_id","path")
);
--> statement-breakpoint
CREATE TABLE "token_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"record" jsonb NOT NULL,
	"source_hash" text,
	"status" text,
	"built_at" timestamp with time zone,
	"builder_version" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "token_artifacts" ADD CONSTRAINT "token_artifacts_token_set_id_token_sets_id_fk" FOREIGN KEY ("token_set_id") REFERENCES "public"."token_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "token_sets_kind_idx" ON "token_sets" USING btree ("kind");