from typing import Protocol


class FileStoragePort(Protocol):
    """
    File storage adapter interface.
    """

    async def generate_upload_url(
        self, resource_path: str, content_type: str, expires_in_minutes: int = 60
    ) -> str:
        """
        Return a short-lived URL that the client can use to upload data (e.g. PUT).
        """
        ...

    def generate_public_url(self, resource_path: str) -> str:
        """
        Return a public URL for a file.
        """
        ...

    async def revoke_file(self, resource_path: str) -> None:
        """
        Delete or revoke the file from storage
        """
        ...

    async def get_file_metadata(self, resource_path: str) -> dict:
        """
        (Optional) Retrieve metadata such as size, content type, last updated, etc.
        """
        ...

    async def upload_bytes(
        self, resource_path: str, data: bytes, content_type: str
    ) -> None:
        """
        Upload bytes directly to storage.
        """
        ...
