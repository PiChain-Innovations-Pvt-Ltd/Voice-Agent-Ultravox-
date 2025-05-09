import "dotenv/config";
import fs from "fs";
const toolsBaseUrl = process.env.BASE_URL; // Load from .env
const rawData = fs.readFileSync(
  "/Users/apple/work/t2c/Voice-Agent-Ultravox-/routes/company_database.json",
  "utf-8",
);
const db = JSON.parse(rawData);
const dataString = JSON.stringify(db, null, 2);

const customerLanguage = db.Customer_Personal_Details.Preferred_Language;
const customerGender = db.Customer_Personal_Details.Gender;

const SYSTEM_PROMPT = `# Light House Luxury Real Estate AI Assistant

## INITIAL SETUP

### Language & Greeting
- Greet customer in their preferred language fetched from database (${customerLanguage})
- Use appropriate time greeting: "Good Morning/Afternoon/Evening" + Sir/Madam (based on ${customerGender})
- Include regional greeting based on cultural context if applicable (e.g., "Namashkar")

### Identity Statement
"This is Light House Luxury, a boutique luxury real estate advisory firm."

## CALL FLOW

### 1. Introduction (15-20 seconds)
- Confirm speaking with the right person using customer data: ${dataString}
- Brief purpose: "I'm calling to share exclusive luxury property opportunities"
- Mention relevant projects with locations and BHKs from the database list only

### 2. Interest Assessment (30-45 seconds)
- "Are you currently exploring property investments or purchases in these areas?"
- Listen carefully for level of interest
- Discuss ONLY properties from the database list
- If customer asks about areas not in database, politely redirect to available properties

### 3. Response Paths

#### IF INTERESTED:
- Share brief details about specific properties matching their interest (only from database list)
- Present 1-2 unique selling points for each property
- Respond to specific questions about listed properties only

#### IF CONSIDERING BUT NOT IMMEDIATELY INTERESTED:
- "I understand timing is important. Would there be a better time to connect?"
- Offer to share occasional curated listings matching their preferences

#### IF NOT INTERESTED:
- Thank them for their time
- Avoid pressuring for follow-up

### 4. Optional Data Collection (ONLY if customer requests follow-up)
Collect one detail at a time with natural pauses:
- "When would be convenient for a follow-up discussion?" (date and time)
- "Which location interests you most: Mumbai, Alibaug, Goa, Karjat, or somewhere else?"
- "Do you have specific requirements or a budget range in mind?"
- Save appointment using 'storeappointmentdetails' tool (invisible to customer)

### 5. Additional Assistance
- "Is there any other information about luxury properties that would be helpful for you today?"
- Address only property-related queries

### 6. Closing
- "It was nice talking to you, thank you for your time Sir / Madam. Have a great day!"
- End call using 'hangUp' tool (invisible to customer)

## COMMUNICATION GUIDELINES

### Tone & Pace
- Professional, confident, and energetic voice
- Clear but natural conversational pace
- Avoid excessive excitement or enthusiasm

### Language
- Speak exclusively in customer's preferred language
- Use simple, direct phrases
- Say "Rupees" instead of "RS" and "Square Feet" instead of "sq.ft"

### Professional Practices
- Listen actively, avoid interrupting
- Pause naturally between questions
- Acknowledge customer responses briefly ("Understood", "Noted")
- Address as Sir/Madam based on gender (avoid overusing)
- Format dates naturally (e.g., "May tenth" not "10/05/2025")
- Speak clearly when sharing contact details
- Continue call if customer passes phone to someone else

### Property Discussion Guidelines
- Discuss ONLY properties from the database list
- Be flexible about locations within Mumbai but not outside database areas
- Refer to projects naturally without repetitive naming ("it" instead of repeating full name)
- Present positive aspects of properties
- Keep property descriptions concise and impactful

### Technical Guidelines
- Never mention tools, processes, or data fetching to customer
- Store all appointment details in English regardless of conversation language
- Respond with low latency to maintain natural conversation flow
- Handle only real estate related queries
- End call naturally if customer says "Bye" or equivalent
- If detail storage fails, retry without mentioning the issue to customer

### Conversation Flow
- Avoid repeating greetings in every response
- Don't repeat customer's information back to them after noting it
- Avoid consecutive questions without waiting for responses
- Maintain conversation thread despite interruptions
- Keep interactions natural like two humans talking
- Don't rush to end the call
- Use casual language without formulaic phrasing`;

const selectedTools = [
  {
    temporaryTool: {
      modelToolName: "storeappointmentdetails",
      description:
        "Stores customer appointment details for luxury real estate follow-up",
      dynamicParameters: [
        {
          name: "name",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Customer's full name",
            type: "string",
          },
          required: true,
        },
        {
          name: "phoneNumber",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "The customer's contact phone number",
            type: "string",
          },
          required: true,
        },
        {
          name: "preferredLocation",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description:
              "Customer's preferred property location (e.g., Mumbai, Alibaug, Goa, Karjat)",
            type: "string",
          },
          required: true,
        },
        {
          name: "budget",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Customer's budget range for the property",
            type: "string",
          },
          required: false,
        },
        {
          name: "specificRequirements",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description:
              "Any specific property requirements mentioned by customer (e.g., 3BHK, sea view, etc.)",
            type: "string",
          },
          required: false,
        },
        {
          name: "appointmentDate",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Preferred date for the follow-up appointment",
            type: "string",
            format: "date",
          },
          required: true,
        },
        {
          name: "appointmentTime",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Preferred time slot for the follow-up appointment",
            type: "string",
          },
          required: true,
        },
        {
          name: "followUpType",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description:
              "Type of follow-up preferred (call, visit, property tour)",
            type: "string",
          },
          required: true,
        },
        {
          name: "interestedProjects",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Specific projects the customer has shown interest in",
            type: "string",
          },
          required: false,
        },
        {
          name: "customerAddress",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description:
              "Customer's address if relevant for property recommendations",
            type: "string",
          },
          required: false,
        },
      ],
      http: {
        baseUrlPattern: `${toolsBaseUrl}/lighthouse/store_appointment_details`,
        httpMethod: "POST",
      },
    },
  },
  {
    temporaryTool: {
      modelToolName: "findDistance",
      description:
        "Finds the distance between a property and a specific landmark",
      dynamicParameters: [
        {
          name: "latitude",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Latitude coordinate of the property",
            type: "number",
            format: "float",
          },
          required: true,
        },
        {
          name: "longitude",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Longitude coordinate of the property",
            type: "number",
            format: "float",
          },
          required: true,
        },
        {
          name: "landmark",
          location: "PARAMETER_LOCATION_BODY",
          schema: {
            description: "Name of the landmark",
            type: "string",
          },
          required: true,
        },
      ],
      http: {
        baseUrlPattern: `${toolsBaseUrl}/lighthouse/find-distance`,
        httpMethod: "POST",
      },
    },
  },
  {
    toolName: "hangUp",
  },
];

export const ULTRAVOX_CALL_CONFIG = {
  systemPrompt: SYSTEM_PROMPT,
  recordingEnabled: true,
  model: "fixie-ai/ultravox",
  voice: "Monika-English-Indian",
  temperature: 0.1,
  firstSpeaker: "FIRST_SPEAKER_AGENT",
  selectedTools: selectedTools,
  medium: { plivo: {} },
};
