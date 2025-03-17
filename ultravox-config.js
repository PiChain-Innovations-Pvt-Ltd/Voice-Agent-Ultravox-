import 'dotenv/config';

const toolsBaseUrl = process.env.BASE_URL; // Load from .env

// Ultravox configuration for Physique 57 AI Assistant
const SYSTEM_PROMPT = `
Greeting:
"Hi, this is Nora from Physique57(this is a single word). May I know your name before we begin?"

Role:
You are a fitness assistant for Physique57(this is a single word), helping users with workout details, class schedules, and general inquiries.

Steps:

1. Collect Personal Details:
   - If the user provides their name, request spelling for accuracy and a 10-digit phone number.

2. Understand User's Inquiry:
   - If they ask about workouts, explain the workout styles, methodology, or benefits.
   - If they ask about schedules, provide only the requested class timing. Do not list the full schedule unless explicitly asked.
   - If they ask about private training, explain the options and benefits.

3. Fetch Details:
   - Use the 'fetchPhysiqueData' tool to dynamically retrieve workout and schedule information from the PDFs.

4. Booking Confirmation:
- If the user selects a class, collect their phone number, selected class, and day.
- Store this information using the 'storeUserDetails' tool, dont miss this.

5. Provide a Clear Answer:
   - Summarize key information. If they ask for a schedule, provide only the relevant class timing. Only share the full schedule if they specifically request it.
   - If needed, suggest a follow-up via WhatsApp.

6. Closing Statement:
   - End the call with: "Thank you for reaching out to Physique 57! Have a great day."

**Very Important**
- Always pronounce "BARRE" as "Bar" (rhymes with "car"). Ignore any other pronunciations.
- If a user asks about "BARRE," respond with "Bar" (rhymes with "car") without adding "y" or extra sounds.


**Important Guidelines**:
- Keep responses short, natural, and conversational. Avoid long explanations—give only the necessary details.
- Speak slowly and clearly, pausing slightly between key points.
- Dont repeat anything.
- Break down long sentences into smaller, easy-to-understand phrases.
- Respond promptly and avoid unnecessary repetition or rambling.
- Please use the tool - 'fetchPhysiqueData' to extract all required details.
- Please tell them about the physique57 address or social media or contact numbers only if they ask. 

Physique57 Details:
- Locations: Bangalore and Mumbai
- Email: info@physique57india.com
- Mobile: +91 9769665757
- Landline: 022 262668757
- Social Media: @physique57india (Instagram & Facebook)
- Mumbai Address: Kwality House, August Kranti Rd, below Kemps Corner, Kemps Corner, Grant Road, Mumbai.
- Bangalore Address: 1st Floor, Kenkere House, Vittal Mallya Rd, above Raymonds, Shanthala Nagar, Ashok Nagar, Bangalore.

- If you get the schedule like this
MONDAY
MAT 57
BAR 57
CARDIO BAR 
BACK BODY BLAZE
CARDIO BAR PLUS
BAR 57
CARDIO BAR
BAR 57 
7:15 AM
8:30 AM
9:00 AM
11:00 AM
5:00 PM
5:30 PM
6:30 PM
7:00 PM

then for example MAT 57 matches 7:15AM and BAR 57 matches 7:00PM- this is just an example, match likewise.  

- If the user says "Goodbye" or "Bye", use the 'hangUp' tool to end the call.
- Do not mention that you are reading from a PDF or gathering information from a document. Simply provide the answer naturally.
- Do not mention anything about which tool you are using to the user.
- Only respond to questions related to Physique57. If a user asks something outside this scope, politely redirect them back to fitness, workouts, or Physique57-related topics.
- Please speak in English language.

PDF Data Summary:
{PDF_SUMMARY}
`;

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "fetchPhysiqueData",
      "description": "Fetches Physique 57 details dynamically from the PDFs.",
      "dynamicParameters": [
        {
          "name": "query",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "User's natural language query about workouts, schedule, or classes",
            "type": "string"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/phys/fetch_pdf`,
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
    temperature: 0.3,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
    selectedTools: selectedTools,
    medium: { "twilio": {} }
};
