"""Synchronous pywebostv bridge used by the Home Assistant API views."""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any, Callable

from pywebostv.connection import WebOSClient
from pywebostv.controls import ApplicationControl, InputControl, MediaControl

_LOGGER = logging.getLogger(__name__)


class LGWebOSMagicTouchpadBridge:
    """Maintain a TV connection and expose pointer/media commands."""

    def __init__(self, host: str, keyfile: Path, secure: bool = False) -> None:
        self.host = host
        self.keyfile = keyfile
        self.secure = secure
        self._lock = threading.RLock()
        self._client: WebOSClient | None = None
        self._input: InputControl | None = None
        self._media: MediaControl | None = None
        self._app: ApplicationControl | None = None
        self._connected = False
        self._connecting = False
        self._last_error: str | None = None

    @property
    def connected(self) -> bool:
        """Return current connection state."""
        return self._connected

    @property
    def last_error(self) -> str | None:
        """Return last connection or command error."""
        return self._last_error

    def status(self) -> dict[str, Any]:
        """Return cached status without blocking Home Assistant."""
        return {
            "ok": True,
            "connected": self._connected,
            "connecting": self._connecting,
            "host": self.host,
            "secure": self.secure,
            "error": self._last_error,
        }

    def begin_background_connect(self) -> bool:
        """Mark a background connection attempt as started."""
        with self._lock:
            if self._connected or self._connecting:
                return False
            self._connecting = True
            return True

    def end_background_connect(self) -> None:
        """Mark a background connection attempt as finished."""
        with self._lock:
            self._connecting = False

    def disconnect(self) -> None:
        """Drop local references to force a fresh connection next time."""
        with self._lock:
            self._connected = False
            self._connecting = False
            self._input = None
            self._media = None
            self._app = None
            self._client = None

    def ensure_connected(self, force: bool = False) -> bool:
        """Connect and pair with the TV when needed."""
        with self._lock:
            if self._connected and not force:
                return True
            try:
                _LOGGER.info("Connecting to LG webOS TV at %s (secure=%s)", self.host, self.secure)
                client = self._make_client()
                client.connect()

                store = self._load_store()
                for status in client.register(store):
                    _LOGGER.info("LG webOS registration status: %s", status)
                    if status == WebOSClient.PROMPTED:
                        _LOGGER.info("Accept the pairing prompt on the TV.")
                    if status == WebOSClient.REGISTERED:
                        self._save_store(store)

                input_control = InputControl(client)
                input_control.connect_input()

                self._client = client
                self._input = input_control
                self._media = MediaControl(client)
                self._app = ApplicationControl(client)
                self._connected = True
                self._connecting = False
                self._last_error = None
                return True
            except Exception as exc:  # noqa: BLE001
                self._mark_disconnected(exc)
                _LOGGER.warning("Could not connect to LG webOS TV %s: %s", self.host, exc)
                return False

    def _make_client(self) -> WebOSClient:
        try:
            return WebOSClient(self.host, secure=self.secure)
        except TypeError:
            if self.secure:
                _LOGGER.warning("Installed pywebostv does not support secure=; retrying default client.")
            return WebOSClient(self.host)

    def _load_store(self) -> dict[str, Any]:
        if not self.keyfile.exists():
            return {}
        try:
            return json.loads(self.keyfile.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            _LOGGER.warning("Could not read LG webOS keyfile %s: %s", self.keyfile, exc)
            return {}

    def _save_store(self, store: dict[str, Any]) -> None:
        try:
            self.keyfile.parent.mkdir(parents=True, exist_ok=True)
            self.keyfile.write_text(json.dumps(store, indent=2), encoding="utf-8")
        except OSError as exc:
            _LOGGER.warning("Could not write LG webOS keyfile %s: %s", self.keyfile, exc)

    def _mark_disconnected(self, exc: Exception | str) -> None:
        self._connected = False
        self._connecting = False
        self._last_error = str(exc)
        self._input = None
        self._media = None
        self._app = None
        self._client = None

    def run(self, action: Callable[[], Any]) -> dict[str, Any]:
        """Run a command, reconnecting once on failure."""
        with self._lock:
            if not self.ensure_connected(force=False):
                return {"ok": False, "error": self._last_error or "TV disconnected"}
            try:
                action()
                return {"ok": True}
            except Exception as exc:  # noqa: BLE001
                _LOGGER.warning("LG webOS command failed, reconnecting once: %s", exc)
                self._mark_disconnected(exc)
                if not self.ensure_connected(force=True):
                    return {"ok": False, "error": self._last_error or str(exc)}
                try:
                    action()
                    return {"ok": True}
                except Exception as retry_exc:  # noqa: BLE001
                    self._mark_disconnected(retry_exc)
                    _LOGGER.error("LG webOS command failed after reconnect: %s", retry_exc)
                    return {"ok": False, "error": str(retry_exc)}

    def input_command(self, method_name: str, *args: Any) -> dict[str, Any]:
        """Run an InputControl command."""

        def action() -> None:
            if self._input is None:
                raise RuntimeError("Input socket is not connected")
            getattr(self._input, method_name)(*args)

        return self.run(action)

    def scroll(self, dy: float) -> dict[str, Any]:
        """Scroll through InputControl or pointer socket fallback."""

        def action() -> None:
            if self._input is None:
                raise RuntimeError("Input socket is not connected")
            if hasattr(self._input, "scroll"):
                self._input.scroll(0, int(dy))
            elif hasattr(self._input, "send"):
                self._input.send(f"type:scroll\ndx:0\ndy:{int(dy)}\n\n")
            else:
                raise RuntimeError("Scroll is not supported by this pywebostv version")

        return self.run(action)

    def media_command(self, method_name: str, *args: Any) -> dict[str, Any]:
        """Run a MediaControl command."""

        def action() -> None:
            if self._media is None:
                raise RuntimeError("Media control is not connected")
            getattr(self._media, method_name)(*args)

        return self.run(action)

    def home(self) -> dict[str, Any]:
        """Open the webOS home app."""

        def action() -> None:
            if self._app is None:
                raise RuntimeError("Application control is not connected")
            self._app.launch("com.webos.app.home")

        return self.run(action)
