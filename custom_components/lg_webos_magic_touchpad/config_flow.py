"""Config flow for LG webOS Magic Touchpad."""

from __future__ import annotations

import ipaddress
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_HOST
from homeassistant.core import callback

from .const import CONF_SECURE, DEFAULT_SECURE, DOMAIN


def _normalize_host(value: str) -> str:
    host = value.strip()
    if not host:
        raise vol.Invalid("host_required")
    try:
        return str(ipaddress.ip_address(host))
    except ValueError:
        return host


class LGWebOSMagicTouchpadConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        errors: dict[str, str] = {}

        if user_input is not None:
            try:
                host = _normalize_host(user_input[CONF_HOST])
            except vol.Invalid:
                errors[CONF_HOST] = "invalid_host"
            else:
                await self.async_set_unique_id(host)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=f"LG TV {host}",
                    data={
                        CONF_HOST: host,
                        CONF_SECURE: DEFAULT_SECURE,
                    },
                )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required(CONF_HOST): str}),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        return LGWebOSMagicTouchpadOptionsFlow(config_entry)


class LGWebOSMagicTouchpadOptionsFlow(config_entries.OptionsFlow):
    """Handle options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current_secure = self.config_entry.options.get(
            CONF_SECURE, self.config_entry.data.get(CONF_SECURE, DEFAULT_SECURE)
        )
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {vol.Optional(CONF_SECURE, default=current_secure): bool}
            ),
        )
