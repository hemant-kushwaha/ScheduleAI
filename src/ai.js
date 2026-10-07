import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

import meetingSchema from "./meetingSchema.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const extractMeetingDetails = async (message, previousMeeting = null) => {
  const today = new Date().toLocaleDateString("en-CA");

  const systemInstruction = `
    Extract meeting information from the user's request.

    Today's date is ${today}.

    Rules:
    - Convert relative dates like today and tomorrow into YYYY-MM-DD.
    - Convert time into 24-hour HH:mm format.
    - If title is missing, create a simple title.
    - If duration is missing, use 30 minutes.
    - Do not invent attendee, date or time.
    - If information is unavailable, keep it blank.

    If previous meeting information is provided:
    - Use the new user message to update the previous meeting.
    - Keep previous information unless the user changes it.
    - The user's new message will be natural language.
  `;

  const input = `
    Previous meeting:
    ${JSON.stringify(previousMeeting)}

    New user request:
    ${message}
  `;

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",

    system_instruction: systemInstruction,

    input,

    response_format: {
      type: "text",
      mime_type: "application/json",

      schema: {
        type: "object",

        properties: {
          title: {
            type: "string",
          },

          attendee: {
            type: "string",
          },

          date: {
            type: "string",
          },

          time: {
            type: "string",
          },

          durationMinutes: {
            type: "integer",
          },
        },

        required: ["title", "attendee", "date", "time", "durationMinutes"],
      },
    },
  });

  //String to JS object:
  const data = JSON.parse(interaction.output_text);

  const meeting = meetingSchema.parse(data);

  return meeting;
};

const generateQuestion = async (missingFields) => {
  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",

    input: `
      Ask the user for the missing required meeting information.

      Missing information:
      ${missingFields.join(", ")}

      Rules:
      - Ask only for the missing information.
      - Ask naturally and concisely.
      - Do not ask for information that is already available.
      - Do not mention fields, JSON, schemas, or internal processing.
    `,
  });

  return interaction.output_text;
};

export { extractMeetingDetails, generateQuestion };
