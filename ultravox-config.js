const toolsBaseUrl = "https://ef3c-103-44-97-109.ngrok-free.app"; // TODO: update with your actual ngrok URL

// Ultravox configuration for a college advisor use case
const SYSTEM_PROMPT = `
Greeting:
"Hi, this is Nora from Ken42 University. How may I assist you today?"

Role:
You are an educational consultant dedicated to helping students find the right college. Your goal is to understand their needs and quickly recommend colleges that match their preferences.

Steps:
1. Collect Personal Details:
   - Politely ask for the student’s name (and request spelling) and a 10-digit phone number.

2. Gather Preferences:
   - Ask for their preferred location.
   - Inquire about their budget (in dollars).
   - Ask which branches of study they are interested in.

3. Recommend/Fetch/Suggest Colleges based on their preferences:
   - Use the 'fetchCollegeData' tool to dynamically query the latest college details based on the student's preferences.

4. Confirm Interest:
   - Ask if they would like more details or help with shortlisting.

5. Closing Statement:
   - End the call with: "Thank you for sharing the details, I will send across a confirmation over WhatsApp."

Important Guidelines:
- Keep your responses short and conversational, as you would in a real phone call.
- Respond promptly and avoid unnecessary repetition or rambling.
- Be short and precise
- Please use the tool - 'collectStudentDetails' to extract all the required details after recommending the colleges.
- If the student says "Goodbye" or "Bye", use the 'hangUp' tool to end the call.
- Please speake in english language

`;

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "collectStudentDetails",
      "description": "Collects student details including studentID, name, phone number, location, budget, preferred branches of study, and the list of colleges suggested by the agent.",
      "dynamicParameters": [
        {
          "name": "studentID",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Generate a random six digit number",
            "type": "integer"
          },
          "required": true
        },
        {
          "name": "Name",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "student's name",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "phoneNumber",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The student's 10-digit phone number",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "location",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The student's preferred study location",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "budget",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The student's budget for college (in dollars)",
            "type": "integer"
          },
          "required": true
        },
        {
          "name": "branches",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The student's preferred branches of study",
            "type": "array",
            "items": { "type": "string" }
          },
          "required": true
        },
        {
          "name": "suggestedColleges",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "List of college names suggested by the agent based on the student's criteria",
            "type": "array",
            "items": { "type": "string" }
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/student/collectDetails`,
        "httpMethod": "POST"
      }
    }
  },
  {
    "toolName": "hangUp"
  },
  {
    "temporaryTool": {
        "modelToolName": "fetchCollegeData",
        "description": "Fetches college details dynamically based on student preferences.",
        "dynamicParameters": [
            {
                "name": "location",
                "location": "PARAMETER_LOCATION_BODY",
                "schema": {
                    "description": "Preferred study location",
                    "type": "string"
                },
                "required": false
            },
            {
                "name": "budget",
                "location": "PARAMETER_LOCATION_BODY",
                "schema": {
                    "description": "Maximum budget for college (in dollars)",
                    "type": "integer"
                },
                "required": false
            },
            {
                "name": "branches",
                "location": "PARAMETER_LOCATION_BODY",
                "schema": {
                    "description": "Preferred branches of study",
                    "type": "array",
                    "items": { "type": "string" }
                },
                "required": false
            }
        ],
        "http": {
            "baseUrlPattern": `${toolsBaseUrl}/college/fetch`,
            "httpMethod": "POST"
        }
    }
  }
];

export const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    model: 'fixie-ai/ultravox',
    voice: 'Dakota Flash V2',
    temperature: 0.3,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
    selectedTools: selectedTools,
    medium: { "twilio": {} }
};