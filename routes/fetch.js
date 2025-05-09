import express from "express";
import axios from "axios";
import qs from "querystring";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const router = express.Router();

// Destructure exactly the values you specified in your .env
const {
  SF_OAUTH_URL,
  SF_CLIENT_ID,
  SF_CLIENT_SECRET,
  SF_USERNAME,
  SF_PASSWORD,
} = process.env;

// Sanity check at startup
if (
  !SF_OAUTH_URL ||
  !SF_CLIENT_ID ||
  !SF_CLIENT_SECRET ||
  !SF_USERNAME ||
  !SF_PASSWORD
) {
  console.error("❌ Missing one or more required SF_… env variables");
  process.exit(1);
}

// Helper to fetch OAuth token
async function getSalesforceToken() {
  const resp = await axios.post(
    SF_OAUTH_URL,
    qs.stringify({
      grant_type: "password",
      client_id: SF_CLIENT_ID,
      client_secret: SF_CLIENT_SECRET,
      username: SF_USERNAME,
      password: SF_PASSWORD,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  return {
    accessToken: resp.data.access_token,
    instanceUrl: resp.data.instance_url,
  };
}

// Fetch the single most-recent Lead by phone number
router.post("/fetch_leads", async (req, res) => {
  console.log("📥 Incoming Salesforce Lead Fetch Request!");
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Missing 'phone' in request body" });
  }

  try {
    const { accessToken, instanceUrl } = await getSalesforceToken();
    console.log("🔑 Received SF access token");

    const soql = `SELECT Id, Name, Phone, Email, Program__c, X10th_Percentage__c, X12th_Percentage__c
                  FROM Lead
                  WHERE Phone = '${phone.replace(/'/g, "\\'")}'
                  ORDER BY CreatedDate DESC
                  LIMIT 1`;
    const url = `${instanceUrl}/services/data/v62.0/query?q=${encodeURIComponent(soql)}`;
    const qRes = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const records = qRes.data.records || [];
    if (records.length === 0) {
      return res.json({
        lead: {
          name: null,
          phoneNumber: null,
          email: null,
          program: null,
          "10thPercentage": null,
          "12thPercentage": null,
        },
      });
    }

    const r = records[0];
    res.json({
      lead: {
        name: r.Name,
        phoneNumber: r.Phone,
        email: r.Email,
        program: r.Program__c,
        "10thPercentage": r.X10th_Percentage__c,
        "12thPercentage": r.X12th_Percentage__c,
      },
    });
  } catch (err) {
    console.error("❌ Salesforce Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Salesforce fetch failed",
      details: err.response?.data || err.message,
    });
  }
});

// Fetch the JSON_Script__c field by phone number
router.post("/fetch_transcript", async (req, res) => {
  console.log("📥 Incoming Salesforce JSON Script Fetch Request!");
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Missing 'phone' in request body" });
  }

  try {
    const { accessToken, instanceUrl } = await getSalesforceToken();
    console.log("🔑 Received SF access token");

    const soql = `SELECT Id, JSON_Script__c
                  FROM Lead
                  WHERE Phone = '${phone.replace(/'/g, "\\'")}'
                  ORDER BY CreatedDate DESC
                  LIMIT 1`;
    const url = `${instanceUrl}/services/data/v62.0/query?q=${encodeURIComponent(soql)}`;
    const qRes = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const records = qRes.data.records || [];
    if (records.length === 0) {
      return res.json({
        transcript: null,
      });
    }

    const r = records[0];
    return res.json({
      transcript: r.JSON_Script__c,
    });
  } catch (err) {
    console.error("❌ Salesforce Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Salesforce fetch failed",
      details: err.response?.data || err.message,
    });
  }
});

