#!/usr/bin/env python3
"""Local REST bridge for LG webOS Magic Remote pointer control."""

from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Callable

from flask import Flask, jsonify, request
from flask_cors import CORS
from pywebostv.connection import WebOSClient
from pywebostv.controls import InputControl, MediaControl


LOG_LEVEL = os.getenv("LG_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
LOGGER = logging.getLogger("lg-touchpad")


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class LGTouchpadBridge:
    """Keeps a pywebostv connection alive and exposes safe command helpers."""

    def __init__(self) -> None:
        self.tv_ip = os.getenv("LG_TV_IP", "").strip()
        self.keyfile = Path(os.getenv("LG_KEYFILE", "client_key.json")).expanduser()
        self.secure = _env_bool("LG_SECURE", False)
        self.reconnect_interval = float(os.getenv("LG_RECONNECT_INTERVAL", "2"))
        self._lock = threading.RLock()
        self._client: WebOSClient | None = None
        self._input: InputControl | None = None
        self._media: MediaControl | None = None
        self._connected = False
        self._connecting = False
        self._last_error: str | None = None
        self._last_attempt = 0.0

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def last_error(self) -> str | None:
        return self._last_error

    def status(self) -> dict[str, Any]:
        if not self.tv_ip:
            return {
                "ok": True,
                "connected": False,
                "error": "LG_TV_IP is not configured",
            }
        self.ensure_connecting_background()
        return {
            "ok": True,
            "connected": self._connected,
            "tv_ip": self.tv_ip,
            "secure": self.secure,
            "error": self._last_error,
        }

    def ensure_connecting_background(self) -> None:
        with self._lock:
            now = time.monotonic()
            if self._connected or self._connecting:
                return
            if now - self._last_attempt < self.reconnect_interval:
                return
            self._connecting = True

        def connect() -> None:
            try:
                self.ensure_connected(force=True)
            finally:
                with self._lock:
                    self._connecting = False

        threading.Thread(target=connect, name="lg-tv-connect", daemon=True).start()

    def ensure_connected(self, force: bool = False) -> bool:
        if not self.tv_ip:
            self._connected = False
            self._last_error = "LG_TV_IP is not configured"
            return False

        with self._lock:
            now = time.monotonic()
            if self._connected and not force:
                return True
            if not force and now - self._last_attempt < self.reconnect_interval:
                return False

            self._last_attempt = now
            try:
                LOGGER.info("Connecting to LG TV at %s (secure=%s)", self.tv_ip, self.secure)
                self._client = self._make_client()
                self._client.connect()

                store = self._load_store()
                for status in self._client.register(store):
                    LOGGER.info("Registration status: %s", status)
                    if status == WebOSClient.PROMPTED:
                        LOGGER.info("Accept the pairing prompt on the TV.")
                    if status == WebOSClient.REGISTERED:
                        self._save_store(store)

                self._input = InputControl(self._client)
                self._input.connect_input()
                self._media = MediaControl(self._client)
                self._connected = True
                self._last_error = None
                LOGGER.info("Connected to LG TV and pointer input socket is ready.")
                return True
            except Exception as exc:  # noqa: BLE001 - bridge must stay alive
                self._mark_disconnected(exc)
                LOGGER.warning("TV connection failed: %s", exc)
                return False

    def _make_client(self) -> WebOSClient:
        try:
            return WebOSClient(self.tv_ip, secure=self.secure)
        except TypeError:
            if self.secure:
                LOGGER.warning("Installed pywebostv does not accept LG_SECURE; retrying without it.")
            return WebOSClient(self.tv_ip)

    def _load_store(self) -> dict[str, Any]:
        if not self.keyfile.exists():
            return {}
        try:
            import json

            return json.loads(self.keyfile.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            LOGGER.warning("Could not read keyfile %s: %s", self.keyfile, exc)
            return {}

    def _save_store(self, store: dict[str, Any]) -> None:
        try:
            import json

            self.keyfile.parent.mkdir(parents=True, exist_ok=True)
            self.keyfile.write_text(json.dumps(store, indent=2), encoding="utf-8")
        except Exception as exc:  # noqa: BLE001
            LOGGER.warning("Could not write keyfile %s: %s", self.keyfile, exc)

    def _mark_disconnected(self, exc: Exception | str) -> None:
        self._connected = False
        self._last_error = str(exc)
        self._input = None
        self._media = None

    def run(self, action: Callable[[], Any]) -> dict[str, Any]:
        with self._lock:
            if not self.ensure_connected(force=False):
                return {"ok": False, "error": self._last_error or "TV disconnected"}
            try:
                action()
                return {"ok": True}
            except Exception as exc:  # noqa: BLE001
                LOGGER.warning("Command failed, reconnecting once: %s", exc)
                self._mark_disconnected(exc)
                if not self.ensure_connected(force=True):
                    return {"ok": False, "error": self._last_error or str(exc)}
                try:
                    action()
                    return {"ok": True}
                except Exception as retry_exc:  # noqa: BLE001
                    self._mark_disconnected(retry_exc)
                    LOGGER.error("Command failed after reconnect: %s", retry_exc)
                    return {"ok": False, "error": str(retry_exc)}

    def input_command(self, method_name: str, *args: Any) -> dict[str, Any]:
        def action() -> None:
            if self._input is None:
                raise RuntimeError("Input socket is not connected")
            method = getattr(self._input, method_name)
            method(*args)

        return self.run(action)

    def scroll(self, dy: float) -> dict[str, Any]:
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
        def action() -> None:
            if self._media is None:
                raise RuntimeError("Media control is not connected")
            method = getattr(self._media, method_name)
            method(*args)

        return self.run(action)

    def home(self) -> dict[str, Any]:
        return self.input_command("home")


app = Flask(__name__)
CORS(app)
bridge = LGTouchpadBridge()


def _json_response(payload: dict[str, Any], status: int | None = None):
    code = status if status is not None else (200 if payload.get("ok") else 503)
    return jsonify(payload), code


def _payload() -> dict[str, Any]:
    if not request.is_json:
        return {}
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


@app.get("/health")
def health():
    return jsonify(bridge.status())


@app.post("/move")
def move():
    data = _payload()
    dx = float(data.get("dx", 0))
    dy = float(data.get("dy", 0))
    return _json_response(bridge.input_command("move", dx, dy))


@app.post("/click")
def click():
    return _json_response(bridge.input_command("click"))


@app.post("/type")
def type_text():
    text = str(_payload().get("text", ""))
    if not text:
        return _json_response({"ok": True})
    return _json_response(bridge.input_command("type", text))


@app.post("/enter")
def enter():
    return _json_response(bridge.input_command("enter"))


@app.post("/back")
def back():
    return _json_response(bridge.input_command("back"))


@app.post("/delete")
def delete():
    return _json_response(bridge.input_command("delete", 1))


@app.post("/scroll")
def scroll():
    dy = float(_payload().get("dy", 0))
    return _json_response(bridge.scroll(dy))


@app.post("/home")
def home():
    return _json_response(bridge.home())


@app.post("/volume_up")
def volume_up():
    return _json_response(bridge.media_command("volume_up"))


@app.post("/volume_down")
def volume_down():
    return _json_response(bridge.media_command("volume_down"))


@app.post("/mute")
def mute():
    return _json_response(bridge.media_command("mute", True))


if __name__ == "__main__":
    host = os.getenv("LG_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("LG_SERVER_PORT", "5055"))
    cert = os.getenv("LG_SSL_CERT")
    key = os.getenv("LG_SSL_KEY")
    ssl_context = (cert, key) if cert and key else None
    LOGGER.info("Starting LG touchpad server on %s:%s ssl=%s", host, port, bool(ssl_context))
    app.run(host=host, port=port, ssl_context=ssl_context, threaded=True)
