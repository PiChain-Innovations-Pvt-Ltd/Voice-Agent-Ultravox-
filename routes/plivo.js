import express from "express";
import "dotenv/config";
import { createUltravoxCall } from "../ultravox-utils.js";
import { ULTRAVOX_CALL_CONFIG } from "../ultravox-config.js";

const router = express.Router();

// Dictionary to store Plivo CallUUID and Ultravox Call ID mapping
const activeCalls = new Map();

// Handle incoming calls from Plivo
router.post("/incoming", async (req, res) => {
  try {
    console.log("Incoming call received");
    const plivoCallUuid = req.body.CallUUID;
    const callerNumber = req.body.From;
    console.log("Plivo CallUUID:", plivoCallUuid);
    console.log("Caller Phone Number:", callerNumber);

    // Create the Ultravox call with medium: { "plivo": {} } and firstSpeaker set to "FIRST_SPEAKER_AGENT"
    const response = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);
    console.log("Ultravox response:", response);

    activeCalls.set(response.callId, {
      plivoCallUuid: plivoCallUuid,
      callerNumber: callerNumber,
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Stream keepCallAlive="true" contentType="audio/x-l16;rate=16000" bidirectional="true">
        ${response.joinUrl}
    </Stream>
</Response>`;
    res.type("text/xml");
    res.send(xml);
  } catch (error) {
    console.error("Error handling incoming call:", error);
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak>Sorry, there was an error connecting your call.</Speak>
</Response>`;
    res.type("text/xml");
    res.send(errorXml);
  }
});

export { router };