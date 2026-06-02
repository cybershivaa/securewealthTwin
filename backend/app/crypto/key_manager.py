from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from typing import Optional

from ..core.config import get_settings


settings = get_settings()


@dataclass(frozen=True)
class CryptoKeyBundle:
    kyber_public_b64: str
    kyber_private_b64: str
    dilithium_public_b64: str
    dilithium_private_b64: str
    master_key_b64: str


class KeyManager:
    """KeyManager loads and persists server key material.

    Behavior:
    - Prefer environment variables (via `settings`).
    - If missing and running in development, try local file `secrets/keys.json`.
    - KMS integration points are provided as stubs for later implementation.
    """

    def __init__(self) -> None:
        # file path to persist keys locally for dev/testing
        self._local_file = os.environ.get("KEY_MANAGER_FILE", os.path.join(os.getcwd(), "secrets", "keys.json"))

    def load(self) -> CryptoKeyBundle:
        # 1. Try environment/settings
        bundle = self._load_from_settings()
        if bundle:
            return bundle

        # 2. Try KMS (stub)
        bundle = self._load_from_kms()
        if bundle:
            return bundle

        # 3. Try local file
        bundle = self._load_from_file()
        if bundle:
            return bundle

        raise RuntimeError("Missing secure key material in settings, KMS, or local file")

    def rotate(self, bundle: CryptoKeyBundle, persist: bool = True) -> None:
        """Rotate to the provided bundle. Update settings in-memory and optionally persist to local file/KMS."""
        settings.server_kyber_public_b64 = bundle.kyber_public_b64
        settings.server_kyber_private_b64 = bundle.kyber_private_b64
        settings.server_dilithium_public_b64 = bundle.dilithium_public_b64
        settings.server_dilithium_private_b64 = bundle.dilithium_private_b64
        settings.master_key_b64 = bundle.master_key_b64

        if persist:
            # persist to local file for dev and also call KMS stub for production hook
            try:
                self._save_to_file(bundle)
            except Exception:
                # best-effort: do not prevent rotation if file writes fail
                pass
            try:
                self._put_to_kms(bundle)
            except Exception:
                pass

    def _load_from_settings(self) -> Optional[CryptoKeyBundle]:
        vals = {
            "kyber_pub": settings.server_kyber_public_b64,
            "kyber_priv": settings.server_kyber_private_b64,
            "dilithium_pub": settings.server_dilithium_public_b64,
            "dilithium_priv": settings.server_dilithium_private_b64,
            "master": settings.master_key_b64,
        }
        if all(vals.values()):
            self._validate_b64(vals["master"], "MASTER_KEY_B64")
            return CryptoKeyBundle(
                kyber_public_b64=vals["kyber_pub"],
                kyber_private_b64=vals["kyber_priv"],
                dilithium_public_b64=vals["dilithium_pub"],
                dilithium_private_b64=vals["dilithium_priv"],
                master_key_b64=vals["master"],
            )
        return None

    def _load_from_kms(self) -> Optional[CryptoKeyBundle]:
        # Try AWS
        try:
            bundle = self._load_from_aws()
            if bundle:
                return bundle
        except Exception:
            pass

        # Try GCP
        try:
            bundle = self._load_from_gcp()
            if bundle:
                return bundle
        except Exception:
            pass

        # Try Azure
        try:
            bundle = self._load_from_azure()
            if bundle:
                return bundle
        except Exception:
            pass

        return None

    def _load_from_aws(self) -> Optional[CryptoKeyBundle]:
        try:
            import boto3
            from botocore.exceptions import BotoCoreError, ClientError
        except Exception:
            return None

        secret_name = getattr(settings, "aws_secret_name", None)
        region = getattr(settings, "aws_region", None)
        if not secret_name or not region:
            return None

        try:
            client = boto3.client("secretsmanager", region_name=region)
            resp = client.get_secret_value(SecretId=secret_name)
            secret_str = resp.get("SecretString")
            if not secret_str:
                return None
            raw = json.loads(secret_str)
            return CryptoKeyBundle(
                kyber_public_b64=raw["server_kyber_public_b64"],
                kyber_private_b64=raw["server_kyber_private_b64"],
                dilithium_public_b64=raw["server_dilithium_public_b64"],
                dilithium_private_b64=raw["server_dilithium_private_b64"],
                master_key_b64=raw["master_key_b64"],
            )
        except Exception:
            return None

    def _put_to_aws(self, bundle: CryptoKeyBundle) -> None:
        try:
            import boto3
            from botocore.exceptions import ClientError
        except Exception:
            return None

        secret_name = getattr(settings, "aws_secret_name", None)
        region = getattr(settings, "aws_region", None)
        if not secret_name or not region:
            return None

        payload = {
            "server_kyber_public_b64": bundle.kyber_public_b64,
            "server_kyber_private_b64": bundle.kyber_private_b64,
            "server_dilithium_public_b64": bundle.dilithium_public_b64,
            "server_dilithium_private_b64": bundle.dilithium_private_b64,
            "master_key_b64": bundle.master_key_b64,
        }
        try:
            client = boto3.client("secretsmanager", region_name=region)
            try:
                client.put_secret_value(SecretId=secret_name, SecretString=json.dumps(payload))
            except ClientError:
                client.create_secret(Name=secret_name, SecretString=json.dumps(payload))
        except Exception:
            return None

    def _load_from_gcp(self) -> Optional[CryptoKeyBundle]:
        try:
            from google.cloud import secretmanager
        except Exception:
            return None

        secret_name = getattr(settings, "gcp_secret_name", None)
        project = getattr(settings, "gcp_project", None)
        if not secret_name or not project:
            return None
        try:
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{project}/secrets/{secret_name}/versions/latest"
            response = client.access_secret_version(name=name)
            secret_str = response.payload.data.decode("utf-8")
            raw = json.loads(secret_str)
            return CryptoKeyBundle(
                kyber_public_b64=raw["server_kyber_public_b64"],
                kyber_private_b64=raw["server_kyber_private_b64"],
                dilithium_public_b64=raw["server_dilithium_public_b64"],
                dilithium_private_b64=raw["server_dilithium_private_b64"],
                master_key_b64=raw["master_key_b64"],
            )
        except Exception:
            return None

    def _put_to_gcp(self, bundle: CryptoKeyBundle) -> None:
        try:
            from google.cloud import secretmanager
            from google.api_core import exceptions as gcp_ex
        except Exception:
            return None

        secret_name = getattr(settings, "gcp_secret_name", None)
        project = getattr(settings, "gcp_project", None)
        if not secret_name or not project:
            return None

        payload = json.dumps({
            "server_kyber_public_b64": bundle.kyber_public_b64,
            "server_kyber_private_b64": bundle.kyber_private_b64,
            "server_dilithium_public_b64": bundle.dilithium_public_b64,
            "server_dilithium_private_b64": bundle.dilithium_private_b64,
            "master_key_b64": bundle.master_key_b64,
        })
        try:
            client = secretmanager.SecretManagerServiceClient()
            parent = f"projects/{project}"
            try:
                secret = client.create_secret(parent=parent, secret_id=secret_name, secret={"replication":{"automatic":{}}})
                client.add_secret_version(parent=secret.name, payload={"data": payload.encode('utf-8')})
            except gcp_ex.AlreadyExists:
                name = f"projects/{project}/secrets/{secret_name}"
                client.add_secret_version(parent=name, payload={"data": payload.encode('utf-8')})
        except Exception:
            return None

    def _load_from_azure(self) -> Optional[CryptoKeyBundle]:
        try:
            from azure.identity import DefaultAzureCredential
            from azure.keyvault.secrets import SecretClient
        except Exception:
            return None

        vault_url = getattr(settings, "azure_vault_url", None)
        secret_name = getattr(settings, "azure_secret_name", None)
        if not vault_url or not secret_name:
            return None
        try:
            credential = DefaultAzureCredential()
            client = SecretClient(vault_url=vault_url, credential=credential)
            secret = client.get_secret(secret_name)
            raw = json.loads(secret.value)
            return CryptoKeyBundle(
                kyber_public_b64=raw["server_kyber_public_b64"],
                kyber_private_b64=raw["server_kyber_private_b64"],
                dilithium_public_b64=raw["server_dilithium_public_b64"],
                dilithium_private_b64=raw["server_dilithium_private_b64"],
                master_key_b64=raw["master_key_b64"],
            )
        except Exception:
            return None

    def _put_to_azure(self, bundle: CryptoKeyBundle) -> None:
        try:
            from azure.identity import DefaultAzureCredential
            from azure.keyvault.secrets import SecretClient
        except Exception:
            return None

        vault_url = getattr(settings, "azure_vault_url", None)
        secret_name = getattr(settings, "azure_secret_name", None)
        if not vault_url or not secret_name:
            return None
        payload = json.dumps({
            "server_kyber_public_b64": bundle.kyber_public_b64,
            "server_kyber_private_b64": bundle.kyber_private_b64,
            "server_dilithium_public_b64": bundle.dilithium_public_b64,
            "server_dilithium_private_b64": bundle.dilithium_private_b64,
            "master_key_b64": bundle.master_key_b64,
        })
        try:
            credential = DefaultAzureCredential()
            client = SecretClient(vault_url=vault_url, credential=credential)
            try:
                client.set_secret(secret_name, payload)
            except Exception:
                # best-effort
                pass
        except Exception:
            return None

    def _put_to_kms(self, bundle: CryptoKeyBundle) -> None:
        """Attempt to write keys to AWS Secrets Manager when configured.

        This is a best-effort operation and will not raise on failure.
        """
        try:
            import boto3
            from botocore.exceptions import BotoCoreError, ClientError
        except Exception:
            return None

        secret_name = getattr(settings, "aws_secret_name", None)
        region = getattr(settings, "aws_region", None)
        if not secret_name or not region:
            return None

        payload = {
            "server_kyber_public_b64": bundle.kyber_public_b64,
            "server_kyber_private_b64": bundle.kyber_private_b64,
            "server_dilithium_public_b64": bundle.dilithium_public_b64,
            "server_dilithium_private_b64": bundle.dilithium_private_b64,
            "master_key_b64": bundle.master_key_b64,
        }
        try:
            client = boto3.client("secretsmanager", region_name=region)
            # try to update existing secret; if it doesn't exist, create it
            try:
                client.put_secret_value(SecretId=secret_name, SecretString=json.dumps(payload))
            except ClientError:
                client.create_secret(Name=secret_name, SecretString=json.dumps(payload))
        except Exception:
            # swallow errors; persistence is best-effort
            return None

    def _load_from_file(self) -> Optional[CryptoKeyBundle]:
        try:
            if not os.path.exists(self._local_file):
                return None
            with open(self._local_file, "r", encoding="utf-8") as fh:
                raw = json.load(fh)
            return CryptoKeyBundle(
                kyber_public_b64=raw["server_kyber_public_b64"],
                kyber_private_b64=raw["server_kyber_private_b64"],
                dilithium_public_b64=raw["server_dilithium_public_b64"],
                dilithium_private_b64=raw["server_dilithium_private_b64"],
                master_key_b64=raw["master_key_b64"],
            )
        except Exception:
            return None

    def _save_to_file(self, bundle: CryptoKeyBundle) -> None:
        d = {
            "server_kyber_public_b64": bundle.kyber_public_b64,
            "server_kyber_private_b64": bundle.kyber_private_b64,
            "server_dilithium_public_b64": bundle.dilithium_public_b64,
            "server_dilithium_private_b64": bundle.dilithium_private_b64,
            "master_key_b64": bundle.master_key_b64,
        }
        os.makedirs(os.path.dirname(self._local_file), exist_ok=True)
        with open(self._local_file, "w", encoding="utf-8") as fh:
            json.dump(d, fh, separators=(",", ":"))

    @staticmethod
    def _validate_b64(value: str, label: str) -> None:
        try:
            base64.b64decode(value.encode("ascii"), validate=True)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"{label} must be base64 encoded") from exc


KEY_MANAGER = KeyManager()
