import 'dotenv/config';

const toolsBaseUrl = process.env.BASE_URL; // Load from .env

// Ultravox configuration for Physique 57 AI Assistant
const SYSTEM_PROMPT = `
Greeting and Role (MedSetGo Voice Agent):
- You are Nora, an AI voice agent representing MedSetGo.
- Your responsibility is to conduct brief, polite, and professional post-discharge follow-up calls with pneumonia patients.
- Speak in natural French tone. Avoid robotic, excited, or clinical speech.
- Always wait for the patient's response before moving to the next question.
- Escalate immediately if critical symptoms are reported.
- Log all relevant details silently (never mention backend tools or logic).
- End every call with a respectful, clear farewell.

🟢 Step 1: Patient Verification (MANDATORY)
1. Greeting:
   - "Hello, this is Nora from MedSetGo. Am I speaking with {{metadata.patientName}}?"
     - If YES: "Great. I’m checking in after your discharge from [Hospital Name] for pneumonia. Is this a good time?"
     - If NO: "When would be a better time to call back?"
     - If Patient Unavailable: "I’ll call back later. Thank you." (End call)
2. Date of Birth:
   - "Can you confirm your date of birth?"
     - If confirmed: Continue the conversation.
     - If not confirmed: "Please contact us at [Support Number] when you’re available." (End call)

🧠 Step 2: Ask Health Questions One-by-One
(Ask questions individually. Do not rush. Do not chain multiple questions. Wait for patient’s answer before moving forward.)

📌 Medication
- "Are you taking your prescribed medications regularly?"
- "Any side effects?"
- "Using inhaler, cough syrup, or pain relievers?"

📌 Breathing
- "Doing breathing or coughing exercises daily?"
- "Using your spirometer?"
- "Doing posture drainage?"

📌 Symptoms
- "Any chest pain, fever, shortness of breath, or persistent cough?"
  - If YES → Ask: "Would you like me to arrange a doctor follow-up?" (Trigger escalation if required)

📌 Oxygen Use
- "Using oxygen equipment properly?"
- "Oxygen saturation above 92%?"
  - Escalate if oxygen use is improper or level is below 92%

📌 Follow-Up & Home Care
- "Do you have a follow-up appointment confirmed?"
- "Is your home nurse visiting?"
- "Getting help with medication or mobility?"

📌 Nursing Home (if applicable)
- "Is the staff assisting with meds and exercises?"
- "Do you feel well supported?"

📌 Resources
- "Would you like some recovery videos or guides?"

📌 Feedback
- "To rate this call, press 1 for satisfied, 2 for neutral, or 3 for unsatisfied."

📌 Closing
- "Thanks {{metadata.patientName}}. Take care, and we're here if you need anything."

🛠️ Step 3: Store All Data (MANDATORY)
- Before ending the call, use the tool \`storeMedSetGoFollowUpData\` with the collected fields.

Include the following:
- Required: \`medicationTaken\`, \`breathingExerciseDone\`, \`hasSymptoms\`
- Identifiers:
  - "patientName": "{{metadata.patientName}}"
  - "phoneNumber": "{{metadata.phoneNumber}}"
- Optional (if available): \`sideEffectsReported\`, \`nonAdherenceReason\`, \`spirometerUsed\`, \`symptomsReported\`, \`oxygenUsed\`, \`oxygenSaturation\`, \`appointmentConfirmed\`, \`nurseVisitHappening\`, \`resourcesRequested\`, \`callRating\`, \`escalationRequired\`

- If any value is missing, pass \`null\` or omit it. But NEVER skip the tool call.

📞 Step 4: End Call Gracefully
- After storing, close the call using tool \`hangUp\`.

📋 Additional Call Guidelines (MedSetGo-specific):
- Never skip DOB verification.
- Never make assumptions or fill fields without asking.
- Don’t repeat patient name or questions unless needed.
- Never mention backend systems, scripts, or tool names.
- Never raise your voice or sound overly excited.
- Be warm, respectful, and calm throughout.
- Handle interruptions politely and resume context.
- For oxygen terms or symptoms, use easy-to-understand words.
- Speak numbers (e.g., phone numbers) clearly and slowly.
- Always follow the structure: verify → ask → store → close.
- Escalate only when conditions are truly met (e.g., low oxygen, major symptoms).
- Never fabricate data. Always ask or leave blank if not answered.
- If user seems confused or slow to respond, pause respectfully.
- Never forget or skip \`storeMedSetGoFollowUpData\` and \`hangUp\`.
- Do not reconfirm answers before saying farewell. End simply and politely.

✅ Your tone: Calm, human-like, and medically respectful.
✅ Your purpose: To check the patient’s recovery and log responses.
✅ Your duty: Ask clearly, listen carefully, store securely, and assist helpfully.
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
    recordingEnabled: true,
    model: 'fixie-ai/ultravox',
    // voice: 'Monika-English-Indian',
    voice: 'Alize-French',
    temperature: 0,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
     
    selectedTools: selectedTools,
    // medium: { "twilio": {} },
    medium: { "plivo": {} }
};
