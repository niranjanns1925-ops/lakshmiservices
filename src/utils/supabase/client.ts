import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vsjtmfmvmbmccrezyyvp.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_rfev85B4uJu7Sd7NpPPCbQ_5i122-lF";

export const supabase = createClient(supabaseUrl, supabaseKey);
