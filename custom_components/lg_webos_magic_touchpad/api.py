"""Authenticated Home Assistant API endpoints for the touchpad card."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

COMMANDS = {
    "move",
    "click",
    "type",
    "enter",
    "back",
    "delete",
    "scroll",
    "home",
    "volume_up",
    "volume_down",
    "mute",
}


def async_register_views(hass: HomeAssistant) -> None:
    """Register API views once."""
    if hass.data.setdefault(DOMAIN, {}).get("views_registered"):
        return
    hass.http.register_view(LGTouchpadHealthView())
    hass.http.register_view(LGTouchpadEntryHealthView())
    hass.http.register_view(LGTouchpadCommandView())
    hass.http.register_view(LGTouchpadEntryCommandView())
    hass.data[DOMAIN]["views_registered"] = True


def _bridge_for_entry(hass: HomeAssistant, entry_id: str | None):
    entries = {
        key: value
        for key, value in hass.data.get(DOMAIN, {}).items()
        if key != "views_registered"
    }
    if entry_id:
        runtime = entries.get(entry_id)
        if runtime is None:
            raise web.HTTPNotFound(text="LG webOS Magic Touchpad entry not found")
        return runtime["bridge"]
    if len(entries) == 1:
        return next(iter(entries.values()))["bridge"]
    if not entries:
        raise web.HTTPNotFound(text="LG webOS Magic Touchpad is not configured")
    raise web.HTTPBadRequest(text="Multiple LG TVs configured; set entry_id in the card")


async def _json_payload(request: web.Request) -> dict[str, Any]:
    if request.can_read_body:
        try:
            data = await request.json()
        except ValueError:
            return {}
        if isinstance(data, dict):
            return data
    return {}


async def _async_health(hass: HomeAssistant, entry_id: str | None) -> web.Response:
    bridge = _bridge_for_entry(hass, entry_id)
    if bridge.begin_background_connect():
        async def connect() -> None:
            try:
                await hass.async_add_executor_job(bridge.ensure_connected)
            finally:
                bridge.end_background_connect()

        hass.async_create_task(connect(), name="lg_webos_magic_touchpad_connect")
    return web.json_response(bridge.status())


async def _async_command(
    hass: HomeAssistant, entry_id: str | None, command: str, data: dict[str, Any]
) -> web.Response:
    if command not in COMMANDS:
        raise web.HTTPNotFound(text="Unknown LG webOS Magic Touchpad command")

    bridge = _bridge_for_entry(hass, entry_id)

    def run_command() -> dict[str, Any]:
        if command == "move":
            return bridge.input_command("move", float(data.get("dx", 0)), float(data.get("dy", 0)))
        if command == "click":
            return bridge.input_command("click")
        if command == "type":
            text = str(data.get("text", ""))
            return {"ok": True} if not text else bridge.input_command("type", text)
        if command == "enter":
            return bridge.input_command("enter")
        if command == "back":
            return bridge.input_command("back")
        if command == "delete":
            return bridge.input_command("delete", 1)
        if command == "scroll":
            return bridge.scroll(float(data.get("dy", 0)))
        if command == "home":
            return bridge.home()
        if command == "volume_up":
            return bridge.media_command("volume_up")
        if command == "volume_down":
            return bridge.media_command("volume_down")
        if command == "mute":
            return bridge.media_command("mute", True)
        return {"ok": False, "error": "Unknown command"}

    try:
        result = await hass.async_add_executor_job(run_command)
    except asyncio.CancelledError:
        raise
    except Exception as exc:  # noqa: BLE001
        _LOGGER.exception("Unexpected LG webOS Magic Touchpad API error")
        result = {"ok": False, "error": str(exc)}

    return web.json_response(result, status=200 if result.get("ok") else 503)


class LGTouchpadHealthView(HomeAssistantView):
    """Default health view for one configured TV."""

    url = "/api/lg_webos_magic_touchpad/health"
    name = "api:lg_webos_magic_touchpad:health"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return await _async_health(request.app["hass"], None)


class LGTouchpadEntryHealthView(HomeAssistantView):
    """Health view for a specific config entry."""

    url = "/api/lg_webos_magic_touchpad/{entry_id}/health"
    name = "api:lg_webos_magic_touchpad:entry_health"
    requires_auth = True

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        return await _async_health(request.app["hass"], entry_id)


class LGTouchpadCommandView(HomeAssistantView):
    """Default command view for one configured TV."""

    url = "/api/lg_webos_magic_touchpad/{command}"
    name = "api:lg_webos_magic_touchpad:command"
    requires_auth = True

    async def post(self, request: web.Request, command: str) -> web.Response:
        return await _async_command(request.app["hass"], None, command, await _json_payload(request))


class LGTouchpadEntryCommandView(HomeAssistantView):
    """Command view for a specific config entry."""

    url = "/api/lg_webos_magic_touchpad/{entry_id}/{command}"
    name = "api:lg_webos_magic_touchpad:entry_command"
    requires_auth = True

    async def post(self, request: web.Request, entry_id: str, command: str) -> web.Response:
        return await _async_command(request.app["hass"], entry_id, command, await _json_payload(request))
