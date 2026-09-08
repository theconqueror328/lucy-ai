import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { conversationId, title } = req.body || {};

    if (!conversationId) {
      return res.status(400).json({
        error: "conversationId is required."
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "A conversation title is required."
      });
    }

    const cleanTitle =
      title.trim().slice(0, 100);

    const { data, error } =
      await supabase
        .from("conversations")
        .update({
          title: cleanTitle
        })
        .eq("id", conversationId)
        .select("id, title, created_at")
        .single();

    if (error) {
      console.error(
        "Supabase rename error:",
        error
      );

      return res.status(500).json({
        error: "Could not rename conversation."
      });
    }

    return res.status(200).json({
      conversation: data
    });

  } catch (error) {
    console.error(
      "Rename server error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Server error."
    });
  }
}
