from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional # Add this import

class Settings(BaseSettings):
    """
    All config is loaded from environment / .env.
    No defaults are hard-coded here.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore" # Allow extra fields in .env not defined here
    )

    # environment
    env:                     str = Field(..., env="ENV")  # local|dev|prod
    base_url_local:          str = Field(..., env="BASE_URL_LOCAL")
    base_url_dev:            str = Field(..., env="BASE_URL_DEV")
    base_url_prod:           str = Field(..., env="BASE_URL_PROD")

    # MongoDB connection
    mongo_uri:               str = Field(..., env="MONGO_URI")
    database_name:           str = Field(..., env="DATABASE_NAME")
    # NEW: MongoDB collection for vendor onboarding
    MONGO_DB_COLLECTION: str = Field(..., env="MONGO_DB_COLLECTION")
    SALESFORCE_POST_URL: str = Field(..., env="SALESFORCE_POST_URL")

    # --- Flowchart Service Configurations for REAL APIs ---
    # Salesforce URLs and Credentials
    SALESFORCE_AUTH_URL: str = Field(..., env="SALESFORCE_AUTH_URL")
    SALESFORCE_API_BASE_URL: str = Field(..., env="SALESFORCE_API_BASE_URL")
    SALESFORCE_CLIENT_ID: str = Field(..., env="SALESFORCE_CLIENT_ID")
    SALESFORCE_CLIENT_SECRET: str = Field(..., env="SALESFORCE_CLIENT_SECRET")
    SALESFORCE_USERNAME: str = Field(..., env="SALESFORCE_USERNAME")
    SALESFORCE_PASSWORD: str = Field(..., env="SALESFORCE_PASSWORD")
    SALESFORCE_SECURITY_TOKEN: Optional[str] = Field(None, env="SALESFORCE_SECURITY_TOKEN") # Optional for orgs without it

    # Google Sheets URLs and Credentials (will be commented out in service, but config still present)
    GOOGLE_SHEET_ID: Optional[str] = Field(None, env="GOOGLE_SHEET_ID") # Specific ID of the target spreadsheet
    GOOGLE_SHEETS_SERVICE_ACCOUNT_KEYFILE_PATH: Optional[str] = Field(None, env="GOOGLE_SHEETS_SERVICE_ACCOUNT_KEYFILE_PATH") # Path to JSON key file

    # WhatsApp Business Cloud URL and Token
    WHATSAPP_BUSINESS_API_URL: str = Field(..., env="WHATSAPP_BUSINESS_API_URL") # Specific API endpoint for messages
    WHATSAPP_API_TOKEN: str = Field(..., env="WHATSAPP_API_TOKEN") # Your WhatsApp Business Cloud permanent access token

settings = Settings()