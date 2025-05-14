import express from 'express';
const router = express.Router();

router.post('/store_followup_data', async (req, res) => {
  console.log("📥 Received follow-up data from Ultravox tool:");

  const toolPayload = req.body; // tool data (e.g., medicationTaken, symptoms, etc.)
  
  // Fallback values from metadata (set in ULTRAVOX_CALL_CONFIG)
  const patientName = req.headers['x-uv-metadata-patientname'] || "Unknown";
  const phoneNumber = req.headers['x-uv-metadata-phonenumber'] || "Unknown";

  const finalRecord = {
    patientName,
    phoneNumber,
    ...toolPayload,
    receivedAt: new Date().toISOString()
  };

  console.log("🗃 Final stored record:", finalRecord);

  // TODO: Save finalRecord to DB or forward to Make.com

  return res.status(200).json({ message: "Data stored", record: finalRecord });
});

export { router };
