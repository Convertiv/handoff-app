CREATE TABLE "page_files" (
	"page_id" text NOT NULL,
	"path" text NOT NULL,
	"kind" text NOT NULL,
	"content" text,
	"storage_ref" text,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_files_page_id_pk" PRIMARY KEY("page_id"),
	CONSTRAINT "page_files_kind_markdown" CHECK ("page_files"."kind" = 'markdown'),
	CONSTRAINT "page_files_canonical_path" CHECK ("page_files"."path" = "page_files"."page_id" || '.md')
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"description" text,
	"group" text,
	"weight" integer,
	"record" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_files" ADD CONSTRAINT "page_files_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pages_group_idx" ON "pages" USING btree ("group");
