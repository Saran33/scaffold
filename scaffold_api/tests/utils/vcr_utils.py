"""VCR utilities for image generation tests to handle large image bytes."""

import base64
import json
import re
from typing import Any
from urllib.parse import parse_qs, urlparse


def filter_ai_provider_headers(response: dict[str, Any]):
    if response["headers"].get("openai-organization"):
        response["headers"]["openai-organization"] = ["DUMMY"]
    if response["headers"].get("anthropic-organization-id"):
        response["headers"]["anthropic-organization-id"] = ["DUMMY"]
    if response["headers"].get("llm_provider-openai-organization"):
        response["headers"]["llm_provider-openai-organization"] = ["DUMMY"]

    return response


def filter_image_resp(response: dict[str, Any]) -> dict[str, Any]:
    response = filter_ai_provider_headers(response)
    # Filter out large image bytes to prevent massive cassette files
    return filter_image_bytes_from_response(response)


def filter_audio_resp(response: dict[str, Any]) -> dict[str, Any]:
    response = filter_ai_provider_headers(response)
    # Filter out large audio bytes to prevent massive cassette files
    return filter_audio_bytes_from_response(response)


def create_minimal_image_bytes() -> bytes:
    """Create minimal valid image bytes for testing (1x1 PNG)."""
    # Minimal 1x1 transparent PNG (67 bytes)
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )


def create_minimal_audio_bytes() -> bytes:
    """Create minimal valid audio bytes for testing (minimal WAV)."""
    # Minimal WAV file (44 bytes header + minimal data)
    # This creates a valid WAV file with 1 sample at 8kHz mono
    wav_header = (
        b"RIFF"  # RIFF header
        b"\x2c\x00\x00\x00"  # File size (44 bytes total)
        b"WAVE"  # WAVE header
        b"fmt "  # fmt chunk header
        b"\x10\x00\x00\x00"  # fmt chunk size (16)
        b"\x01\x00"  # Audio format (PCM)
        b"\x01\x00"  # Number of channels (mono)
        b"\x40\x1f\x00\x00"  # Sample rate (8000 Hz)
        b"\x80\x3e\x00\x00"  # Byte rate (16000)
        b"\x02\x00"  # Block align (2)
        b"\x10\x00"  # Bits per sample (16)
        b"data"  # data chunk header
        b"\x08\x00\x00\x00"  # data chunk size (8 bytes)
        b"\x00\x00\x00\x00\x00\x00\x00\x00"  # 4 samples of silence
    )
    return wav_header


def filter_image_bytes_from_response(response: dict[str, Any]) -> dict[str, Any]:
    """
    VCR before_record_response filter to replace large image bytes with minimal test data.

    This prevents VCR cassettes from containing massive image data that would:
    - Make cassette files too large to open in IDEs
    - Slow down test execution
    - Waste storage space

    Args:
        response: VCR response dict with 'body' containing the HTTP response

    Returns:
        Modified response with minimal image bytes
    """
    if not response.get("body"):
        return response

    body = response["body"]

    # Get headers and content type
    headers = {
        k.lower(): v[0] if isinstance(v, list) else v
        for k, v in response.get("headers", {}).items()
    }
    content_type = headers.get("content-type", "")

    # Fast-path: skip if not image content or potential image generation JSON
    is_direct_image = "image" in content_type or "octet-stream" in content_type

    if not (is_direct_image):
        return response

    # Handle VCR body structure: {'string': bytes} or {'string': str}
    if isinstance(body, dict) and "string" in body:
        body_content = body["string"]

        # Handle binary content
        if isinstance(body_content, bytes):
            # If Content-Type is JSON, try to decode and filter JSON structure
            if "json" in content_type:
                try:
                    # Try to decode gzipped JSON first (common with API responses)
                    import gzip

                    try:
                        decompressed = gzip.decompress(body_content).decode("utf-8")
                        body_json = json.loads(decompressed)
                        modified = _filter_json_image_data(body_json)
                        if modified != body_json:
                            # Re-compress the modified JSON
                            modified_json = json.dumps(modified).encode("utf-8")
                            response["body"]["string"] = gzip.compress(modified_json)
                        return response
                    except (gzip.BadGzipFile, UnicodeDecodeError):
                        # Not gzipped, try direct decode
                        decompressed = body_content.decode("utf-8")
                        body_json = json.loads(decompressed)
                        modified = _filter_json_image_data(body_json)
                        if modified != body_json:
                            response["body"]["string"] = json.dumps(modified).encode(
                                "utf-8"
                            )
                        return response
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass  # Fall through to original binary handling

            # Handle actual binary image responses (not JSON)
            if len(body_content) > 1000:  # Assume large responses are images
                response["body"]["string"] = create_minimal_image_bytes()
            return response

        # Handle string content (JSON/text)
        if isinstance(body_content, str):
            try:
                # Try to parse as JSON to handle base64 encoded images
                body_json = json.loads(body_content)
                modified = _filter_json_image_data(body_json)
                if modified != body_json:
                    response["body"]["string"] = json.dumps(modified)
            except (json.JSONDecodeError, TypeError):
                # Handle text responses with base64 data
                response["body"]["string"] = _filter_text_image_data(body_content)
        return response

    # Handle direct binary responses (raw image bytes)
    if isinstance(body, bytes):
        # If it's image data (detect by size and common headers), replace with minimal
        if len(body) > 1000:  # Assume large responses are images
            response["body"] = create_minimal_image_bytes()
        return response

    # Handle direct string responses (JSON/text)
    if isinstance(body, str):
        try:
            # Try to parse as JSON to handle base64 encoded images
            body_json = json.loads(body)
            modified = _filter_json_image_data(body_json)
            if modified != body_json:
                response["body"] = json.dumps(modified)
        except (json.JSONDecodeError, TypeError):
            # Handle text responses with base64 data
            response["body"] = _filter_text_image_data(body)

    return response


