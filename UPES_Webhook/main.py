import uvicorn
from fastapi import FastAPI, Depends, Request, status
from fastapi.responses import JSONResponse
from app.utils.logger import logger
from app.routers import  webhook
from app.services import webhook_workflow_service
from app.config import settings

# Dynamically pick the correct base URL
base_url_attr = f"base_url_{settings.env}"
root_path = getattr(settings, base_url_attr, "").rstrip("/")

app = FastAPI(
    title="UPES API",
    root_path=root_path
)


logger.info(f"Starting UPES API under ENV={settings.env} at root_path={root_path}")



# --- NEW: Include the webhook router ---
app.include_router(
    webhook.router, # Use the new webhook router
    prefix="/api/v1", # The webhook path is /api/v1/webhook
    tags=["Webhook Workflow"]
)

@app.exception_handler(status.HTTP_401_UNAUTHORIZED)
async def unauthorized_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc.detail)},
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.on_event("shutdown")
async def shutdown_event():
    await webhook_workflow_service.shutdown_httpx_client()
    logger.info("Application shutdown complete.")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
