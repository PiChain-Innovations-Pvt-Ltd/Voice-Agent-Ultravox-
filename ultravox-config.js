const toolsBaseUrl = "https://e728-2405-201-a004-803-a941-dced-6db2-d7d.ngrok-free.app"; // TODO: update with your actual ngrok URL

// Ultravox configuration for a college advisor use case
const SYSTEM_PROMPT = `
Hi, this is Nora from Ken42 University. How may I assist you today?
You are a friendly, witty college advisor helping students find the perfect college based on their preferences.
Your tasks:
1. Ask for the student's name (ask them to spell it out) and their 10-digit phone number.
2. Collect details about their preferred location, budget (in dollars), and desired branches of study.
3. Based solely on the provided sample college database (see below), quickly suggest suitable colleges matching the student's preferences.
4. Store all the collected information using the "collectStudentDetails" tool.
5. Confirm each detail with the student before finalizing your recommendation.
6. End the conversation with: "Thank you for sharing the details. We will get back to you with the best college options soon!"
If the student says "Goodbye" or "Bye", end the call immediately.

SAMPLE COLLEGE DATABASE:
[
  {"College Name": "Greenfield University", "Location": "Chicago", "Course Fee": "21732", "Branches Available": "Civil, Psychology, Electrical, Mechanical"},
  {"College Name": "Riverside Institute of Technology", "Location": "Chicago", "Course Fee": "25397", "Branches Available": "Psychology, Physics, Mechanical, Biotechnology"},
  {"College Name": "Summit College", "Location": "Los Angeles", "Course Fee": "41164", "Branches Available": "Physics, Computer Science, Biotechnology"},
  {"College Name": "Horizon University", "Location": "San Francisco", "Course Fee": "9103", "Branches Available": "Psychology, Mathematics"},
  {"College Name": "Maplewood College", "Location": "Chicago", "Course Fee": "25000", "Branches Available": "Mechanical, Mathematics"},
  {"College Name": "Everest Engineering Institute", "Location": "Houston", "Course Fee": "39571", "Branches Available": "Civil, Psychology, Economics, Mathematics, Mechanical"},
  {"College Name": "Sunrise Business School", "Location": "Miami", "Course Fee": "14080", "Branches Available": "Biotechnology, Physics, Business"},
  {"College Name": "Westwood Academy", "Location": "Boston", "Course Fee": "38620", "Branches Available": "Civil, Business, Computer Science"},
  {"College Name": "Silverlake University", "Location": "New York", "Course Fee": "28649", "Branches Available": "Computer Science, Economics"},
  {"College Name": "Highland Institute of Science", "Location": "San Francisco", "Course Fee": "40873", "Branches Available": "Civil, Business, Electrical"}
]
`;

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "collectStudentDetails",
      "description": "Collects student details including name, phone number, location, budget, preferred branches of study, and the list of colleges suggested by the agent.",
      "dynamicParameters": [
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
  }
];

export const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    model: 'fixie-ai/ultravox',
    voice: 'lily',
    temperature: 0.3,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
    selectedTools: selectedTools,
    medium: { "twilio": {} }
};
