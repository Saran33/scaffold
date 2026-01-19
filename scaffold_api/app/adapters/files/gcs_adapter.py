from gcloud.aio.storage import Bucket

from app.adapters.files.file_storage_port import FileStoragePort


class GCSAdapter(FileStoragePort):
    """
    A repository/adapter that encapsulates GCS upload logic
    using gcloud-aio Bucket async operations.
    """

    def __init__(
        self, bucket: Bucket, service_account_email: str | None = None
    ) -> None:
        self.bucket = bucket
        self.service_account_email = service_account_email

    async def generate_upload_url(
        self, resource_path: str, content_type: str, expires_in_minutes: int = 60
    ) -> str:
        """
        Return a short-lived URL (HTTP PUT) for uploading a file.
        """
        # Create a blob instance for a file that doesn't exist yet
        blob = self.bucket.new_blob(resource_path)
        return await blob.get_signed_url(
            expiration=expires_in_minutes * 60,
            http_method="PUT",
            headers={"content-type": content_type},
            service_account_email=self.service_account_email,
        )

    def generate_public_url(self, resource_path: str) -> str:
        """
        Return a permanent public URL for a file.
        File must have been uploaded with public-read ACL.
        """
        return f"https://storage.googleapis.com/{self.bucket.name}/{resource_path}"

    async def revoke_file(self, resource_path: str) -> None:
        """
        Physically delete a file from GCS.
        """
        await self.bucket.storage.delete(
            bucket=self.bucket.name, object_name=resource_path
        )

    async def get_file_metadata(self, resource_path: str) -> dict:
        """
        Return basic metadata about a file, e.g. size, content type, etc.
        """
        metadata = await self.bucket.storage.download_metadata(
            bucket=self.bucket.name, object_name=resource_path
        )
        return {
            "size": metadata.get("size", 0),
            "content_type": metadata.get("contentType", "application/octet-stream"),
            "updated": metadata.get("updated"),
        }

    async def upload_bytes(
        self, resource_path: str, data: bytes, content_type: str
    ) -> None:
        """
        Upload bytes directly to GCS using gcloud-aio.
        """
        await self.bucket.storage.upload(
            bucket=self.bucket.name,
            object_name=resource_path,
            file_data=data,
            content_type=content_type,
        )
