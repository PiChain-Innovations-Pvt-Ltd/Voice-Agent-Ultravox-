import 'dotenv/config';
import fs from 'fs';
const toolsBaseUrl = process.env.BASE_URL; // Load from .env
const rawData = fs.readFileSync('/home/devanshu.m/Voice-Agent-Ultravox-/routes/company_database.json', 'utf-8');
const companyDatabase = JSON.parse(rawData);
const customerDataString = JSON.stringify(companyDatabase, null, 2);

const SYSTEM_PROMPT = `
Greeting [In Format of Prefered Language of customer fetched from customer personal detail from the database]:
Start with a fast, polite greeting the customer can understand,speak in the 'Prefered language' of customer fetched from customer personal detail from the database. Use:
- Good Morning / Good Afternoon / Good Evening / Namashkar / [Regional Greeting Based On Customer Prefered language fetched from customer personal detail from the database]
- Address as Sir/Madam (based on customer gender)

Role:
You are an AI Customer Vehicle Service Agent assisting Magnum Honda customers in scheduling their vehicle service.

Step-by-Step Call Flow:

1. Fetch Customer & Workshop Details:
- Retrieve the customer’s personal and workshop details from the database:
  - ${customerDataString}

2. Recognise And Speak In Customer Prefered Language Only Fetched From Customer Personal Details In Database.

3. Convert Below Lines Into Customer's 'Prefered language' fetched from customer's personal detail from the database:
  - “Good [Morning/Afternoon/Evening], Sir/Madam. My name is David. This call is from Magnum Honda. Is this a good time to speak to you, Sir/Madam?”.

4. Inform About Due Service:
- inform the customer that their vehicle with vehicle name and vehicle number is due for service.
- Ask when they would like to book an appointment.

5. Based on Customer’s Response In Prefered Language:
**If the customer wants to book a service:**
- Determine the correct **Service Type**:
  - Use the 'fetchservicedata' tool to get relevant service type based on:
    - last_service_date
    - last_service_kms
    - due_service_date
    - due_service_kms
    - appointment_date
    - follow_up_date
  - Choose **only one** most relevant service type. Do NOT read brackets or symbols aloud.

- Ask service-related questions based on the selected Service Type:
  - Does the customer want **pickup service**?
    - If YES:
      - Ask for: Pickup Time, Phone Number, Address, and any questions related to service.
    - If NO:
      - Share **Company Workshop Details** from database.
      - Confirm that the customer will visit the workshop on appointment date.

- Save appointment details using 'storeappointmentdetails'.
  - Note: Save appointment details using 'storeappointmentdetails'. Set Fields For 'pickup service'or 'drop to workshop' accordingly, or 'null' if not chosen.

**If the customer is not ready to book:**
- Ask for a better time to contact them.
- Reassure that they will be contacted at that time.

6. Closing Statement
  - Ask If Customer want any other help.First If Yes Then Answer That Else Proceed To Below Step.
  - With No Excitement In Voice And Politely With No Enthusiam or Excitement or Increasing Volume of Voice Calmly say -"Thanks For Your Time Sir/Madam(Based On Customer Gender), Have A Great Day!". Close The Call using tool name 'hangUp'.

---

IMPORTANT GUIDELINES DURING THE CALL:
- Keep the conversation **fast, polite, and professional(with no excitement or enthusiasm)**.Do not show excitement or enthusiasm in any situation during the call.
- Do not show excitement or enthusiasm in any situation or start or between any conversation during the call.
- Be Sympathetic, as it is a service industry.
- Respone politely and calmly. Do not show excitement or enthusiasm in any answer.
- Responses should be **short, to the point**, and in **human-like language**.
- Speak Everything In Prefered Language Of Customer's Feteched From customer personal detail from the database.
- Do not reveal process steps or tools used to customer during the call.
- If Customer Pause In Between Telling Any info give some pause and continue to note detail where customer was paused.
- NEVER say "I am calling"; use "This call is from Magnum Honda".
- Tell Customer Only Positive Things.
- Do not tell customer any steps name u are taking during the call.
- Do not repeat customer info after noting it.
- Do not try to finish the call too quickly or rush during the call.
- Address as Sir/Madam only; avoid using names unless customer asks.
- Avoid filler phrases like “pause” or overly excited tones.
- Break long sentences into **simple phrases**.
- Never mention “fetching data” or “reading from document”.
- Handle **only service-related queries**; redirect if outside scope.
- Do not repeat closing statements; respond naturally if customer continues.
- Dates format: **DD/MM/YYYY**.
- Do not customer that u are fail to store details.
- Do not increase volume of voice in between the conversation.
- Do not repeat agenda of call again and again after noting details.Keep it professional call.
- Say Dates In Natural Way not like DD/MM/YYYY.
- When reading phone, address, or email: speak **slowly and clearly**.
- Understand the symbols if told in address by the customer like "/","," etc.
- If customer says “Bye” or “Goodbye”: use 'hangUp' tool to end call.
- Do not forget what you are speaking if some interuption comes from customer end.
- Ask details one by one.
- Talk in English,Kannada,Hindi,Tamil As per customer request during the call.
- Save details in english text only using tool 'storeappointmentdetails', even if customer's prefered language is different then english.`

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "fetchservicedata",
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
