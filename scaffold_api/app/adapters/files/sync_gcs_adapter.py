from datetime import timedelta

import google.cloud.storage as storage

from app.adapters.files.file_storage_port import FileStoragePort


class SyncGCSAdapter(FileStoragePort):
    """
    Synchronous GCS adapter for background workers to avoid event loop issues.
    Restored from previous working implementation.
    """

    def __init__(
        self, bucket: storage.Bucket, service_account_email: str | None = None
    ):
        # Accept bucket instance to align with async adapter pattern
        self.bucket = bucket
        self.service_account_email = service_account_email

    async def generate_upload_url(
        self, resource_path: str, content_type: str, expires_in_minutes: int = 60
    ) -> str:
        """Return a short-lived URL (HTTP PUT) for uploading a file."""
        blob = self.bucket.blob(resource_path)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expires_in_minutes),
            method="PUT",
            content_type=content_type,
        )

    def generate_public_url(self, resource_path: str) -> str:
        """Return a permanent public URL for a file."""
        # Now using public bucket, return public URL instead of signed URL
        return f"https://storage.googleapis.com/{self.bucket.name}/{resource_path}"

    async def revoke_file(self, resource_path: str) -> None:
        """Physically delete a file from GCS."""
        blob = self.bucket.blob(resource_path)
        blob.delete()

    async def get_file_metadata(self, resource_path: str) -> dict:
        """Return basic metadata about a file."""
        blob = self.bucket.blob(resource_path)
        blob.reload()
        return {
            "size": blob.size,
            "content_type": blob.content_type,
            "updated": blob.updated,
        }

    async def upload_bytes(
        self, resource_path: str, data: bytes, content_type: str
    ) -> None:
        """Upload bytes directly to GCS."""
        blob = self.bucket.blob(resource_path)
        blob.upload_from_string(data, content_type=content_type)