// Update the JSON_Script__c field for a Lead by phone number
router.put("/update_transcript", async (req, res) => {
  console.log("📥 Incoming Salesforce JSON Script Update Request!");
  const { phoneNumber, transcript } = req.body;

  if (!phoneNumber || !jsonScript) {
    return res
      .status(400)
      .json({ error: "Missing 'phoneNumber' or 'transcript' in request body" });
  }

  try {
    const { accessToken, instanceUrl } = await getSalesforceToken();
    console.log("🔑 Received SF access token for update");

    // 1️⃣ Find the most recent Lead by phoneNumber
    const soql = `SELECT Id, Phone, JSON_Script__c
                  FROM Lead
                  WHERE Phone = '${phoneNumber.replace(/'/g, "\\'")}'
                  ORDER BY CreatedDate DESC
                  LIMIT 1`;
    const queryUrl = `${instanceUrl}/services/data/v62.0/query?q=${encodeURIComponent(soql)}`;
    const queryRes = await axios.get(queryUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const recs = queryRes.data.records || [];
    // 2️⃣ If no existing Lead → return error
    if (recs.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // 3️⃣ Otherwise, update the JSON_Script__c field
    const existing = recs[0];
    const leadId = existing.Id;
    const updatePayload = {
      JSON_Script__c: transcript,
    };

    // 4️⃣ PATCH the Lead record with the new JSON_Script__c value
    const patchUrl = `${instanceUrl}/services/data/v62.0/sobjects/Lead/${leadId}`;
    await axios.patch(patchUrl, updatePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Salesforce Lead JSON Script updated successfully");
    return res.json({
      lead: {
        phoneNumber: existing.Phone,
        transcript: updatePayload.JSON_Script__c,
      },
    });
  } catch (err) {
    console.error(
      "❌ Salesforce Update Error:",
      err.response?.data || err.message,
    );
    res.status(500).json({
      error: "Salesforce update failed",
      details: err.response?.data || err.message,
    });
  }
});

// Update a Lead’s fields in Salesforce (lookup by phoneNumber; create if none exists)
router.put("/update_lead", async (req, res) => {
  console.log("📥 Incoming Salesforce Lead Update Request!");
  const {
    name,
    phoneNumber,
    email,
    program,
    "10thPercentage": tenthPct,
    "12thPercentage": twelfthPct,
  } = req.body;

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ error: "Missing 'phoneNumber' in request body" });
  }

  try {
    const { accessToken, instanceUrl } = await getSalesforceToken();
    console.log("🔑 Received SF access token for update");

    // 1️⃣ Find the most recent Lead by phoneNumber
    const soql = `SELECT Id, Name, Phone, Email, Program__c, X10th_Percentage__c, X12th_Percentage__c
                  FROM Lead
                  WHERE Phone = '${phoneNumber.replace(/'/g, "\\'")}'
                  ORDER BY CreatedDate DESC
                  LIMIT 1`;
    const queryUrl = `${instanceUrl}/services/data/v62.0/query?q=${encodeURIComponent(soql)}`;
    const queryRes = await axios.get(queryUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const recs = queryRes.data.records || [];
    // 2️⃣ If no existing Lead → create one
    if (recs.length === 0) {
      const createPayload = {
        Phone: phoneNumber,
        Email: email,
        Company: "Ken42",
        ...(name !== undefined && { LastName: name }),
        ...(program !== undefined && { Program__c: program }),
        ...(tenthPct !== undefined && { X10th_Percentage__c: tenthPct }),
        ...(twelfthPct !== undefined && { X12th_Percentage__c: twelfthPct }),
      };
      const createUrl = `${instanceUrl}/services/data/v62.0/sobjects/Lead`;
      const createRes = await axios.post(createUrl, createPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✨ Created Salesforce Lead:", createRes.data.id);
      return res.json({
        lead: {
          name: createPayload.Name ?? null,
          email: email,
          phoneNumber: phoneNumber,
          program: createPayload.Program__c ?? null,
          "10thPercentage": createPayload.X10th_Percentage__c ?? null,
          "12thPercentage": createPayload.X12th_Percentage__c ?? null,
        },
      });
    }

    // 3️⃣ Otherwise build the patch payload
    const existing = recs[0];
    const leadId = existing.Id;
    const updatePayload = {
      Company: "Ken42",
      Email: email,
      ...(name !== undefined && { LastName: name }),
      ...(program !== undefined && { Program__c: program }),
      ...(tenthPct !== undefined && { X10th_Percentage__c: tenthPct }),
      ...(twelfthPct !== undefined && { X12th_Percentage__c: twelfthPct }),
    };

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    // 4️⃣ PATCH the Lead record
    const patchUrl = `${instanceUrl}/services/data/v62.0/sobjects/Lead/${leadId}`;
    await axios.patch(patchUrl, updatePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Salesforce Lead updated successfully");
    return res.json({
      lead: {
        name: updatePayload.Name ?? existing.Name,
        phoneNumber: existing.Phone,
        email: updatePayload.Email,
        program: updatePayload.Program__c ?? existing.Program__c,
        "10thPercentage":
          updatePayload.X10th_Percentage__c ?? existing.X10th_Percentage__c,
        "12thPercentage":
          updatePayload.X12th_Percentage__c ?? existing.X12th_Percentage__c,
      },
    });
  } catch (err) {
    console.error(
      "❌ Salesforce Update Error:",
      err.response?.data || err.message,
    );
    res.status(501).json({
      error: "Salesforce update failed",
      details: err.response?.data || err.message,
    });
  }
});

export async function updateTranscript(transcript) {
  if (!transcript) {
    throw new Error("Transcript is required");
  }

  // 1️⃣ Authenticate
  const { accessToken, instanceUrl } = await getSalesforceToken();

  // Get Phone Number From Transcript
  let phoneNumber = null;

  for (const message of transcript) {
    if (
      message.role === "MESSAGE_ROLE_TOOL_CALL" &&
      message.text &&
      /\{"phone":\s*"\d+"\}/.test(message.text)
    ) {
      const match = message.text.match(/\{"phone":\s*"(\d+)"\}/);
      if (match) {
        phoneNumber = match[1];
        console.log("Extracted phone:", phoneNumber);
      }
    }
  }

  // 2️⃣ Query for the most recent Lead with that phone number
  const soql = `SELECT Id, Phone
                FROM Lead
                WHERE Phone = '${phoneNumber.replace(/'/g, "\\'")}'
                ORDER BY CreatedDate DESC
                LIMIT 1`;
  const queryUrl = `${instanceUrl}/services/data/v62.0/query?q=${encodeURIComponent(soql)}`;
  const queryRes = await axios.get(queryUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const records = queryRes.data.records || [];
  if (records.length === 0) {
    throw new Error(`Lead with phone ${phoneNumber} not found`);
  }

  const leadId = records[0].Id;

  // 3️⃣ PATCH the JSON_Script__c field
  const patchUrl = `${instanceUrl}/services/data/v62.0/sobjects/Lead/${leadId}`;
  await axios.patch(
    patchUrl,
    { JSON_Script__c: JSON.stringify(transcript) },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("Transcript Updated in Salesforce");
  return "Transcript Updated Successfully";
}

export { router };
