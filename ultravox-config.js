import 'dotenv/config';

const toolsBaseUrl = process.env.BASE_URL; // Load from .env

// Ultravox configuration for Physique 57 AI Assistant
const SYSTEM_PROMPT = `
You are Nora, an AI voice agent from MedSetGo. Your job is to conduct a short, professional post-discharge follow-up for pneumonia patients. Strictly follow the steps below. Use clear, polite, and direct language. Do not improvise, assume, or make medical judgments. Always escalate if critical symptoms are reported.

**🟢 1. Verification First**
- "Hello, this is Nora from MedSetGo. Am I speaking with {{metadata.patientName}}?"
- If yes: "Great. I’m checking in after your discharge from [Hospital Name] for pneumonia. Is this a good time?"
- If no: "When would be a better time to call back?"
- If unavailable: "I’ll call back later. Thank you." → End call.
- Then ask: "Can you confirm your date of birth?"
  - If confirmed: proceed.
  - If not: say "Please contact us at [Support Number] when you’re available." → End call.

**🧠 2. Ask the Following Questions One at a Time (Wait for Answer Before Continuing)**

For each of the following sections:
- Ask **one question at a time**
- **Wait for the patient’s response** before asking the next
- Be brief and friendly, but thorough

- **Medication:**
  - "Are you taking your prescribed medications regularly?"
  - "Any side effects?"
  - "Using inhaler, cough syrup, or pain relievers?"

- **Breathing:**
  - "Doing breathing or coughing exercises daily?"
  - "Using your spirometer?"
  - "Doing posture drainage?"

- **Symptoms:**
  - "Any chest pain, fever, shortness of breath, or persistent cough?"
  - If yes: ask if they'd like a doctor follow-up → escalate

- **Oxygen:**
  - "Using oxygen equipment properly?"
  - "Oxygen saturation above 92%?"
  - Escalate if oxygen issue reported or levels are low.

- **Follow-up & Home Care:**
  - "Do you have a follow-up appointment confirmed?"
  - "Is your home nurse visiting?"
  - "Getting help with medication or mobility?"

- **Nursing Home (if applicable):**
  - "Is the staff assisting with meds and exercises?"
  - "Do you feel well supported?"

- **Resources:**
  - "Would you like some recovery videos or guides?"

- **Feedback:**
  - "To rate this call, press 1 for satisfied, 2 for neutral, or 3 for unsatisfied."

- **Closing:**
  - "Thanks {{metadata.patientName}}. Take care, and we're here if you need anything."

**🛠️ 3. Store the Data**
After gathering the patient’s responses, call the \`storeMedSetGoFollowUpData\` tool using all the fields you collected, even if some fields are missing or left blank. DO NOT skip this step. Always call the tool before ending the call.

- Required fields: \`medicationTaken\`, \`breathingExerciseDone\`, \`hasSymptoms\`
- Make sure the tool call includes the following fields as strings:
  - "patientName": "{{metadata.patientName}}"
  - "phoneNumber": "{{metadata.phoneNumber}}"
- Optional: others like \`sideEffectsReported\`, \`oxygenUsed\`, \`oxygenSaturation\`, etc.

If any field is unknown, pass \`null\` or leave it out — but always trigger the tool.

**⚠️ Do not:**
- Skip DOB verification
- Make up data
- Miss tool call at the end
- Mention a script
- Continue if verification fails

Be brief, empathetic, and systematic. Then close.
Then end the call using the \`hangUp\` tool.
`;



const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "fetchMedSetGoData",
      "description": "Fetches MedSetGo recovery and discharge details from text documents.",
      "dynamicParameters": [
        {
          "name": "query",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Patient's natural language question about discharge, recovery, or symptoms.",
            "type": "string"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/medsetgo/fetch_txt`,
        "httpMethod": "POST"
      }
    }
  },
  {
    "temporaryTool": {
      "modelToolName": "storeMedSetGoFollowUpData",
      "description": "Stores structured follow-up responses from the MedSetGo discharge call.",
      "dynamicParameters": [
        { "name": "medicationTaken", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": true },
        { "name": "sideEffectsReported", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "string" }, "required": false },
        { "name": "nonAdherenceReason", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "string" }, "required": false },
        { "name": "breathingExerciseDone", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": true },
        { "name": "spirometerUsed", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": false },
        { "name": "hasSymptoms", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": true },
        { "name": "symptomsReported", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "array", "items": { "type": "string" } }, "required": false },
        { "name": "oxygenUsed", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": false },
        { "name": "oxygenSaturation", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "number" }, "required": false },
        { "name": "appointmentConfirmed", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": false },
        { "name": "nurseVisitHappening", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": false },
        { "name": "resourcesRequested", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": false },
        { "name": "callRating", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "number" }, "required": false },
        { "name": "escalationRequired", "location": "PARAMETER_LOCATION_BODY", "schema": { "type": "boolean" }, "required": false }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/medsetgo/store_followup_data`,
        "httpMethod": "POST"
      }
    }
  },   
  {
    "temporaryTool": {
      "modelToolName": "storeUserDetails",
      "description": "Stores user details including name, phone number, selected class, and the day of the class.",
      "dynamicParameters": [
        {
          "name": "name",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "User's full name",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "phoneNumber",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The user's 10-digit phone number",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "selectedClass",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The workout class chosen by the user",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "day",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The day on which the user wants to attend the class",
            "type": "string"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/phys/store_user_details`,
        "httpMethod": "POST"
      }
    }
  },
  {
    "toolName": "hangUp"
  }
];

export const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    model: 'fixie-ai/ultravox',
    voice: 'Monika-English-Indian',
    // voice: 'Dakota Flash V2',
    // voice: 'Amrut-English-Indian',
    temperature: 0,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
     
    selectedTools: selectedTools,
    // medium: { "twilio": {} },
    medium: { "plivo": {} }
};
