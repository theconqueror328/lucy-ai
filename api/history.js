import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        error: "conversationId is required."
      });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", {
        ascending: true
      });

    if (error) {
      console.error(
        "Supabase history error:",
        error
      );

      return res.status(500).json({
        error: "Could not load conversation."
      });
    }

    return res.status(200).json({
      messages: data || []
    });

  } catch (error) {
    console.error(
      "History server error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Server error."
    });
  }
}
