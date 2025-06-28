import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dfmcinbfspgfufjprbii.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmbWNpbmJmc3BnZnVmanByYmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNDY5MjEsImV4cCI6MjA2NjYyMjkyMX0.P8JEwIq1Kz_l_yEEtVjIAKmQIqkSbFKphF-gp2s14Nk";

export const supabase = createClient(supabaseUrl, supabaseKey);
