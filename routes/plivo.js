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
router.post("/incoming", async (req, res) => {
  try {
    console.log("Incoming call received");
    const plivoCallUuid = req.body.CallUUID;
    const callerNumber = req.body.From;
    console.log("Plivo CallUUID:", plivoCallUuid);
    console.log("Caller Phone Number:", callerNumber);

    // Create the Ultravox call with medium: { "plivo": {} } and firstSpeaker set to "FIRST_SPEAKER_AGENT"
    const response = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);
    // const response = await createUltravoxCall(customConfig);

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

    // 🔁 reuse metadata saved during trigger-outbound
    const metadata = {
      patientName: req.query.patientName || "Patient",
      phoneNumber: destinationNumber,
      hospitalName: "MedSetGo"
    };

    // 🧠 Clone prompt and replace {{metadata.patientName}} manually
    const resolvedPrompt = ULTRAVOX_CALL_CONFIG.systemPrompt.replace(
      "{{metadata.patientName}}",
      metadata.patientName
    );

    const customConfig = {
      ...ULTRAVOX_CALL_CONFIG,
      systemPrompt: resolvedPrompt,
      metadata,
      initialState: {
        metadata: { ...metadata }
      }
    };

    console.log("🧠 Outgoing Ultravox config:", JSON.stringify(customConfig, null, 2));

    const response = await createUltravoxCall(customConfig);

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
  const { toNumber, patientName = "Patient" } = req.body;

  if (!toNumber) {
    return res.status(400).json({ error: "Missing 'toNumber'" });
  }

  console.log(`📞 Attempting to call ${toNumber} from ${process.env.PLIVO_FROM_NUMBER}`);
  console.log(`🔗 Using BASE_URL: ${process.env.BASE_URL}`);

  try {
    const customConfig = {
      ...ULTRAVOX_CALL_CONFIG,
      metadata: {
        patientName: String(patientName || "Unknown"),
        phoneNumber: String(toNumber || "Unknown"),
        hospitalName: "MedSetGo"
      }
    };

    console.log("🧪 customConfig being sent:", JSON.stringify(customConfig, null, 2));

    const response = await plivoClient.calls.create(
      process.env.PLIVO_FROM_NUMBER,
      toNumber,
      `${process.env.BASE_URL}/plivo/outgoing?patientName=${encodeURIComponent(patientName)}`, // 👈 add metadata here
      {
        answerMethod: "POST",
        hangupUrl: `${process.env.BASE_URL}/plivo/hangup`,
        hangupMethod: "POST"
      }
    );
    

    console.log("✅ Outbound call successfully queued:", response);


    res.json({ message: "Call triggered", response });
  } catch (err) {
    console.error("❌ Failed to trigger outbound call:", err?.message || err);
    res.status(500).json({
      error: "Failed to trigger outbound call",
      detail: err?.message || String(err)
    });
  }
});



export { router };