import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(
        "Supabase conversations error:",
        error
      );

      return res.status(500).json({
        error: "Could not load conversations."
      });
    }

    return res.status(200).json({
      conversations: data || []
    });

  } catch (error) {
    console.error(
      "Conversations server error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Server error."
    });
  }
}
