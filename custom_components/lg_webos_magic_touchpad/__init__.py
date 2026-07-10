"""LG webOS Magic Touchpad integration."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST
from homeassistant.core import HomeAssistant

from .api import async_register_views
from .bridge import LGWebOSMagicTouchpadBridge
from .const import CARD_FILENAME, CARD_URL, CONF_SECURE, DEFAULT_SECURE, DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up static frontend and API views."""
    hass.data.setdefault(DOMAIN, {})
    await _async_register_static_card(hass)
    _register_frontend_module(hass)
    async_register_views(hass)
    await _async_register_lovelace_resource(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up an LG TV touchpad entry."""
    hass.data.setdefault(DOMAIN, {})
    keyfile = Path(hass.config.path(".storage", DOMAIN, f"{entry.entry_id}.json"))
    bridge = LGWebOSMagicTouchpadBridge(
        host=entry.data[CONF_HOST],
        keyfile=keyfile,
        secure=entry.options.get(CONF_SECURE, entry.data.get(CONF_SECURE, DEFAULT_SECURE)),
    )
    hass.data[DOMAIN][entry.entry_id] = {"bridge": bridge}
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload an entry."""
    runtime = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if runtime:
        await hass.async_add_executor_job(runtime["bridge"].disconnect)
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_static_card(hass: HomeAssistant) -> None:
    card_path = Path(__file__).parent / "www" / CARD_FILENAME
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_URL, str(card_path), True)]
        )
    except RuntimeError:
        _LOGGER.debug("LG webOS Magic Touchpad static path already registered")


def _register_frontend_module(hass: HomeAssistant) -> None:
    """Load the bundled card in the Home Assistant frontend."""
    try:
        frontend.add_extra_js_url(hass, CARD_URL)
        _LOGGER.debug("Registered LG webOS Magic Touchpad frontend module %s", CARD_URL)
    except Exception as exc:  # noqa: BLE001
        _LOGGER.debug("Could not register frontend module %s: %s", CARD_URL, exc)


async def _async_register_lovelace_resource(hass: HomeAssistant) -> None:
    """Best-effort Lovelace resource registration for the bundled card."""
    try:
        from homeassistant.components.lovelace import LovelaceData
        from homeassistant.components.lovelace.const import DOMAIN as LOVELACE_DOMAIN
    except ImportError:
        return

    lovelace = hass.data.get(LOVELACE_DOMAIN)
    if not isinstance(lovelace, LovelaceData):
        return

    try:
        resources = lovelace.resources
        current = await resources.async_get_info()
        if any(item.get("url") == CARD_URL for item in current.get("resources", [])):
            return
        await resources.async_create_item({"res_type": "module", "url": CARD_URL})
        _LOGGER.info("Registered Lovelace resource %s", CARD_URL)
    except Exception as exc:  # noqa: BLE001
        _LOGGER.debug("Could not auto-register Lovelace resource: %s", exc)
