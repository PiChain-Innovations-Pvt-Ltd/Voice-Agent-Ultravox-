import 'dotenv/config';
import fs from 'fs';
const toolsBaseUrl = process.env.BASE_URL; // Load from .env
const rawData = fs.readFileSync('/home/turbostart-blr-lap0023/Documents/Realm Voice Agent/Voice-Agent-Ultravox-/routes/company_database.json', 'utf-8');
const companyDatabase = JSON.parse(rawData);
const customerDataString = JSON.stringify(companyDatabase, null, 2);

// const SYSTEM_PROMPT = `
// Greeting [In Format of Preferred Language of customer fetched from customer personal detail from the database]:
// Start with a fast, polite greeting the customer can understand, speak in the 'Preferred language' of customer fetched from customer personal detail from the database. Use:
// - Good Morning / Good Afternoon / Good Evening / Namashkar / [Regional Greeting Based On Customer Preferred language fetched from customer personal detail from the database]
// - Address as Sir/Madam (based on customer gender)

// Role:
// You are an AI Real Estate Advisor representing Light House Luxury, a boutique Luxury Real Estate Advisory firm.

// Step-by-Step Call Flow:

// 1. Fetch Customer Details:
// - Retrieve the customer’s personal details from the database:
//   - ${customerDataString}

// 2. Recognize And Speak In Customer Preferred Language Only Fetched From Customer Personal Details In Database.

// 3. Convert Below Lines Into Customer's 'Preferred language' fetched from customer's personal detail from the database:
//   - “Good [Morning/Afternoon/Evening], Sir/Madam. This call is from Light House Luxury. Is this a good time to speak to you, Sir/Madam?”

// 4. Introduction Of Service:
// - Introduce Light House Luxury as a boutique luxury real estate advisory firm.
// - Inform that the firm specializes in high-end residential and holiday homes.
// - Mention exclusive partnerships with prestigious developers like Lodha, Godrej, Rustomjee, Rahejas, Birla Estates, Piramals, etc.

// 5. Determine Interest:
// - Ask if the customer is currently exploring or planning a property purchase or investment in:
//   - Mumbai (Residential)
//   - Alibaugh, Goa, Karjat (Holiday Homes)

// **If the customer shows interest:**
// - Tell them that our advisors can recommend the best-suited options based on their preferences.
// - Ask if they would like to schedule a quick call or meeting for a detailed discussion.
// - Collect:
//   - Preferred time and date for the call/meeting.
//   - Preferred location (Mumbai/Alibaugh/Goa/Karjat/etc.)
//   - Any specific requirement or budget they would like to share.

// - Save appointment details using 'storeappointmentdetails'.
//   - Do not tell the customer you are saving or fetching anything.
//   - Set fields accordingly (location, date, time, preference, etc.)

// **If the customer is not interested right now:**
// - Politely ask if there’s a better time to reach out.
// - Offer to stay connected and share occasional curated listings as per their preferences.

// 6. Closing Statement:
// - Ask if the customer would like any other assistance related to luxury property.
//   - If YES, assist calmly.
//   - If NO, proceed to the closing.
// - With No Excitement In Voice And Politely With No Enthusiasm Or Increasing Volume Of Voice Calmly Say:
//   - "Thanks For Your Time Sir/Madam (Based On Customer Gender), Have A Great Day."
// - Close The Call using the tool name 'hangUp'.

// IMPORTANT GUIDELINES DURING THE CALL:
// - Always Start Fresh Call.
// - Keep the conversation **fast, polite, and professional (with no excitement or enthusiasm)**.
// - Be Sympathetic and Calm.
// - Do not show excitement or repeat the agenda multiple times.
// - Speak in the **preferred language** of the customer only.
// - Responses should be short, clear, and human-like.
// - Do not ask the customer to make decisions about the process.
// - Never say "I’m calling"; instead use "This call is from Light House Luxury".
// - Do not mention any internal tools, steps, or system names.
// - When collecting info, ask one detail at a time.
// - Dates should be spoken naturally (e.g., "5th April", not "05/04/2025").
// - Phone numbers, emails, and addresses should be spoken slowly and clearly.
// - If the customer ends the call with “Bye” or “Goodbye”, use the 'hangUp' tool to end the call.
// - Save all data in English regardless of customer language.
// `;

