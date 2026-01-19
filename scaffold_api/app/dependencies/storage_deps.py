import functools
import os

import google.cloud.storage as storage
import structlog
from google.auth import default as gc_auth_default
from google.auth import impersonated_credentials

from app.core.config import settings

service_account = settings.GOOGLE_SERVICE_ACCOUNT or os.getenv("GOOGLE_SERVICE_ACCOUNT")

logger = structlog.stdlib.get_logger()


def get_service_account_key() -> str:
    """
    Reads the service account key from a file path if provided.
    This is useful for local development where the key is stored in a file.
    """
    key_path = settings.GCP_SERVICE_ACCOUNT_PATH
    if key_path and os.path.isfile(key_path):
        return key_path
    raise Exception("Service account key path is not set or invalid.")


@functools.lru_cache(maxsize=1)
def get_sync_gcs_client() -> storage.Client:
    """
    A memoized sync GCS Client singleton for background workers.
    Uses same auth pattern as async version but with sync library.

    In Kubernetes: Uses Workload Identity with impersonated credentials for signed URLs
    In local development: Uses service account key file
    """
    if settings.ENVIRONMENT == "local":
        key_path = settings.GCP_SERVICE_ACCOUNT_PATH
        if key_path and os.path.isfile(key_path):
            return storage.Client.from_service_account_json(key_path)
        raise Exception("Service account key path is not set or invalid.")

    if service_account:
        # GKE: use default credentials (Workload Identity) as source
        source_credentials, detected_project_id = gc_auth_default()

        # Create impersonated credentials for signing URLs
        # This handles remote signing via IAM API when source doesn't have a private key
        target_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        credentials = impersonated_credentials.Credentials(
            source_credentials=source_credentials,
            target_principal=service_account,
            target_scopes=target_scopes,
        )

        # Resolve project ID from env or detected
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        final_project_id = project_id or detected_project_id
        if final_project_id is None:
            raise ValueError("project_id not found in environment or credentials")

        return storage.Client(credentials=credentials, project=final_project_id)

    raise Exception(
        "No authentication method available: GOOGLE_SERVICE_ACCOUNT not set "
        "and ENVIRONMENT is not 'local'. Check your environment configuration."
    )
