CREATE TABLE "registry_access_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"secret_hash" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_access_tokens_name_not_blank" CHECK (length(btrim("registry_access_tokens"."name")) > 0),
	CONSTRAINT "registry_access_tokens_scopes_array" CHECK (jsonb_typeof("registry_access_tokens"."scopes") = 'array')
);
--> statement-breakpoint
CREATE TABLE "registry_auth_action_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_auth_action_tokens_purpose_valid" CHECK ("registry_auth_action_tokens"."purpose" in ('invite', 'password_reset'))
);
--> statement-breakpoint
CREATE TABLE "registry_auth_rate_limits" (
	"bucket" text NOT NULL,
	"identifier_hash" text NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_auth_rate_limits_bucket_identifier_hash_window_started_at_pk" PRIMARY KEY("bucket","identifier_hash","window_started_at"),
	CONSTRAINT "registry_auth_rate_limits_bucket_valid" CHECK ("registry_auth_rate_limits"."bucket" in ('login', 'password_reset', 'device')),
	CONSTRAINT "registry_auth_rate_limits_attempts_positive" CHECK ("registry_auth_rate_limits"."attempts" > 0)
);
--> statement-breakpoint
CREATE TABLE "registry_device_authorizations" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code_hash" text NOT NULL,
	"user_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text,
	"scopes" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_device_authorizations_status_valid" CHECK ("registry_device_authorizations"."status" in ('pending', 'approved', 'denied', 'consumed')),
	CONSTRAINT "registry_device_authorizations_scopes_array" CHECK (jsonb_typeof("registry_device_authorizations"."scopes") = 'array')
);
--> statement-breakpoint
CREATE TABLE "registry_installations" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"status" text DEFAULT 'installed' NOT NULL,
	"schema_version" integer NOT NULL,
	"initial_admin_user_id" text NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_installations_singleton" CHECK ("registry_installations"."id" = 'default'),
	CONSTRAINT "registry_installations_status_valid" CHECK ("registry_installations"."status" = 'installed'),
	CONSTRAINT "registry_installations_schema_version_positive" CHECK ("registry_installations"."schema_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "registry_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"password_hash" text,
	"email_verified_at" timestamp with time zone,
	"auth_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_users_email_normalized" CHECK ("registry_users"."email" = lower(btrim("registry_users"."email"))),
	CONSTRAINT "registry_users_role_valid" CHECK ("registry_users"."role" in ('admin', 'member')),
	CONSTRAINT "registry_users_status_valid" CHECK ("registry_users"."status" in ('invited', 'active', 'deactivated')),
	CONSTRAINT "registry_users_auth_version_positive" CHECK ("registry_users"."auth_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "registry_access_tokens" ADD CONSTRAINT "registry_access_tokens_user_id_registry_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."registry_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_auth_action_tokens" ADD CONSTRAINT "registry_auth_action_tokens_user_id_registry_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."registry_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_device_authorizations" ADD CONSTRAINT "registry_device_authorizations_user_id_registry_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."registry_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_installations" ADD CONSTRAINT "registry_installations_initial_admin_user_id_registry_users_id_fk" FOREIGN KEY ("initial_admin_user_id") REFERENCES "public"."registry_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registry_access_tokens_user_idx" ON "registry_access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "registry_access_tokens_expires_idx" ON "registry_access_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_auth_action_tokens_hash_idx" ON "registry_auth_action_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "registry_auth_action_tokens_user_purpose_idx" ON "registry_auth_action_tokens" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "registry_auth_rate_limits_expires_idx" ON "registry_auth_rate_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_device_authorizations_device_hash_idx" ON "registry_device_authorizations" USING btree ("device_code_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_device_authorizations_user_code_idx" ON "registry_device_authorizations" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "registry_device_authorizations_expires_idx" ON "registry_device_authorizations" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_users_normalized_email_idx" ON "registry_users" USING btree (lower(btrim("email")));--> statement-breakpoint
CREATE INDEX "registry_users_status_role_idx" ON "registry_users" USING btree ("status","role");