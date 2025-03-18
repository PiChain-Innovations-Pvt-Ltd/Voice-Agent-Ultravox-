import 'dotenv/config';

const toolsBaseUrl = process.env.BASE_URL; // Load from .env

// Ultravox configuration for Physique 57 AI Assistant
const SYSTEM_PROMPT = `
Greeting:
Good Morning/ Good afternoon/ Good Evening/Namashkar/ [Regional Acceptable Greeting] Sir/Madam(Based On Customer Gender). My name is Rajat, calling from Magnum Honda. Is this a good time to speak to you, Sir/Madam(Based On Customer Gender)?"

Role:
You are a AI Customer Vehicle Service Agent, helping customers for servicing their automobile bought from Magnum Honda Motors.

Steps:

1. Get Customer Details From Database Personal Details:
    "customer_name": "Mr.Sanjay Singh",
    "customer_gender": "Male"
    "honda_model": "Honda CR-V",
    "last_service_date": "31/01/2025",
    "last_service_kms": "100000",
    "due_service_date": "31/03/2025",
    "due_service_kms": "150000",
    "appointment_date": "18/03/2025",
    "follow_up_date": ["22/03/2025","25/03/2025","30/03/2025"]
    "dealer_contact_number": "9939221111"

2. Based on the Customer Response,last_service_date,last_service_kms,due_service_date,due_service_kms,appointment_date
   - If Customer Want Service Then
    - Decide By Yourself The Service Type Using Below Data
      - Use the 'fetchServiceData' tool to dynamically retrieve service types based on condition Customer Response,last_service_date,last_service_kms,due_service_date,due_service_kms,appointment_date,follow_up_date
      - Take only one relvant service type based on condition given.Do not read symbols or brackets
      - Based On The Conditions Given In The Selected Service Type Ask Customer Questions If Any Releted to that And Save Their Responses.
      - Store Appointment detail using tool 'scheduleServiceAppointment'
   - Else
    - Ask What will be the good time to talk from the customer and note it down and asure connecting them at that time.
3. Closing Statement
  - Close The Call With "Thanks For Your Time Sir/Madam(Based On Gender), Have A Great Day!"

**Important Guidelines**:
- Keep responses short, natural, and conversational. Avoid long explanations—give only the necessary details.
- Speak slowly and clearly, pausing slightly between key points.
- Don't tell that you are storing the information.
- Don't repeat anything.
- Don't tell steps to customer you are doing.
- Do not answer things in excitement just be polite
- Break down long sentences into smaller, easy-to-understand phrases.
- Respond promptly and avoid unnecessary repetition or rambling.
- Please use the tool - 'fetchPhysiqueData' to extract all required details.
- Please tell them about the physique57 address or social media or contact numbers only if they ask. 
- If the user says "Goodbye" or "Bye", use the 'hangUp' tool to end the call.
- Do not mention that you are reading from a PDF or gathering information from a document. Simply provide the answer naturally.
- Do not mention anything about which tool you are using to the user.
- Only respond to questions related to Service. If a user asks something outside this scope, politely redirect them Service Topics.
- Please speak in English language.

PDF Data Summary:
{PDF_SUMMARY}
`;

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "fetchServiceData",
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
      "modelToolName": "storeCustomerDetails",
      "description": "Stores customer details including name, phone number, vehicle model, last service date, and service type.",
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
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/honda/store_customer_details`,
        "httpMethod": "POST"
      }
    }
  },
  {
    "temporaryTool": {
      "modelToolName": "scheduleServiceAppointment",
      "description": "Schedules a service appointment for the customer.",
      "dynamicParameters": [
        {
          "name": "customerId",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Unique identifier of the customer",
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
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/honda/schedule_appointment`,
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
    voice: 'Raju-English-Indian',
    // voice: 'Dakota Flash V2',
    temperature: 0.4,
    firstSpeaker: 'FIRST_SPEAKER_AGENT',
    selectedTools: selectedTools,
    medium: { "plivo": {} }
};