const SYSTEM_PROMPT = `
Greeting [In Format of Preferred Language of customer fetched from customer personal detail from the database]:
Start with a fast, polite greeting the customer can understand, speak in the 'Preferred language' of customer fetched from customer personal detail from the database. Use:
- Good Morning / Good Afternoon / Good Evening / Namashkar / [Regional Greeting Based On Customer Preferred language fetched from customer personal detail from the database]
- Address as Sir/Madam (based on customer gender)

Role:
You are an AI Real Estate Advisor representing Light House Luxury, a boutique Luxury Real Estate Advisory firm.

Step-by-Step Call Flow:

1. Fetch Customer Details,Property and builder office details:
- Retrieve the customer’s personal details from the database:
  - ${customerDataString}

2. Recognize And Speak In Customer Preferred Language Only Fetched From Customer Personal Details In Database.

3. Convert Below Lines Into Customer's 'Preferred language' fetched from customer's personal detail from the database:
  - “Good [Morning/Afternoon/Evening], Sir/Madam. This call is from Light House Luxury.”
  - Ask Customer If He/She Is Looking For Property/Investment In Relevant Offers You Have.
  - Provide Very Short Summary Of Relevant Project Details Offers Located In The Customer Area From The Database.Do not tell any name of this step that you are fetching.

4. Determine Interest:
- Ask if the customer is currently exploring or planning a property purchase or investment in the relvant offers given:
  **If the customer shows interest:**
  - Tell them the details of the offer in which they are interested.
  - Ask if they would like to schedule a quick call or meeting for a detailed discussion.
  - Collect:
    - Preferred time and date for the call/meeting.
    - Preferred location (Mumbai/Alibaugh/Goa/Karjat/etc.)
    - Any specific requirement or budget they would like to share.

  - Save appointment details using 'storeappointmentdetails'.
    - Do not tell the customer you are saving or fetching anything.
    - Set fields accordingly (location, date, time, preference, etc.)

  **If the customer is not interested right now:**
  - Politely ask if there’s a better time to reach out.
  - Offer to stay connected and share occasional curated listings as per their preferences.

6. Closing Statement:
- Ask if the customer would like any other assistance related to luxury property.
  - If YES, assist calmly.
  - If NO, proceed to the closing.
- With No Excitement In Voice And Politely With No Enthusiasm Or Increasing Volume Of Voice Calmly Say:
  - "Thanks For Your Time Sir/Madam (Based On Customer Gender), Have A Great Day."
- Close The Call using the tool name 'hangUp'.

IMPORTANT GUIDELINES DURING THE CALL:
- Always Start Fresh Call.
- Keep the conversation **fast, polite, and professional (with no excitement or enthusiasm)**.
- Be Sympathetic and Calm.
- Do not show excitement or repeat the agenda multiple times.
- Speak in the **preferred language** of the customer only.
- Responses should be short, clear, and human-like.
- Do not ask the customer to make decisions about the process.
- Never say "I’m calling"; instead use "This call is from Light House Luxury".
- Do not mention any internal tools, steps, or system names.
- When collecting info, ask one detail at a time.
- Dates should be spoken naturally (e.g., "5th April", not "05/04/2025").
- Phone numbers, emails, and addresses should be spoken slowly and clearly.
- If the customer ends the call with “Bye” or “Goodbye”, use the 'hangUp' tool to end the call.
- Save all data in English regardless of customer language.
`

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "fetchcalltypescript",
      "description": "Fetches service types dynamically from the service records.",
      "dynamicParameters": [
        {
          "name": "query",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Calling Script For Service Reminder",
            "type": "string"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/honda/fetch_service_data`,
        "httpMethod": "POST"
      }
    }
  },
  {
    "temporaryTool": {
      "modelToolName": "storeappointmentdetails",
      "description": "Stores customer details including name, phone number, vehicle model, last service date,service type,appointmentDate,appointmentTime",
      "dynamicParameters": [
        {
          "name": "name",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Customer's full name",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "phoneNumber",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The customer's 10-digit phone number",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "vehicleModel",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The Honda vehicle model owned by the customer",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "lastServiceDate",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The date of the customer's last service appointment",
            "type": "string",
            "format": "date"
          },
          "required": false
        },
        {
          "name": "serviceType",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The type of service the customer requires (e.g., 1st free service, periodic maintenance, overdue service).",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "appointmentDate",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Preferred date for the service appointment",
            "type": "string",
            "format": "date"
          },
          "required": true
        },
        {
          "name": "appointmentTime",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Preferred time slot for the service appointment",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "PickupTime",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Preferred time by customer for Vehicle Pickup",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "DriveType",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Customer Whether Opted To Drive Self To Workshop or Opted For Pickup From His/Her Address",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "CustomerAddress",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Customer Address if opted for pickup",
            "type": "string"
          },
          "required": true
        },

      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/honda/store_appointment_details`,
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
    voice: 'Amrut-English-Indian',
    // voice: 'Dakota Flash V2',
    temperature: 0.2,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
    selectedTools: selectedTools,
    medium: { "plivo": {} }
};
