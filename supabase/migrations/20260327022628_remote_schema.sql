drop extension if exists "pg_net";


  create table "public"."admin_invites" (
    "id" character varying(64) not null,
    "email" character varying(191) not null,
    "role" character varying(30) not null default 'moderator'::character varying,
    "invited_by" character varying(64),
    "token" character varying(128) not null,
    "used" boolean default false,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."admin_logs" (
    "id" character varying(64) not null,
    "admin_id" character varying(64),
    "action" character varying(64),
    "target_id" character varying(64),
    "details" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."auth_users" (
    "user_id" character varying(64) not null,
    "email" character varying(191) not null,
    "password_hash" character varying(255) not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."candidatures" (
    "id" character varying(64) not null,
    "mission_id" character varying(64),
    "jeune_id" character varying(64),
    "jeune_nom" character varying(120),
    "jeune_prenom" character varying(120),
    "jeune_photo" text,
    "jeune_note" numeric(3,2),
    "lettre_motivation" text,
    "statut" character varying(20) default 'en_attente'::character varying,
    "date_postulation" timestamp with time zone default now(),
    "date_reponse" timestamp with time zone,
    "motif_refus" text
      );



  create table "public"."entreprise_profiles" (
    "user_id" character varying(64) not null,
    "nom_entreprise" character varying(191),
    "secteur_activite" character varying(191),
    "description" text,
    "adresse" text,
    "site_web" character varying(255),
    "logo" text,
    "notes_moyenne" numeric(3,2),
    "nombre_evaluations" integer default 0,
    "missions_publiees" integer default 0
      );



  create table "public"."evaluations" (
    "id" character varying(64) not null,
    "mission_id" character varying(64),
    "evaluateur_id" character varying(64),
    "evaluateur_nom" character varying(191),
    "evalue_id" character varying(64),
    "note" integer,
    "commentaire" text,
    "date_evaluation" timestamp with time zone default now()
      );



  create table "public"."jeune_profiles" (
    "user_id" character varying(64) not null,
    "date_naissance" date,
    "age" integer,
    "competences" jsonb default '[]'::jsonb,
    "experience" text,
    "education" text,
    "cv" text,
    "photo" text,
    "notes_moyenne" numeric(3,2),
    "nombre_evaluations" integer default 0,
    "missions_completees" integer default 0
      );



  create table "public"."microjob_auth" (
    "user_id" character varying(64) not null,
    "email" character varying(191) not null,
    "password_hash" character varying(255) not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."microjob_users" (
    "id" character varying(64) not null,
    "email" character varying(191) not null,
    "user_type" character varying(20) not null,
    "nom" character varying(120) not null,
    "prenom" character varying(120),
    "telephone" character varying(40),
    "ville" character varying(120),
    "identity_document_path" text,
    "identity_verified" boolean default false,
    "identity_verified_at" timestamp with time zone,
    "identity_verified_by" character varying(64),
    "banned" boolean default false,
    "ban_reason" character varying(255),
    "created_at" timestamp with time zone default now(),
    "admin_role" character varying(30) default NULL::character varying
      );



  create table "public"."missions" (
    "id" character varying(64) not null,
    "entreprise_id" character varying(64),
    "entreprise_nom" character varying(191),
    "titre" character varying(191) not null,
    "description" text,
    "competences_requises" jsonb default '[]'::jsonb,
    "remuneration" numeric(12,2),
    "duree" character varying(120),
    "date_debut" date,
    "date_fin" date,
    "lieu" character varying(191),
    "nombre_postes" integer default 1,
    "max_candidatures" integer default 1,
    "statut" character varying(20) default 'ouverte'::character varying,
    "candidatures_count" integer default 0,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."notifications" (
    "id" character varying(64) not null,
    "user_id" character varying(64),
    "titre" character varying(191) not null,
    "message" text not null,
    "type" character varying(30),
    "lu" boolean default false,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."reports" (
    "id" character varying(64) not null,
    "reporter_id" character varying(64),
    "target_id" character varying(64),
    "target_type" character varying(32),
    "reason" text,
    "status" character varying(32) default 'pending'::character varying,
    "resolved_at" timestamp with time zone,
    "resolved_by" character varying(64),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "user_type" text not null,
    "nom" text not null,
    "prenom" text,
    "telephone" text,
    "ville" text,
    "created_at" timestamp with time zone default now(),
    "identity_document_path" text,
    "identity_verified" boolean default false,
    "identity_verified_at" timestamp with time zone,
    "identity_verified_by" character varying(64),
    "banned" boolean default false,
    "ban_reason" character varying(255)
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX admin_invites_email_key ON public.admin_invites USING btree (email);

CREATE UNIQUE INDEX admin_invites_pkey ON public.admin_invites USING btree (id);

CREATE UNIQUE INDEX admin_invites_token_key ON public.admin_invites USING btree (token);

CREATE UNIQUE INDEX admin_logs_pkey ON public.admin_logs USING btree (id);

CREATE UNIQUE INDEX auth_users_email_key ON public.auth_users USING btree (email);

CREATE UNIQUE INDEX auth_users_pkey ON public.auth_users USING btree (user_id);

CREATE UNIQUE INDEX candidatures_pkey ON public.candidatures USING btree (id);

CREATE UNIQUE INDEX entreprise_profiles_pkey ON public.entreprise_profiles USING btree (user_id);

CREATE UNIQUE INDEX evaluations_pkey ON public.evaluations USING btree (id);

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);

CREATE UNIQUE INDEX jeune_profiles_pkey ON public.jeune_profiles USING btree (user_id);

CREATE UNIQUE INDEX microjob_auth_email_key ON public.microjob_auth USING btree (email);

CREATE UNIQUE INDEX microjob_auth_pkey ON public.microjob_auth USING btree (user_id);

CREATE UNIQUE INDEX microjob_users_email_key ON public.microjob_users USING btree (email);

CREATE UNIQUE INDEX microjob_users_pkey ON public.microjob_users USING btree (id);

CREATE UNIQUE INDEX missions_pkey ON public.missions USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."admin_invites" add constraint "admin_invites_pkey" PRIMARY KEY using index "admin_invites_pkey";

alter table "public"."admin_logs" add constraint "admin_logs_pkey" PRIMARY KEY using index "admin_logs_pkey";

alter table "public"."auth_users" add constraint "auth_users_pkey" PRIMARY KEY using index "auth_users_pkey";

alter table "public"."candidatures" add constraint "candidatures_pkey" PRIMARY KEY using index "candidatures_pkey";

alter table "public"."entreprise_profiles" add constraint "entreprise_profiles_pkey" PRIMARY KEY using index "entreprise_profiles_pkey";

alter table "public"."evaluations" add constraint "evaluations_pkey" PRIMARY KEY using index "evaluations_pkey";

alter table "public"."jeune_profiles" add constraint "jeune_profiles_pkey" PRIMARY KEY using index "jeune_profiles_pkey";

alter table "public"."microjob_auth" add constraint "microjob_auth_pkey" PRIMARY KEY using index "microjob_auth_pkey";

alter table "public"."microjob_users" add constraint "microjob_users_pkey" PRIMARY KEY using index "microjob_users_pkey";

alter table "public"."missions" add constraint "missions_pkey" PRIMARY KEY using index "missions_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."admin_invites" add constraint "admin_invites_email_key" UNIQUE using index "admin_invites_email_key";

alter table "public"."admin_invites" add constraint "admin_invites_token_key" UNIQUE using index "admin_invites_token_key";

alter table "public"."auth_users" add constraint "auth_users_email_key" UNIQUE using index "auth_users_email_key";

alter table "public"."microjob_auth" add constraint "microjob_auth_email_key" UNIQUE using index "microjob_auth_email_key";

alter table "public"."microjob_users" add constraint "microjob_users_email_key" UNIQUE using index "microjob_users_email_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_user_type_check" CHECK ((user_type = ANY (ARRAY['jeune'::text, 'entreprise'::text, 'admin'::text]))) not valid;

alter table "public"."users" validate constraint "users_user_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.candidature_notify_company()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  entreprise_uuid uuid;
BEGIN
  SELECT entreprise_id INTO entreprise_uuid FROM public.missions WHERE id = NEW.mission_id;
  IF entreprise_uuid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, titre, message, type, created_at)
    VALUES (
      entreprise_uuid,
      'Nouvelle candidature',
      'Vous avez reçu une nouvelle candidature pour la mission: ' || COALESCE(NEW.jeune_nom,'') || ' ' || COALESCE(NEW.jeune_prenom,''),
      'candidature',
      now()
    );
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_invites" to "anon";

grant insert on table "public"."admin_invites" to "anon";

grant references on table "public"."admin_invites" to "anon";

grant select on table "public"."admin_invites" to "anon";

grant trigger on table "public"."admin_invites" to "anon";

grant truncate on table "public"."admin_invites" to "anon";

grant update on table "public"."admin_invites" to "anon";

grant delete on table "public"."admin_invites" to "authenticated";

grant insert on table "public"."admin_invites" to "authenticated";

grant references on table "public"."admin_invites" to "authenticated";

grant select on table "public"."admin_invites" to "authenticated";

grant trigger on table "public"."admin_invites" to "authenticated";

grant truncate on table "public"."admin_invites" to "authenticated";

grant update on table "public"."admin_invites" to "authenticated";

grant delete on table "public"."admin_invites" to "service_role";

grant insert on table "public"."admin_invites" to "service_role";

grant references on table "public"."admin_invites" to "service_role";

grant select on table "public"."admin_invites" to "service_role";

grant trigger on table "public"."admin_invites" to "service_role";

grant truncate on table "public"."admin_invites" to "service_role";

grant update on table "public"."admin_invites" to "service_role";

grant delete on table "public"."admin_logs" to "anon";

grant insert on table "public"."admin_logs" to "anon";

grant references on table "public"."admin_logs" to "anon";

grant select on table "public"."admin_logs" to "anon";

grant trigger on table "public"."admin_logs" to "anon";

grant truncate on table "public"."admin_logs" to "anon";

grant update on table "public"."admin_logs" to "anon";

grant delete on table "public"."admin_logs" to "authenticated";

grant insert on table "public"."admin_logs" to "authenticated";

grant references on table "public"."admin_logs" to "authenticated";

grant select on table "public"."admin_logs" to "authenticated";

grant trigger on table "public"."admin_logs" to "authenticated";

grant truncate on table "public"."admin_logs" to "authenticated";

grant update on table "public"."admin_logs" to "authenticated";

grant delete on table "public"."admin_logs" to "service_role";

grant insert on table "public"."admin_logs" to "service_role";

grant references on table "public"."admin_logs" to "service_role";

grant select on table "public"."admin_logs" to "service_role";

grant trigger on table "public"."admin_logs" to "service_role";

grant truncate on table "public"."admin_logs" to "service_role";

grant update on table "public"."admin_logs" to "service_role";

grant delete on table "public"."auth_users" to "anon";

grant insert on table "public"."auth_users" to "anon";

grant references on table "public"."auth_users" to "anon";

grant select on table "public"."auth_users" to "anon";

grant trigger on table "public"."auth_users" to "anon";

grant truncate on table "public"."auth_users" to "anon";

grant update on table "public"."auth_users" to "anon";

grant delete on table "public"."auth_users" to "authenticated";

grant insert on table "public"."auth_users" to "authenticated";

grant references on table "public"."auth_users" to "authenticated";

grant select on table "public"."auth_users" to "authenticated";

grant trigger on table "public"."auth_users" to "authenticated";

grant truncate on table "public"."auth_users" to "authenticated";

grant update on table "public"."auth_users" to "authenticated";

grant delete on table "public"."auth_users" to "service_role";

grant insert on table "public"."auth_users" to "service_role";

grant references on table "public"."auth_users" to "service_role";

grant select on table "public"."auth_users" to "service_role";

grant trigger on table "public"."auth_users" to "service_role";

grant truncate on table "public"."auth_users" to "service_role";

grant update on table "public"."auth_users" to "service_role";

grant delete on table "public"."candidatures" to "anon";

grant insert on table "public"."candidatures" to "anon";

grant references on table "public"."candidatures" to "anon";

grant select on table "public"."candidatures" to "anon";

grant trigger on table "public"."candidatures" to "anon";

grant truncate on table "public"."candidatures" to "anon";

grant update on table "public"."candidatures" to "anon";

grant delete on table "public"."candidatures" to "authenticated";

grant insert on table "public"."candidatures" to "authenticated";

grant references on table "public"."candidatures" to "authenticated";

grant select on table "public"."candidatures" to "authenticated";

grant trigger on table "public"."candidatures" to "authenticated";

grant truncate on table "public"."candidatures" to "authenticated";

grant update on table "public"."candidatures" to "authenticated";

grant delete on table "public"."candidatures" to "service_role";

grant insert on table "public"."candidatures" to "service_role";

grant references on table "public"."candidatures" to "service_role";

grant select on table "public"."candidatures" to "service_role";

grant trigger on table "public"."candidatures" to "service_role";

grant truncate on table "public"."candidatures" to "service_role";

grant update on table "public"."candidatures" to "service_role";

grant delete on table "public"."entreprise_profiles" to "anon";

grant insert on table "public"."entreprise_profiles" to "anon";

grant references on table "public"."entreprise_profiles" to "anon";

grant select on table "public"."entreprise_profiles" to "anon";

grant trigger on table "public"."entreprise_profiles" to "anon";

grant truncate on table "public"."entreprise_profiles" to "anon";

grant update on table "public"."entreprise_profiles" to "anon";

grant delete on table "public"."entreprise_profiles" to "authenticated";

grant insert on table "public"."entreprise_profiles" to "authenticated";

grant references on table "public"."entreprise_profiles" to "authenticated";

grant select on table "public"."entreprise_profiles" to "authenticated";

grant trigger on table "public"."entreprise_profiles" to "authenticated";

grant truncate on table "public"."entreprise_profiles" to "authenticated";

grant update on table "public"."entreprise_profiles" to "authenticated";

grant delete on table "public"."entreprise_profiles" to "service_role";

grant insert on table "public"."entreprise_profiles" to "service_role";

grant references on table "public"."entreprise_profiles" to "service_role";

grant select on table "public"."entreprise_profiles" to "service_role";

grant trigger on table "public"."entreprise_profiles" to "service_role";

grant truncate on table "public"."entreprise_profiles" to "service_role";

grant update on table "public"."entreprise_profiles" to "service_role";

grant delete on table "public"."evaluations" to "anon";

grant insert on table "public"."evaluations" to "anon";

grant references on table "public"."evaluations" to "anon";

grant select on table "public"."evaluations" to "anon";

grant trigger on table "public"."evaluations" to "anon";

grant truncate on table "public"."evaluations" to "anon";

grant update on table "public"."evaluations" to "anon";

grant delete on table "public"."evaluations" to "authenticated";

grant insert on table "public"."evaluations" to "authenticated";

grant references on table "public"."evaluations" to "authenticated";

grant select on table "public"."evaluations" to "authenticated";

grant trigger on table "public"."evaluations" to "authenticated";

grant truncate on table "public"."evaluations" to "authenticated";

grant update on table "public"."evaluations" to "authenticated";

grant delete on table "public"."evaluations" to "service_role";

grant insert on table "public"."evaluations" to "service_role";

grant references on table "public"."evaluations" to "service_role";

grant select on table "public"."evaluations" to "service_role";

grant trigger on table "public"."evaluations" to "service_role";

grant truncate on table "public"."evaluations" to "service_role";

grant update on table "public"."evaluations" to "service_role";

grant delete on table "public"."jeune_profiles" to "anon";

grant insert on table "public"."jeune_profiles" to "anon";

grant references on table "public"."jeune_profiles" to "anon";

grant select on table "public"."jeune_profiles" to "anon";

grant trigger on table "public"."jeune_profiles" to "anon";

grant truncate on table "public"."jeune_profiles" to "anon";

grant update on table "public"."jeune_profiles" to "anon";

grant delete on table "public"."jeune_profiles" to "authenticated";

grant insert on table "public"."jeune_profiles" to "authenticated";

grant references on table "public"."jeune_profiles" to "authenticated";

grant select on table "public"."jeune_profiles" to "authenticated";

grant trigger on table "public"."jeune_profiles" to "authenticated";

grant truncate on table "public"."jeune_profiles" to "authenticated";

grant update on table "public"."jeune_profiles" to "authenticated";

grant delete on table "public"."jeune_profiles" to "service_role";

grant insert on table "public"."jeune_profiles" to "service_role";

grant references on table "public"."jeune_profiles" to "service_role";

grant select on table "public"."jeune_profiles" to "service_role";

grant trigger on table "public"."jeune_profiles" to "service_role";

grant truncate on table "public"."jeune_profiles" to "service_role";

grant update on table "public"."jeune_profiles" to "service_role";

grant delete on table "public"."microjob_auth" to "anon";

grant insert on table "public"."microjob_auth" to "anon";

grant references on table "public"."microjob_auth" to "anon";

grant select on table "public"."microjob_auth" to "anon";

grant trigger on table "public"."microjob_auth" to "anon";

grant truncate on table "public"."microjob_auth" to "anon";

grant update on table "public"."microjob_auth" to "anon";

grant delete on table "public"."microjob_auth" to "authenticated";

grant insert on table "public"."microjob_auth" to "authenticated";

grant references on table "public"."microjob_auth" to "authenticated";

grant select on table "public"."microjob_auth" to "authenticated";

grant trigger on table "public"."microjob_auth" to "authenticated";

grant truncate on table "public"."microjob_auth" to "authenticated";

grant update on table "public"."microjob_auth" to "authenticated";

grant delete on table "public"."microjob_auth" to "service_role";

grant insert on table "public"."microjob_auth" to "service_role";

grant references on table "public"."microjob_auth" to "service_role";

grant select on table "public"."microjob_auth" to "service_role";

grant trigger on table "public"."microjob_auth" to "service_role";

grant truncate on table "public"."microjob_auth" to "service_role";

grant update on table "public"."microjob_auth" to "service_role";

grant delete on table "public"."microjob_users" to "anon";

grant insert on table "public"."microjob_users" to "anon";

grant references on table "public"."microjob_users" to "anon";

grant select on table "public"."microjob_users" to "anon";

grant trigger on table "public"."microjob_users" to "anon";

grant truncate on table "public"."microjob_users" to "anon";

grant update on table "public"."microjob_users" to "anon";

grant delete on table "public"."microjob_users" to "authenticated";

grant insert on table "public"."microjob_users" to "authenticated";

grant references on table "public"."microjob_users" to "authenticated";

grant select on table "public"."microjob_users" to "authenticated";

grant trigger on table "public"."microjob_users" to "authenticated";

grant truncate on table "public"."microjob_users" to "authenticated";

grant update on table "public"."microjob_users" to "authenticated";

grant delete on table "public"."microjob_users" to "service_role";

grant insert on table "public"."microjob_users" to "service_role";

grant references on table "public"."microjob_users" to "service_role";

grant select on table "public"."microjob_users" to "service_role";

grant trigger on table "public"."microjob_users" to "service_role";

grant truncate on table "public"."microjob_users" to "service_role";

grant update on table "public"."microjob_users" to "service_role";

grant delete on table "public"."missions" to "anon";

grant insert on table "public"."missions" to "anon";

grant references on table "public"."missions" to "anon";

grant select on table "public"."missions" to "anon";

grant trigger on table "public"."missions" to "anon";

grant truncate on table "public"."missions" to "anon";

grant update on table "public"."missions" to "anon";

grant delete on table "public"."missions" to "authenticated";

grant insert on table "public"."missions" to "authenticated";

grant references on table "public"."missions" to "authenticated";

grant select on table "public"."missions" to "authenticated";

grant trigger on table "public"."missions" to "authenticated";

grant truncate on table "public"."missions" to "authenticated";

grant update on table "public"."missions" to "authenticated";

grant delete on table "public"."missions" to "service_role";

grant insert on table "public"."missions" to "service_role";

grant references on table "public"."missions" to "service_role";

grant select on table "public"."missions" to "service_role";

grant trigger on table "public"."missions" to "service_role";

grant truncate on table "public"."missions" to "service_role";

grant update on table "public"."missions" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "users_select_public"
  on "public"."users"
  as permissive
  for select
  to authenticated
using (true);



  create policy "users_update_own"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



