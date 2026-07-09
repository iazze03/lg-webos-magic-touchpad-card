import { LitElement, css, html, nothing } from "lit";

type HealthState = "checking" | "connected" | "disconnected";

interface CardConfig {
  type: string;
  title?: string;
  server: string;
  entity?: string;
  sensitivity?: number;
  show_keyboard?: boolean;
  show_volume?: boolean;
  show_nav_buttons?: boolean;
}

class LgWebosMagicTouchpadCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _health: { state: true },
    _error: { state: true },
    _text: { state: true },
  };

  hass: unknown;
  private _config!: CardConfig;
  private _health: HealthState = "checking";
  private _error = "";
  private _text = "";
  private _pollTimer?: number;
  private _lastPointer?: { x: number; y: number; time: number };
  private _tapStart?: { x: number; y: number; time: number };
  private _raf?: number;
  private _pendingMove = { dx: 0, dy: 0 };
  private _lastTouchDistance?: number;

  static styles = css`
    :host {
      display: block;
      -webkit-tap-highlight-color: transparent;
    }

    ha-card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--primary-text-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
      padding: 16px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .title {
      min-width: 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }

    .entity {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-top: 2px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--secondary-text-color);
      font-size: 12px;
      white-space: nowrap;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: var(--warning-color, #f4b400);
    }

    .connected .dot {
      background: var(--success-color, #43a047);
    }

    .disconnected .dot {
      background: var(--error-color, #db4437);
    }

    .touchpad {
      height: clamp(220px, 42vw, 360px);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background:
        radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--primary-color) 10%, transparent), transparent 34%),
        color-mix(in srgb, var(--ha-card-background, #fff) 92%, var(--primary-text-color));
      touch-action: none;
      user-select: none;
      cursor: crosshair;
      display: grid;
      place-items: center;
      color: var(--secondary-text-color);
      font-size: 13px;
      margin-bottom: 12px;
    }

    .controls,
    .keyboard,
    .volume {
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }

    .controls {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .volume {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .keyboard {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    button,
    input {
      min-height: 42px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      font: inherit;
      color: var(--primary-text-color);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-sizing: border-box;
    }

    button {
      padding: 0 10px;
      cursor: pointer;
      color: var(--primary-color);
      font-weight: 600;
    }

    button:active {
      transform: translateY(1px);
    }

    input {
      width: 100%;
      padding: 0 12px;
      font-size: 16px;
      color: var(--primary-text-color);
    }

    .error {
      margin-top: 10px;
      color: var(--error-color, #db4437);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    @media (max-width: 420px) {
      ha-card {
        padding: 12px;
      }

      .controls {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;

  setConfig(config: CardConfig) {
    if (!config.server) {
      throw new Error("server is required");
    }
    this._config = {
      title: "LG webOS Magic Touchpad",
      sensitivity: 1,
      show_keyboard: true,
      show_volume: true,
      show_nav_buttons: true,
      ...config,
      server: config.server.replace(/\/$/, ""),
    };
    this._checkHealth();
  }

  connectedCallback() {
    super.connectedCallback();
    this._pollTimer = window.setInterval(() => this._checkHealth(), 5000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._pollTimer) window.clearInterval(this._pollTimer);
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  render() {
    if (!this._config) return nothing;
    return html`
      <ha-card>
        <div class="header">
          <div>
            <div class="title">${this._config.title}</div>
            ${this._config.entity ? html`<div class="entity">${this._config.entity}</div>` : nothing}
          </div>
          <div class="status ${this._health}">
            <span class="dot"></span>
            <span>${this._health}</span>
          </div>
        </div>

        <div
          class="touchpad"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          @touchstart=${this._onTouchStart}
          @touchmove=${this._onTouchMove}
          @touchend=${this._onTouchEnd}
          @wheel=${this._onWheel}
        >
          Touchpad
        </div>

        ${this._config.show_nav_buttons
          ? html`
              <div class="controls">
                <button @click=${() => this._command("home")}>Home</button>
                <button @click=${() => this._command("back")}>Back</button>
                <button @click=${() => this._command("enter")}>Enter</button>
                <button @click=${() => this._command("delete")}>Cancella</button>
              </div>
            `
          : nothing}

        ${this._config.show_keyboard
          ? html`
              <div class="keyboard">
                <input
                  .value=${this._text}
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  inputmode="text"
                  @input=${this._onInput}
                  @keydown=${this._onKeyDown}
                />
                <button @click=${this._sendText}>Invia</button>
              </div>
            `
          : nothing}

        ${this._config.show_volume
          ? html`
              <div class="volume">
                <button @click=${() => this._command("volume_down")}>Vol -</button>
                <button @click=${() => this._command("mute")}>Mute</button>
                <button @click=${() => this._command("volume_up")}>Vol +</button>
              </div>
            `
          : nothing}

        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      </ha-card>
    `;
  }

  private _onPointerDown(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this._lastPointer = { x: event.clientX, y: event.clientY, time: Date.now() };
    this._tapStart = this._lastPointer;
  }

  private _onPointerMove(event: PointerEvent) {
    if (event.pointerType === "touch" || !this._lastPointer) return;
    const dx = event.clientX - this._lastPointer.x;
    const dy = event.clientY - this._lastPointer.y;
    this._lastPointer = { x: event.clientX, y: event.clientY, time: Date.now() };
    this._queueMove(dx, dy);
  }

  private _onPointerUp(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    if (this._tapStart) {
      const distance = Math.hypot(event.clientX - this._tapStart.x, event.clientY - this._tapStart.y);
      if (distance < 8 && Date.now() - this._tapStart.time < 280) {
        this._command("click");
        this._haptic();
      }
    }
    this._lastPointer = undefined;
    this._tapStart = undefined;
  }

  private _onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this._lastPointer = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      this._tapStart = this._lastPointer;
      this._lastTouchDistance = undefined;
    } else if (event.touches.length === 2) {
      this._lastPointer = undefined;
      this._tapStart = undefined;
      this._lastTouchDistance = this._touchCenterY(event);
    }
  }

  private _onTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 1 && this._lastPointer) {
      const touch = event.touches[0];
      const dx = touch.clientX - this._lastPointer.x;
      const dy = touch.clientY - this._lastPointer.y;
      this._lastPointer = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      this._queueMove(dx, dy);
    } else if (event.touches.length === 2) {
      const centerY = this._touchCenterY(event);
      if (this._lastTouchDistance !== undefined) {
        this._scroll(centerY - this._lastTouchDistance);
      }
      this._lastTouchDistance = centerY;
    }
  }

  private _onTouchEnd(event: TouchEvent) {
    if (event.touches.length > 0) return;
    if (this._tapStart && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const distance = Math.hypot(touch.clientX - this._tapStart.x, touch.clientY - this._tapStart.y);
      if (distance < 10 && Date.now() - this._tapStart.time < 280) {
        this._command("click");
        this._haptic();
      }
    }
    this._lastPointer = undefined;
    this._tapStart = undefined;
    this._lastTouchDistance = undefined;
  }

  private _touchCenterY(event: TouchEvent): number {
    return (event.touches[0].clientY + event.touches[1].clientY) / 2;
  }

  private _onWheel(event: WheelEvent) {
    event.preventDefault();
    this._scroll(event.deltaY);
  }

  private _queueMove(dx: number, dy: number) {
    const sensitivity = Number(this._config.sensitivity ?? 1);
    this._pendingMove.dx += dx * sensitivity;
    this._pendingMove.dy += dy * sensitivity;
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = undefined;
      const payload = { dx: Math.round(this._pendingMove.dx), dy: Math.round(this._pendingMove.dy) };
      this._pendingMove = { dx: 0, dy: 0 };
      if (payload.dx || payload.dy) this._command("move", payload, false);
    });
  }

  private _scroll(dy: number) {
    if (Math.abs(dy) < 1) return;
    this._command("scroll", { dy: Math.round(dy) }, false);
  }

  private _onInput(event: Event) {
    this._text = (event.target as HTMLInputElement).value;
  }

  private async _onKeyDown(event: KeyboardEvent) {
    if (event.key === "Backspace") {
      this._command("delete", undefined, false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      await this._sendText();
      await this._command("enter");
    }
  }

  private async _sendText() {
    const text = this._text;
    if (!text) return;
    const result = await this._command("type", { text });
    if (result) this._text = "";
  }

  private async _checkHealth() {
    if (!this._config?.server) return;
    try {
      const response = await fetch(`${this._config.server}/health`, { cache: "no-store" });
      const data = await response.json();
      this._health = data.connected ? "connected" : "disconnected";
      this._error = data.error && !data.connected ? data.error : "";
    } catch (error) {
      this._health = "disconnected";
      this._setError(error);
    }
  }

  private async _command(path: string, body?: Record<string, unknown>, notify = true): Promise<boolean> {
    try {
      const response = await fetch(`${this._config.server}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await response.json().catch(() => ({ ok: response.ok }));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `${path} failed`);
      }
      this._error = "";
      this._health = "connected";
      return true;
    } catch (error) {
      this._health = "disconnected";
      this._setError(error, notify);
      return false;
    }
  }

  private _setError(error: unknown, notify = false) {
    this._error = error instanceof Error ? error.message : String(error);
    if (notify) {
      this.dispatchEvent(
        new CustomEvent("hass-notification", {
          detail: { message: `LG touchpad: ${this._error}` },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _haptic() {
    if ("vibrate" in navigator) navigator.vibrate(10);
  }

  getCardSize() {
    return 5;
  }
}

customElements.define("lg-webos-magic-touchpad-card", LgWebosMagicTouchpadCard);

declare global {
  interface Window {
    customCards?: Array<Record<string, string>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "lg-webos-magic-touchpad-card",
  name: "LG webOS Magic Touchpad Card",
  description: "Control LG webOS Magic Remote pointer from Home Assistant.",
});
