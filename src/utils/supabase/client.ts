import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vsjtmfmvmbmccrezyyvp.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzanRtZm12bWJtY2NyZXp5eXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTAyNjUsImV4cCI6MjA5NDQ4NjI2NX0.ZREFjCTVpmQ8r_2y2qL6A6AF6olt1GmJrH9iJd4l7tE";

export const supabase = createClient(supabaseUrl, supabaseKey);
