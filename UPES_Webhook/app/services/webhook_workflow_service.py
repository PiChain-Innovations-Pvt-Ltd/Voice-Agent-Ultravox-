# UPES_api/app/services/webhook_workflow_service.py
import asyncio
import uuid
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional, List, Dict, Any

import httpx # For asynchronous HTTP requests
import gspread # For Google Sheets API
from google.oauth2.service_account import Credentials # For Google Sheets auth

from fastapi import HTTPException, status
from app.models.webhook import WebhookPayload, TranscriptMessage
from app.utils.logger import logger
from app.config import settings
from app.services.mongo_service import db # Import MongoDB client

# --- Initialize external clients (singleton pattern) ---

_httpx_client: httpx.AsyncClient = None

async def get_httpx_client() -> httpx.AsyncClient:
    """Returns a singleton httpx.AsyncClient instance."""
    global _httpx_client
    if _httpx_client is None:
        _httpx_client = httpx.AsyncClient(timeout=30.0)
        logger.info("[HTTPX Client] New httpx.AsyncClient initialized.")
    return _httpx_client

_gspread_client = None

def get_gspread_client():
    """Returns a singleton gspread client instance."""
    global _gspread_client
    if _gspread_client is None:
        try:
            # Check if required config is present, but allow partial if not for commented-out services
            if not settings.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEYFILE_PATH or not settings.GOOGLE_SHEET_ID:
                logger.warning("Google Sheets credentials or sheet ID missing. Google Sheets functionality might be skipped if enabled.")
                return None
            
            creds = Credentials.from_service_account_file(
                settings.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEYFILE_PATH,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            _gspread_client = gspread.authorize(creds)
            logger.info("[Google Sheets Client] gspread client authorized successfully.")
        except Exception as e:
            logger.error(f"[Google Sheets Client] Failed to authorize gspread client: {e}", exc_info=True)
            return None
    return _gspread_client

# --- Real API Call Implementations ---

# This function is commented out as per previous requirement
# async def real_google_sheets_append(data: dict):
#     """Appends data to a Google Sheet using gspread."""
#     logger.info(f"[Google Sheets] Attempting to append data for call_id: {data.get('call_id')}")
#     gc = get_gspread_client()
#     if not gc:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google Sheets client not initialized.")
#     try:
#         def _append_sync():
#             spreadsheet = gc.open_by_id(settings.GOOGLE_SHEET_ID)
#             worksheet = spreadsheet.worksheet("Sheet1")
#             # Adjust row_data mapping for appointment details if you were to enable it
#             row_data = [
#                 data.get('call_id', ''),
#                 data.get('timestamp', ''),
#                 data.get('name', ''),
#                 data.get('phoneNumber', ''),
#                 data.get('program', ''),
#                 data.get('appointmentDate', ''),
#                 data.get('appointmentTime', ''),
#                 data.get('10thPercentage', ''),
#                 data.get('12thPercentage', ''),
#                 json.dumps(data.get('full_transcript', {}))
#             ]
#             worksheet.append_row(row_data)
#             return {"status": "success", "message": "Data appended to Google Sheet."}
#         result = await asyncio.to_thread(_append_sync)
#         logger.info(f"[Google Sheets] {result['message']}")
#         return result
#     except Exception as e:
#         logger.error(f"[Google Sheets] Error appending data: {e}", exc_info=True)
#         raise HTTPException(
#             status_code=status.HTTP_502_BAD_GATEWAY,
#             detail=f"Google Sheets API error: {e}"
#         )

async def real_whatsapp_send_message(to_number: str, message_body: str):
    """Sends a message via WhatsApp Business Cloud using httpx."""
    logger.info(f"[WhatsApp Business Cloud] Attempting to send message to {to_number}: '{message_body[:50]}...'")
    client = await get_httpx_client()
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message_body}
    }
    try:
        response = await client.post(settings.WHATSAPP_BUSINESS_API_URL, json=payload, headers=headers)
        response.raise_for_status() # Raises an HTTPStatusError for 4xx/5xx responses
        whatsapp_response_data = response.json()
        logger.info(f"[WhatsApp Business Cloud] Message sent successfully. WhatsApp message ID: {whatsapp_response_data.get('messages', [{}])[0].get('id')}")
        return {"status": "success", "response": whatsapp_response_data}
    except httpx.HTTPStatusError as e:
        logger.error(f"[WhatsApp Business Cloud] HTTP error sending message: {e.response.status_code} - {e.response.text}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"WhatsApp API HTTP error: {e.response.status_code} - {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"[WhatsApp Business Cloud] Network error sending message: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"WhatsApp API network error: {e}"
        )
    except Exception as e:
        logger.error(f"[WhatsApp Business Cloud] Unexpected error sending message: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"WhatsApp API error: {e}"
        )

async def real_salesforce_auth_token():
    """Gets an authentication token from Salesforce using Username-Password flow with httpx."""
    logger.info("[Salesforce Auth] Attempting to get auth token from Salesforce...")
    client = await get_httpx_client()
    if not all([settings.SALESFORCE_USERNAME, settings.SALESFORCE_PASSWORD, settings.SALESFORCE_CLIENT_ID, settings.SALESFORCE_CLIENT_SECRET, settings.SALESFORCE_AUTH_URL]):
        raise ValueError("Missing one or more Salesforce authentication environment variables (USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET, AUTH_URL).")

    password_with_token = f"{settings.SALESFORCE_PASSWORD}{settings.SALESFORCE_SECURITY_TOKEN}" if settings.SALESFORCE_SECURITY_TOKEN else settings.SALESFORCE_PASSWORD
    
    data = {
        "grant_type": "password",
        "client_id": settings.SALESFORCE_CLIENT_ID,
        "client_secret": settings.SALESFORCE_CLIENT_SECRET,
        "username": settings.SALESFORCE_USERNAME,
        "password": settings.SALESFORCE_PASSWORD
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    try:
        response = await client.post(settings.SALESFORCE_API_BASE_URL, data=data, headers=headers)
        print("This is the response",response)
        response.raise_for_status()
        token_data = response.json()
        if "access_token" not in token_data:
            raise ValueError("Salesforce auth response missing access_token.")
        logger.info("[Salesforce Auth] Token received successfully.")
        return token_data
    except httpx.HTTPStatusError as e:
        logger.error(f"[Salesforce Auth] HTTP error getting token: {e.response.status_code} - {e.response.text}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Salesforce Auth HTTP error: {e.response.status_code} - {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"[Salesforce Auth] Network error getting token: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Salesforce Auth network error: {e}"
        )
    except Exception as e:
        logger.error(f"[Salesforce Auth] Unexpected error getting token: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Salesforce Auth error: {e}"
        )

async def real_salesforce_post_appointment_data(auth_token: str, appointment_details: dict, full_transcript: List[TranscriptMessage]):
    """Posts appointment data to Salesforce."""
    logger.info(f"[Salesforce POST] Posting appointment data for {appointment_details.get('name')} (Call ID: {appointment_details.get('call_id')})...")
    client = await get_httpx_client()
    
    # Define your Salesforce Custom Object API Name for Appointments
    # This MUST match what's configured in your Salesforce instance (e.g., 'Appointment__c')
    # salesforce_object_type = "/Lead" # <--- IMPORTANT: Configure this in Salesforce!
    salesforce_post_url = settings.SALESFORCE_POST_URL


    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

    # Map extracted data to Salesforce custom fields.
    # These field names MUST match the API names of your custom fields in Salesforce (e.g., 'Student_Name__c').
    # payload = {
    #     "Call_ID__c": appointment_details.get('call_id'),
    #     "Student_Name__c": appointment_details.get('name'),
    #     "Phone_Number__c": appointment_details.get('phoneNumber'),
    #     "Program__c": appointment_details.get('program'),
    #     "Appointment_Date__c": appointment_details.get('appointmentDate'), # Salesforce Date field expects YYYY-MM-DD
    #     "Appointment_Time__c": appointment_details.get('appointmentTime'), # Salesforce Time field expects HH:MM:SS.000Z
    #     "Tenth_Percentage__c": appointment_details.get('10thPercentage'),
    #     "Twelfth_Percentage__c": appointment_details.get('12thPercentage'),
    #     "Full_Transcript__c": json.dumps([msg.model_dump() for msg in full_transcript])
    # }

    payload = {
        "LastName": appointment_details.get('name'),
        "Phone": appointment_details.get('phoneNumber'),
        "Program__c": appointment_details.get('program'),
        "Appointment_Date__c": appointment_details.get('appointmentDate'), # Salesforce Date field expects YYYY-MM-DD
        "Appointment_Time__c": appointment_details.get('appointmentTime'), # Salesforce Time field expects HH:MM:SS.000Z
        "X10th_Percentage__c": appointment_details.get('10thPercentage'),
        "X12th_Percentage__c": appointment_details.get('12thPercentage'),
        "JSON_Script__c": json.dumps([msg.model_dump() for msg in full_transcript]),
        "Company": "Ken42"
    }
    
    payload = {k: v for k, v in payload.items() if v is not None} # Filter out None values

    try:
        response = await client.post(salesforce_post_url, json=payload, headers=headers)
        response.raise_for_status()
        salesforce_response_data = response.json()
        logger.info(f"[Salesforce POST] Appointment data posted successfully. Record ID: {salesforce_response_data.get('id')}")
        return {"status": "success", "response": salesforce_response_data}
    except httpx.HTTPStatusError as e:
        logger.error(f"[Salesforce POST] HTTP error posting data: {e.response.status_code} - {e.response.text}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Salesforce API HTTP error: {e.response.status_code} - {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"[Salesforce POST] Network error posting data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Salesforce API network error: {e}"
        )
    except Exception as e:
        logger.error(f"[Salesforce POST] Unexpected error posting data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Salesforce API error: {e}"
        )

async def real_mongo_insert_appointment_details(data: dict):
    """Inserts appointment details into MongoDB."""
    logger.info(f"[MongoDB] Inserting appointment details for call_id: {data.get('call_id')}")
    try:
        # Assuming you will add a new collection name like APPOINTMENT_DETAILS_COLLECTION to settings
        result = db[settings.MONGO_DB_COLLECTION].insert_one(data) # Using existing VENDOR_ONBOARDING_COLLECTION for now
        logger.info(f"[MongoDB] Appointment details inserted successfully. Doc ID: {result.inserted_id}")
        return {"status": "success", "message": "Data inserted into MongoDB.", "inserted_id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"[MongoDB] Error inserting appointment details: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MongoDB insert error: {e}"
        )

# --- Data Extraction Logic (Updated) ---
def _extract_appointment_details_from_transcript(transcript: List[TranscriptMessage]) -> Optional[Dict[str, Any]]:
    """
    Parses the transcript messages to find and extract appointment details from
    the 'storeappointmentdetails' tool call.
    """
    for message in transcript:
        if message.role == "MESSAGE_ROLE_TOOL_CALL" and message.toolName == "storeappointmentdetails":
            try:
                if message.text:
                    details = json.loads(message.text)
                    logger.info(f"[Extraction] Successfully extracted appointment details: {details.keys()}")
                    return details
                else:
                    logger.warning("[Extraction] Tool call 'storeappointmentdetails' found but text field is empty or None.")
                    return None
            except json.JSONDecodeError as e:
                logger.error(f"[Extraction] Failed to decode JSON from tool call text for 'storeappointmentdetails': {e}", exc_info=True)
                return None
            except Exception as e:
                logger.error(f"[Extraction] Unexpected error during tool call text parsing for 'storeappointmentdetails': {e}", exc_info=True)
                return None
    logger.warning("[Extraction] 'storeappointmentdetails' tool call not found in transcript.")
    return None

# --- Core Workflow Blocks (Updated for Appointment Scenario) ---

def code_block_logic(payload: WebhookPayload):
    """
    Performs initial processing, including extracting appointment details from the transcript.
    This acts as the 'Code' block, preparing data for subsequent steps.
    """
    logger.info(f"[Code Block] Initializing processing for call_id: {payload.call_id}")
    
    # Step 1: Extract appointment details from the transcript
    extracted_appointment_details = _extract_appointment_details_from_transcript(payload.transcript)
    if not extracted_appointment_details:
        logger.error(f"[Code Block] Could not extract necessary appointment details for call_id: {payload.call_id}. Halting workflow.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Required appointment details not found in transcript."
        )

    # Add call_id and full transcript to the extracted details for persistence and other steps
    extracted_appointment_details['call_id'] = payload.call_id
    extracted_appointment_details['full_transcript'] = [msg.model_dump() for msg in payload.transcript]
    
    # Use extracted phone number and name for WhatsApp/Salesforce, as they are present in the tool call
    whatsapp_recipient_phone = extracted_appointment_details.get('phoneNumber')
    whatsapp_recipient_name = extracted_appointment_details.get('name')

    salesforce_processing_context = extracted_appointment_details.copy()
    
    # google_sheets_data (commented out in current use, but structured here)
    google_sheets_data = extracted_appointment_details.copy()
    
    return extracted_appointment_details, whatsapp_recipient_phone, whatsapp_recipient_name, salesforce_processing_context, google_sheets_data

def guardrails_block_logic(salesforce_context: dict):
    """
    Implements the 'Guardrails' block, applying business rules before Salesforce update.
    Checks for essential appointment details.
    """
    logger.info(f"[Guardrails Block] Applying checks for appointment for call_id: {salesforce_context.get('call_id')}")

    # Example Guardrail 1: Ensure name and phone number are present for appointment
    if not salesforce_context.get('name') or not salesforce_context.get('phoneNumber'):
        logger.info(f"[Guardrails Block] Missing student name or phone number for {salesforce_context.get('call_id')}. Halting Salesforce path.")
        return {"can_proceed": False, "reason": "Missing essential student contact information."}

    # Example Guardrail 2: Ensure appointment date is provided
    if not salesforce_context.get('appointmentDate'):
        logger.info(f"[Guardrails Block] Appointment date missing for {salesforce_context.get('call_id')}. Halting Salesforce path.")
        return {"can_proceed": False, "reason": "Appointment date not provided."}
    
    logger.info(f"[Guardrails Block] All guardrail checks passed for call_id: {salesforce_context.get('call_id')}.")
    return {"can_proceed": True, "reason": "All checks passed"}

def set_transcript_summary_logic(full_transcript: List[TranscriptMessage]):
    """
    Generates a summary of the transcript. This could be used for Salesforce description.
    """
    logger.info("[Set Transcript Summary Block] Generating summary...")
    
    conversation_text = " ".join([msg.text or '' for msg in full_transcript if msg.role in ["MESSAGE_ROLE_USER", "MESSAGE_ROLE_AGENT"]])
    
    if len(conversation_text) > 200:
        summary = f"Call summary: Student enquired about UPES, provided details for B.Tech program appointment. Conversation highlights: {conversation_text[:150]}... [truncated]"
    elif len(conversation_text) > 50:
        summary = f"Call summary: Student enquired about UPES and set an appointment. Key points: {conversation_text[:50]}..."
    else:
        summary = f"Call summary: {conversation_text}"
    
    return summary

# --- Workflow Orchestration Functions (Renamed for clarity and flexibility) ---

async def _process_mongodb_insert(appointment_data: dict):
    """Handles inserting data into MongoDB."""
    path_results = {"status": "started", "steps": []}
    try:
        mongo_result = await real_mongo_insert_appointment_details(appointment_data)
        path_results["steps"].append({"MongoDB Insert": mongo_result})
        path_results["status"] = "completed"
    except HTTPException as e:
        logger.error(f"❌ Error in MongoDB insert path for {appointment_data.get('call_id')}: {e.detail}")
        path_results["status"] = "failed"
        path_results["error_detail"] = e.detail
    except Exception as e:
        logger.error(f"❌ Unexpected error in MongoDB insert path for {appointment_data.get('call_id')}: {e}", exc_info=True)
        path_results["status"] = "failed"
        path_results["error_detail"] = str(e)
    return path_results


async def _process_whatsapp_confirmation(recipient_phone: str, recipient_name: str, call_id: str):
    """Handles sending the WhatsApp confirmation message."""
    path_results = {"status": "started", "steps": []}
    if not recipient_phone:
        logger.warning(f"Skipping WhatsApp confirmation: recipient phone number not provided for call_id {call_id}.")
        path_results["status"] = "skipped"
        path_results["reason"] = "Recipient phone number not available."
        return path_results
    
    try:
        # Customize WhatsApp message for appointment confirmation
        whatsapp_message = f"Hello {recipient_name},\n Your appointment regarding UPES programs has been confirmed. You will receive further details shortly. Thank you!"
        whatsapp_result = await real_whatsapp_send_message(recipient_phone, whatsapp_message)
        path_results["steps"].append({"WhatsApp Confirmation": whatsapp_result})
        path_results["status"] = "completed"
    except HTTPException as e:
        logger.error(f"❌ Error in WhatsApp confirmation path for {call_id}: {e.detail}")
        path_results["status"] = "failed"
        path_results["error_detail"] = e.detail
    except Exception as e:
        logger.error(f"❌ Unexpected error in WhatsApp confirmation path for {call_id}: {e}", exc_info=True)
        path_results["status"] = "failed"
        path_results["error_detail"] = str(e)
    return path_results


async def _process_salesforce_appointment_creation(salesforce_context: dict, full_transcript: List[TranscriptMessage]):
    """Handles the Salesforce authentication and appointment data posting path."""
    path_results = {"status": "started", "steps": []}
    
    try:
        # Step: Get Auth Token (Salesforce)
        auth_token_response = await real_salesforce_auth_token()
        salesforce_auth_token = auth_token_response.get("access_token")
        path_results["steps"].append({"Get Auth Token": {"status": "success" if salesforce_auth_token else "failed"}})

        if not salesforce_auth_token:
            raise ValueError("Salesforce authentication failed: No token received.")

        # Step: Guardrails
        guardrails_check = guardrails_block_logic(salesforce_context)
        path_results["steps"].append({"Guardrails": guardrails_check})

        if not guardrails_check["can_proceed"]:
            path_results["status"] = "skipped"
            path_results["reason"] = guardrails_check["reason"]
            return path_results

        # Step: Set Transcript Summary for Salesforce description
        transcript_summary = set_transcript_summary_logic(full_transcript)
        path_results["steps"].append({"Set Transcript Summary": {"summary_length": len(transcript_summary)}})
        
        # Step: Salesforce POST (appointment data)
        salesforce_post_result = await real_salesforce_post_appointment_data(
            auth_token=salesforce_auth_token, 
            appointment_details=salesforce_context, # All extracted details
            full_transcript=full_transcript # Full transcript for detailed logging/storage in SF
        )
        path_results["steps"].append({"Salesforce POST": salesforce_post_result})
        
        path_results["status"] = "completed"

    except HTTPException as e:
        logger.error(f"❌ Error in Salesforce path for {salesforce_context.get('call_id')}: {e.detail}")
        path_results["status"] = "failed"
        path_results["error_detail"] = e.detail
    except ValueError as e:
        logger.error(f"❌ Data/Authentication error in Salesforce path for {salesforce_context.get('call_id')}: {e}")
        path_results["status"] = "failed"
        path_results["error_detail"] = str(e)
    except Exception as e:
        logger.error(f"❌ Unexpected error in Salesforce path for {salesforce_context.get('call_id')}: {e}", exc_info=True)
        path_results["status"] = "failed"
        path_results["error_detail"] = str(e)
    return path_results


async def process_webhook_workflow(payload: WebhookPayload) -> dict:
    """
    Orchestrates the appointment details flowchart workflow from the incoming webhook payload.
    This function coordinates the execution of parallel and sequential steps.
    """
    logger.info(f"Initiating workflow for call_id: {payload.call_id}")

    # 1. Execute 'Code' Block to extract data
    # This block raises HTTPException if critical data is missing.
    extracted_appointment_details, whatsapp_recipient_phone, whatsapp_recipient_name, salesforce_context, _google_sheets_data = \
        code_block_logic(payload)

    # 2. Prepare tasks dynamically based on what you want to run
    tasks = []
    # Use a dictionary to store results, keyed by service name for clarity
    results_summary = {} 

    # --- Conditional Inclusion of Services ---
    # Set these flags to True or False to enable/disable each service.

    _ENABLE_MONGODB_INSERT = True
    if _ENABLE_MONGODB_INSERT:
        tasks.append(asyncio.create_task(_process_mongodb_insert(extracted_appointment_details)))
        results_summary["mongodb_insert"] = {"status": "pending"} # Initialize status

    _ENABLE_WHATSAPP_CONFIRMATION = False
    if _ENABLE_WHATSAPP_CONFIRMATION:
        tasks.append(asyncio.create_task(_process_whatsapp_confirmation(
            recipient_phone=whatsapp_recipient_phone,
            recipient_name=whatsapp_recipient_name,
            call_id=payload.call_id
        )))
        results_summary["whatsapp_confirmation"] = {"status": "pending"}

    _ENABLE_SALESFORCE_CREATION = True
    if _ENABLE_SALESFORCE_CREATION:
        tasks.append(asyncio.create_task(_process_salesforce_appointment_creation(
            salesforce_context=salesforce_context,
            full_transcript=payload.transcript
        )))
        results_summary["salesforce_creation"] = {"status": "pending"}

    # Google Sheets (commented out for now as per requirement)
    # _ENABLE_GOOGLE_SHEETS = False
    # if _ENABLE_GOOGLE_SHEETS:
    #     tasks.append(asyncio.create_task(real_google_sheets_append(_google_sheets_data)))
    #     results_summary["google_sheets_append"] = {"status": "pending"}

    # Execute all prepared tasks concurrently
    if tasks:
        # Use a list to maintain the order of results and then map them back
        task_names_in_order = [key for key, enabled in {
            "mongodb_insert": _ENABLE_MONGODB_INSERT,
            "whatsapp_confirmation": _ENABLE_WHATSAPP_CONFIRMATION,
            "salesforce_creation": _ENABLE_SALESFORCE_CREATION,
            # "google_sheets_append": _ENABLE_GOOGLE_SHEETS # Add if enabled
        }.items() if enabled]

        all_results_from_gather = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(all_results_from_gather):
            task_name = task_names_in_order[i]
            if isinstance(result, Exception):
                logger.error(f"Error in parallel task '{task_name}': {result}", exc_info=True)
                results_summary[task_name] = {"status": "failed", "error": str(result)}
            else:
                results_summary[task_name] = result # Store the actual return value from the _process_X function

    else:
        logger.warning(f"No tasks were enabled for call_id: {payload.call_id}. Returning empty results.")

    logger.info(f"✅ Workflow execution complete for Call ID: {payload.call_id}")

    return results_summary

# Ensure the httpx client is closed when the application shuts down
async def shutdown_httpx_client():
    global _httpx_client
    if _httpx_client:
        await _httpx_client.aclose()
        logger.info("httpx client closed.")