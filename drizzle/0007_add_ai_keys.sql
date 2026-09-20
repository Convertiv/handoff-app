CREATE TABLE "registry_ai_keys" (
	"user_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_ai_keys_user_id_connection_id_pk" PRIMARY KEY("user_id","connection_id"),
	CONSTRAINT "registry_ai_keys_connection_not_blank" CHECK (length(btrim("registry_ai_keys"."connection_id")) > 0)
);
--> statement-breakpoint
ALTER TABLE "registry_ai_keys" ADD CONSTRAINT "registry_ai_keys_user_id_registry_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."registry_users"("id") ON DELETE cascade ON UPDATE no action;