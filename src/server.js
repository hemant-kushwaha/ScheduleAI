import "dotenv/config";
import express from "express";
import cors from "cors";

import { extractMeetingDetails, generateQuestion } from "./ai.js";

const app = express();

app.use(cors());
app.use(express.json());

let pendingMeeting = null;

const requiredFields = ["date", "time"];

const getMissingFields = (meeting) => {
  return requiredFields.filter((field) => !meeting[field]);
};

app.post("/api/schedule", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const meeting = await extractMeetingDetails(message, pendingMeeting);

    const missingFields = getMissingFields(meeting);

    if (missingFields.length > 0) {
      pendingMeeting = meeting;

      const question = await generateQuestion(missingFields);

      return res.json({
        status: "needs_information",
        message: question,
      });
    }

    pendingMeeting = null;

    return res.json({
      status: "complete",
      meeting,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.listen(8080, () => {
  console.log("Server running on port 8080");
});