def filter_audio_bytes_from_response(response: dict[str, Any]) -> dict[str, Any]:
    """
    VCR before_record_response filter to replace large audio bytes with minimal test data.

    This prevents VCR cassettes from containing massive audio data that would:
    - Make cassette files too large to open in IDEs
    - Slow down test execution
    - Waste storage space

    Args:
        response: VCR response dict with 'body' containing the HTTP response

    Returns:
        Modified response with minimal audio bytes
    """
    if not response.get("body"):
        return response

    body = response["body"]

    # Get headers and content type
    headers = {
        k.lower(): v[0] if isinstance(v, list) else v
        for k, v in response.get("headers", {}).items()
    }
    content_type = headers.get("content-type", "")

    # Fast-path: skip if not audio content
    is_direct_audio = any(
        audio_type in content_type
        for audio_type in ["audio", "application/octet-stream"]
    )

    if not is_direct_audio:
        return response

    # Handle VCR body structure: {'string': bytes} or {'string': str}
    if isinstance(body, dict) and "string" in body:
        body_content = body["string"]

        # Handle binary content
        if isinstance(body_content, bytes):
            # Handle actual binary audio responses
            if len(body_content) > 1000:  # Assume large responses are audio
                response["body"]["string"] = create_minimal_audio_bytes()
            return response

    # Handle direct binary responses (raw audio bytes)
    if isinstance(body, bytes):
        # If it's audio data (detect by size), replace with minimal
        if len(body) > 1000:  # Assume large responses are audio
            response["body"] = create_minimal_audio_bytes()
        return response

    return response


def _filter_json_image_data(data: Any) -> Any:
    """Recursively filter base64 image data from JSON structures."""
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if isinstance(value, str) and _is_base64_image(key, value):
                # Replace with minimal base64 encoded image
                result[key] = base64.b64encode(create_minimal_image_bytes()).decode(
                    "utf-8"
                )
            else:
                result[key] = _filter_json_image_data(value)
        return result
    if isinstance(data, list):
        return [_filter_json_image_data(item) for item in data]
    return data


def _filter_text_image_data(text: str) -> str:
    """Filter base64 image data from text responses."""
    # Pattern to match long base64 strings (likely images)
    base64_pattern = re.compile(r'(["\']?)([A-Za-z0-9+/]{100,}={0,2})\1')

    def replace_long_base64(match):
        quote = match.group(1)
        # Replace with minimal base64 image
        minimal_b64 = base64.b64encode(create_minimal_image_bytes()).decode("utf-8")
        return f"{quote}{minimal_b64}{quote}"

    return base64_pattern.sub(replace_long_base64, text)


def _is_base64_image(key: str, value: str) -> bool:
    """Check if a key-value pair likely contains base64 image data."""
    # Common keys that contain base64 image data
    image_keys = {
        "b64_json",
        "image",
        "data",
        "base64",
        "content",
        "result",
        "output",
        "generated_image",
        "image_data",
    }

    # Check if key suggests image data and value looks like base64
    return bool(
        any(img_key in key.lower() for img_key in image_keys)
        and (
            isinstance(value, str)
            and len(value) > 100
            and re.match(r"^[A-Za-z0-9+/]+={0,2}$", value)
        )
    )


def query_without_token(r1, r2):
    """
    Custom VCR matcher that compares query parameters while ignoring dynamic tokens.

    This matcher is specifically designed for Civitai API requests that contain
    dynamic JWT tokens in the query string that change between test runs.

    Args:
        r1, r2: VCR request objects to compare

    Returns:
        bool: True if requests match (ignoring token parameter), False otherwise
    """
    # Parse URLs
    parsed1 = urlparse(r1.uri)
    parsed2 = urlparse(r2.uri)

    # Parse query parameters
    query1 = parse_qs(parsed1.query)
    query2 = parse_qs(parsed2.query)

    # Remove token parameter from both queries for comparison
    query1_filtered = {k: v for k, v in query1.items() if k != "token"}
    query2_filtered = {k: v for k, v in query2.items() if k != "token"}

    # Compare filtered query parameters
    return query1_filtered == query2_filtered


match_on_query_without_token = [
    "method",
    "scheme",
    "host",
    "port",
    "path",
    "query_without_token",
]
