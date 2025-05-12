import express from "express";
import "dotenv/config";
import plivo from 'plivo';
import { createUltravoxCall } from "../ultravox-utils.js";
import { ULTRAVOX_CALL_CONFIG } from "../ultravox-config.js";

const plivoClient = new plivo.Client(process.env.PLIVO_AUTH_ID, process.env.PLIVO_AUTH_TOKEN);

const router = express.Router();

// Dictionary to store Plivo CallUUID and Ultravox Call ID mapping
const activeCalls = new Map();

// Handle incoming calls from Plivo
router.post("/mahe_incoming", async (req, res) => {
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

// Handle outgoing calls from Plivo
router.post("/outgoing", async (req, res) => {
  try {
    console.log("Outgoing call initiated");
    const plivoCallUuid = req.body.CallUUID;
    const destinationNumber = req.body.To;

    const response = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);
    console.log("Ultravox response:", response);

    activeCalls.set(response.callId, {
      plivoCallUuid,
      callerNumber: destinationNumber,
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Stream keepCallAlive="true" contentType="audio/x-l16;rate=16000" bidirectional="true">
    ${response.joinUrl}
  </Stream>
  <Hangup url="${process.env.BASE_URL}/plivo/hangup" method="POST"/>
</Response>`;
    res.type("text/xml").send(xml);
  } catch (error) {
    console.error("Error handling outgoing call:", error);
    res.type("text/xml").send(`
      <Response><Speak>Sorry, there was an error connecting your outbound call.</Speak></Response>
    `);
  }
});

// ===== HANGUP EVENT CALLBACK =====
router.post("/hangup", (req, res) => {
  const callUUID = req.body.CallUUID;
  console.log("Hangup received for CallUUID:", callUUID);

  for (const [ultravoxId, data] of activeCalls.entries()) {
    if (data.plivoCallUuid === callUUID) {
      console.log(`Cleaning up Ultravox Call ID: ${ultravoxId}`);
      activeCalls.delete(ultravoxId);
      break;
    }
  }

  res.sendStatus(200);
});

// ===== PROGRAMMATICALLY TRIGGER OUTBOUND CALL =====
router.post("/trigger-outbound", async (req, res) => {
  const { toNumber } = req.body;

  if (!toNumber) {
    return res.status(400).json({ error: "Missing 'toNumber'" });
  }

  try {
    const response = await plivoClient.calls.create(
      process.env.PLIVO_FROM_NUMBER,     // From
      toNumber,                          // To
      `${process.env.BASE_URL}/plivo/outgoing`, // Answer URL
      {
        answerMethod: "POST",
        hangupUrl: `${process.env.BASE_URL}/plivo/hangup`,
        hangupMethod: "POST",
      }
    );

    console.log("Outbound call triggered:", response);
    res.json({ message: "Call triggered", response });
  } catch (err) {
    console.error("Failed to trigger outbound call:", err);
    res.status(500).json({ error: "Failed to trigger outbound call" });
  }
});

export { router };
