import { supabase } from "../lib/supabase";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {

    const {
      messages,
      conversationId
    } = req.body || {};


    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {

      return res.status(400).json({
        error:
          "Please provide conversation messages."
      });

    }


    if (!process.env.OPENAI_API_KEY) {

      return res.status(500).json({
        error:
          "OPENAI_API_KEY is not configured in Vercel."
      });

    }



    /*
     * Create a new conversation.
     */

    let activeConversationId =
      conversationId;


    if (!activeConversationId) {

      const firstUserMessage =
        messages.find(
          message =>
            message.role === "user"
        );


      const firstMessage =
        firstUserMessage?.content?.trim() ||
        "New conversation";


      /*
       * Ask the AI for a short title.
       */

      let title =
        "New conversation";


      try {

        const titleResponse =
          await fetch(
            "https://api.openai.com/v1/responses",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${process.env.OPENAI_API_KEY}`

              },

              body:
                JSON.stringify({

                  model:
                    "gpt-5.6-luna",

                  instructions:
                    "Create a short, clear title for a chat conversation. " +
                    "Return ONLY the title. " +
                    "Use 2 to 6 words. " +
                    "Do not use quotation marks. " +
                    "Do not add punctuation at the end. " +
                    "Capture the main topic of the user's message.",

                  input:
                    firstMessage

                })

            }
          );


        const titleData =
          await titleResponse.json();


        if (titleResponse.ok) {

          const generatedTitle =
            (titleData.output || [])
              .flatMap(
                item =>
                  item.content || []
              )
              .filter(
                item =>
                  item.type ===
                  "output_text"
              )
              .map(
                item =>
                  item.text || ""
              )
              .join("")
              .trim();


          if (generatedTitle) {

            title =
              generatedTitle
                .replace(
                  /^["']|["']$/g,
                  ""
                )
                .replace(
                  /[.!?]+$/g,
                  ""
                )
                .trim()
                .slice(0, 60);

          }

        }

      } catch (titleError) {

        console.error(
          "Title generation error:",
          titleError
        );

      }



      /*
       * Save the conversation.
       */

      const {
        data: conversation,
        error
      } =
        await supabase
          .from("conversations")
          .insert({
            title
          })
          .select("id")
          .single();


      if (error) {

        console.error(
          "Supabase conversation error:",
          error
        );


        return res.status(500).json({
          error:
            "Could not create conversation."
        });

      }


      activeConversationId =
        conversation.id;

    }



    /*
     * Find the latest user message.
     */

    const latestUserMessage =
      [...messages]
        .reverse()
        .find(
          message =>
            message.role === "user"
        );



    /*
     * Save the user's message.
     */

    if (latestUserMessage) {

      const {
        error
      } =
        await supabase
          .from("messages")
          .insert({

            conversation_id:
              activeConversationId,

            role:
              "user",

            content:
              latestUserMessage.content

          });


      if (error) {

        console.error(
          "Supabase user message error:",
          error
        );


        return res.status(500).json({
          error:
            "Could not save your message."
        });

      }

    }



    /*
     * Send the conversation to LUCY.
     */

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${process.env.OPENAI_API_KEY}`

          },


          body:
            JSON.stringify({

              model:
                "gpt-5.6-luna",

              instructions:
                "You are LUCY, a personal AI assistant. " +
                "Your name is LUCY. When asked who you are, say you are LUCY. " +
                "Never identify yourself as ChatGPT. " +
                "You are friendly, intelligent, helpful, calm and conversational. " +
                "Speak naturally and clearly. " +
                "Remember and use the conversation context provided to you. " +
                "Be honest when uncertain and never invent facts. " +
                "Do not pretend to be human. " +
                "Give safe and age-appropriate answers.",

              input:
                messages

            })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "OpenAI error:",
        data
      );


      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "OpenAI returned an error."

      });

    }



    /*
     * Extract LUCY's response.
     */

    const reply =
      (data.output || [])
        .flatMap(
          item =>
            item.content || []
        )
        .filter(
          item =>
            item.type ===
            "output_text"
        )
        .map(
          item =>
            item.text || ""
        )
        .join("");


    if (!reply) {

      return res.status(500).json({
        error:
          "LUCY received no text from the AI."
      });

    }



    /*
     * Save LUCY's response.
     */

    const {
      error: assistantError
    } =
      await supabase
        .from("messages")
        .insert({

          conversation_id:
            activeConversationId,

          role:
            "assistant",

          content:
            reply

        });


    if (assistantError) {

      console.error(
        "Supabase assistant message error:",
        assistantError
      );


      return res.status(500).json({
        error:
          "LUCY replied, but the response could not be saved."
      });

    }



    return res.status(200).json({

      reply,

      conversationId:
        activeConversationId

    });


  } catch (error) {

    console.error(
      "Server error:",
      error
    );


    return res.status(500).json({

      error:
        error.message ||
        "Server error."

    });

  }

}
