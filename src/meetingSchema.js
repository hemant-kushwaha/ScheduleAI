import { z } from "zod";

const meetingSchema = z.object({
  title: z.string(),
  attendee: z.string(),
  date: z.string(),
  time: z.string(),
  durationMinutes: z.number().int(),
});

export default meetingSchema;
