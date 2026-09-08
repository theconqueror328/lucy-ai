import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not configured.");
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not configured."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);
