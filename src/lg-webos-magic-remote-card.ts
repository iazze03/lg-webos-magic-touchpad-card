import { LitElement, css, html, nothing } from "lit";

type RemoteMode = "keypad" | "touchpad";
type HealthState = "checking" | "connected" | "disconnected";

interface RemoteSource {
  name: string;
  label?: string;
  icon?: string;
  type?: "app" | "source" | "channel" | "command";
  command?: string;
  value?: string;
}

interface RemoteCardConfig {
  type: string;
  title?: string;
  entry_id?: string;
  entity?: string;
  mode?: RemoteMode;
  scale?: number;
  sensitivity?: number;
  show_sources?: boolean;
  show_color_buttons?: boolean;
  show_media_buttons?: boolean;
  sources?: RemoteSource[];
  channels?: RemoteSource[];
}

const DEFAULT_SOURCES: RemoteSource[] = [
  { name: "Netflix", label: "NETFLIX", type: "app" },
  { name: "Prime Video", label: "prime video", type: "app" },
  { name: "YouTube", label: "YouTube", type: "app" },
  { name: "LG Channels", label: "LG Channels", type: "app" },
  { name: "HDMI 1", label: "HDMI 1", type: "source" },
  { name: "HDMI 2", label: "HDMI 2", type: "source" },
];

class LgWebosMagicRemoteCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _mode: { state: true },
    _health: { state: true },
    _error: { state: true },
  };

  hass?: {
    fetchWithAuth?: (path: string, init?: RequestInit) => Promise<Response>;
  };

  private _config!: RemoteCardConfig;
  private _mode: RemoteMode = "keypad";
  private _health: HealthState = "checking";
  private _error = "";
  private _pollTimer?: number;
  private _lastPointer?: { x: number; y: number; time: number };
  private _tapStart?: { x: number; y: number; time: number };
  private _pendingMove = { dx: 0, dy: 0 };
  private _raf?: number;

  static styles = css`
    :host {
      display: block;
      -webkit-tap-highlight-color: transparent;
    }

    ha-card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--primary-text-color);
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 14px;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .title {
      font-size: 17px;
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

    .remote-wrap {
      display: grid;
      place-items: center;
    }

    .remote {
      --remote-scale: 1;
      width: min(100%, calc(224px * var(--remote-scale)));
      max-width: 320px;
      border-radius: 34px;
      padding: calc(14px * var(--remote-scale));
      background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 18%, transparent 82%, rgba(255, 255, 255, 0.08)),
        linear-gradient(180deg, #232323, #070707 52%, #181818);
      border: 1px solid #3c3c3c;
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.15),
        inset 0 -10px 20px rgba(0, 0, 0, 0.42),
        0 18px 40px rgba(0, 0, 0, 0.28);
      box-sizing: border-box;
      color: #f5f5f5;
    }

    .top {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      margin-bottom: 10px;
    }

    .mic {
      justify-self: end;
      color: #b7b7b7;
    }

    .grid {
      display: grid;
      gap: 8px;
    }

    .three {
      grid-template-columns: repeat(3, 1fr);
    }

    .two-side {
      grid-template-columns: 46px 1fr 46px;
      align-items: center;
      margin-top: 12px;
    }

    button {
      position: relative;
      display: inline-grid;
      place-items: center;
      min-width: 0;
      min-height: 0;
      border: 1px solid rgba(255, 255, 255, 0.13);
      color: #f4f4f4;
      background:
        radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.22), transparent 34%),
        linear-gradient(180deg, #3b3b3b, #151515);
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.22),
        inset 0 -4px 8px rgba(0, 0, 0, 0.42),
        0 2px 4px rgba(0, 0, 0, 0.35);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      box-sizing: border-box;
    }

    button:active {
      transform: translateY(1px);
      filter: brightness(1.18);
    }

    ha-icon {
      width: 20px;
      height: 20px;
      color: currentColor;
    }

    .round {
      aspect-ratio: 1;
      border-radius: 999px;
      font-size: 18px;
    }

    .small {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      font-size: 12px;
    }

    .pill {
      height: 86px;
      border-radius: 18px;
      grid-template-rows: 1fr 1px 1fr;
      overflow: hidden;
      padding: 0;
      font-size: 20px;
    }

    .pill span {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
    }

    .pill .sep {
      height: 1px;
      background: rgba(255, 255, 255, 0.16);
    }

    .power {
      color: #ff4f5f;
      width: 40px;
      height: 40px;
      border-color: rgba(255, 79, 95, 0.35);
    }

    .keypad,
    .touchpanel {
      margin-top: 4px;
      margin-bottom: 12px;
    }

    .touchpanel {
      height: 166px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background:
        radial-gradient(circle, rgba(255, 255, 255, 0.18) 1px, transparent 1px),
        linear-gradient(180deg, #282828, #171717);
      background-size: 10px 10px, auto;
      touch-action: none;
      display: grid;
      place-items: end center;
      padding: 9px;
      box-sizing: border-box;
      color: #d9d9d9;
      cursor: crosshair;
    }

    .touchdot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      border: 2px solid #d9d9d9;
      opacity: 0.9;
    }

    .guide-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }

    .center-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 10px;
      align-items: center;
    }

    .wheel {
      position: relative;
      width: 134px;
      height: 134px;
      justify-self: center;
      border-radius: 999px;
      background:
        conic-gradient(from 20deg, #070707, #242424, #080808, #2e2e2e, #070707);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow:
        inset 0 0 16px rgba(255, 255, 255, 0.08),
        inset 0 -18px 26px rgba(0, 0, 0, 0.75);
    }

    .wheel button {
      position: absolute;
      background: transparent;
      border: 0;
      box-shadow: none;
      color: #e8e8e8;
    }

    .wheel .up {
      top: 4px;
      left: 45px;
      width: 44px;
      height: 32px;
    }

    .wheel .down {
      bottom: 4px;
      left: 45px;
      width: 44px;
      height: 32px;
    }

    .wheel .left {
      top: 45px;
      left: 4px;
      width: 32px;
      height: 44px;
    }

    .wheel .right {
      top: 45px;
      right: 4px;
      width: 32px;
      height: 44px;
    }

    .ok {
      top: 43px;
      left: 43px;
      width: 48px;
      height: 48px;
      border-radius: 999px;
      background:
        radial-gradient(circle at 40% 20%, #575757, #1c1c1c 58%, #070707);
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.16);
    }

    .post-wheel {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 48px;
      margin-top: 8px;
    }

    .color-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 12px;
    }

    .color {
      height: 18px;
      border-radius: 999px;
      color: transparent;
    }

    .red {
      background: linear-gradient(#ff6464, #c92231);
    }

    .green {
      background: linear-gradient(#34e08b, #00a866);
    }

    .yellow {
      background: linear-gradient(#ffe77d, #dcb935);
    }

    .blue {
      background: linear-gradient(#56c6ff, #1686d9);
    }

    .sources {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      margin-top: 10px;
      border-radius: 0 0 20px 20px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .source {
      height: 40px;
      border-radius: 0;
      font-size: 11px;
      letter-spacing: 0;
      background: linear-gradient(180deg, #222, #111);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      overflow-wrap: anywhere;
      padding: 0 4px;
    }

    .source.netflix {
      color: #ff3131;
      font-weight: 800;
      font-size: 13px;
    }

    .media-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 7px;
      margin-top: 10px;
    }

    .media-row button {
      height: 32px;
      border-radius: 999px;
    }

    .error {
      margin-top: 10px;
      color: var(--error-color, #db4437);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    @media (max-width: 420px) {
      ha-card {
        padding: 10px;
      }
    }
  `;

  setConfig(config: RemoteCardConfig) {
    this._config = {
      title: "LG Magic Remote",
      mode: "keypad",
      scale: 1,
      sensitivity: 1.3,
      show_sources: true,
      show_color_buttons: true,
      show_media_buttons: false,
      ...config,
    };
    this._mode = this._config.mode ?? "keypad";
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
    const scale = String(Number(this._config.scale ?? 1));
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

        <div class="remote-wrap">
          <div class="remote" style=${`--remote-scale:${scale}`}>
            <div class="top">
              <span></span>
              <button class="round power" title="Power off" @click=${() => this._command("power_off")}>
                <ha-icon icon="mdi:power"></ha-icon>
              </button>
              <ha-icon class="mic" icon="mdi:microphone"></ha-icon>
            </div>

            ${this._mode === "touchpad" ? this._renderTouchPanel() : this._renderKeypad()}

            <div class="guide-row">
              <button class="small" title="Guide" @click=${() => this._command("info")}>GUIDE</button>
              <button class="small" title="Toggle keypad/touchpad" @click=${this._toggleMode}>
                <ha-icon icon=${this._mode === "touchpad" ? "mdi:dialpad" : "mdi:gesture-tap"}></ha-icon>
              </button>
              <button class="small" title="More" @click=${() => this._command("dash")}>•••</button>
            </div>

            <div class="two-side">
              <button class="pill" title="Volume">
                <span @click=${() => this._command("volume_up")}>+</span>
                <span class="sep"></span>
                <span @click=${() => this._command("volume_down")}>−</span>
              </button>
              <div></div>
              <button class="pill" title="Channel">
                <span @click=${() => this._command("channel_up")}>⌃</span>
                <span class="sep"></span>
                <span @click=${() => this._command("channel_down")}>⌄</span>
              </button>
            </div>

            <div class="center-actions">
              <button class="small" title="Home" @click=${() => this._command("home")}>
                <ha-icon icon="mdi:home-outline"></ha-icon>
              </button>
              <button class="small" title="Mute" @click=${() => this._command("mute")}>
                <ha-icon icon="mdi:volume-off"></ha-icon>
              </button>
              <button class="small" title="Input" @click=${() => this._command("source", { source: "HDMI 1" })}>
                <ha-icon icon="mdi:import"></ha-icon>
              </button>
            </div>

            ${this._renderWheel()}

            <div class="post-wheel">
              <button class="small" title="Back" @click=${() => this._command("back")}>
                <ha-icon icon="mdi:arrow-u-left-top"></ha-icon>
              </button>
              <button class="small" title="Settings" @click=${() => this._command("menu")}>
                <ha-icon icon="mdi:cog-outline"></ha-icon>
              </button>
            </div>

            ${this._config.show_color_buttons ? this._renderColorButtons() : nothing}
            ${this._config.show_media_buttons ? this._renderMediaButtons() : nothing}
            ${this._config.show_sources ? this._renderSources() : nothing}
          </div>
        </div>

        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      </ha-card>
    `;
  }

  private _renderKeypad() {
    return html`
      <div class="keypad grid three">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
          (num) => html`<button class="round" @click=${() => this._command(`num_${num}`)}>${num}</button>`,
        )}
        <button class="round" @click=${() => this._command("info")}>GUIDE</button>
        <button class="round" @click=${() => this._command("num_0")}>0</button>
        <button class="round" @click=${() => this._command("dash")}>•••</button>
      </div>
    `;
  }

  private _renderTouchPanel() {
    return html`
      <div
        class="touchpanel"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
        @wheel=${this._onWheel}
      >
        <span class="touchdot"></span>
      </div>
    `;
  }

  private _renderWheel() {
    return html`
      <div class="wheel">
        <button class="up" title="Up" @click=${() => this._command("up")}>
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <button class="left" title="Left" @click=${() => this._command("left")}>
          <ha-icon icon="mdi:chevron-left"></ha-icon>
        </button>
        <button class="ok" title="OK" @click=${() => this._command("ok")}>OK</button>
        <button class="right" title="Right" @click=${() => this._command("right")}>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
        <button class="down" title="Down" @click=${() => this._command("down")}>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </button>
      </div>
    `;
  }

  private _toggleMode() {
    this._mode = this._mode === "touchpad" ? "keypad" : "touchpad";
    this._lastPointer = undefined;
    this._tapStart = undefined;
    this._pendingMove = { dx: 0, dy: 0 };
    this._haptic();
  }

  private _renderColorButtons() {
    return html`
      <div class="color-row">
        <button class="color red" title="Red" @click=${() => this._command("red")}>red</button>
        <button class="color green" title="Green" @click=${() => this._command("green")}>green</button>
        <button class="color yellow" title="Yellow" @click=${() => this._command("yellow")}>yellow</button>
        <button class="color blue" title="Blue" @click=${() => this._command("blue")}>blue</button>
      </div>
    `;
  }

  private _renderMediaButtons() {
    return html`
      <div class="media-row">
        <button title="Rewind" @click=${() => this._command("rewind")}>
          <ha-icon icon="mdi:rewind"></ha-icon>
        </button>
        <button title="Play" @click=${() => this._command("play")}>
          <ha-icon icon="mdi:play"></ha-icon>
        </button>
        <button title="Pause" @click=${() => this._command("pause")}>
          <ha-icon icon="mdi:pause"></ha-icon>
        </button>
        <button title="Stop" @click=${() => this._command("stop")}>
          <ha-icon icon="mdi:stop"></ha-icon>
        </button>
        <button title="Fast forward" @click=${() => this._command("fastforward")}>
          <ha-icon icon="mdi:fast-forward"></ha-icon>
        </button>
      </div>
    `;
  }

  private _renderSources() {
    const items = this._config.sources?.length ? this._config.sources : DEFAULT_SOURCES;
    const channels = this._config.channels ?? [];
    return html`
      <div class="sources">
        ${[...items, ...channels].slice(0, 8).map(
          (source) => html`
            <button
              class="source ${source.name.toLowerCase() === "netflix" ? "netflix" : ""}"
              title=${source.name}
              @click=${() => this._activateSource(source)}
            >
              ${source.icon ? html`<ha-icon icon=${source.icon}></ha-icon>` : source.label ?? source.name}
            </button>
          `,
        )}
      </div>
    `;
  }

  private _activateSource(source: RemoteSource) {
    if (source.type === "command" && source.command) {
      this._command(source.command);
      return;
    }
    if (source.type === "channel") {
      this._command("channel", { number: source.value ?? source.name });
      return;
    }
    if (source.type === "source") {
      this._command("source", { source: source.value ?? source.name });
      return;
    }
    this._command("launch", { app: source.value ?? source.name });
  }

  private _onPointerDown(event: PointerEvent) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this._lastPointer = { x: event.clientX, y: event.clientY, time: Date.now() };
    this._tapStart = this._lastPointer;
  }

  private _onPointerMove(event: PointerEvent) {
    if (!this._lastPointer) return;
    const dx = event.clientX - this._lastPointer.x;
    const dy = event.clientY - this._lastPointer.y;
    this._lastPointer = { x: event.clientX, y: event.clientY, time: Date.now() };
    this._queueMove(dx, dy);
  }

  private _onPointerUp(event: PointerEvent) {
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

  private _onWheel(event: WheelEvent) {
    event.preventDefault();
    this._command("scroll", { dy: Math.round(event.deltaY) }, false);
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

  private async _checkHealth() {
    if (!this._config) return;
    try {
      const response = await this._fetch(`${this._apiBase()}/health`, { cache: "no-store" });
      const data = await response.json();
      this._health = data.connected ? "connected" : data.connecting ? "checking" : "disconnected";
      this._error = data.error && !data.connected ? data.error : "";
    } catch (error) {
      this._health = "disconnected";
      this._setError(error);
    }
  }

  private async _command(path: string, body?: Record<string, unknown>, notify = true): Promise<boolean> {
    try {
      const response = await this._fetch(`${this._apiBase()}/${path}`, {
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
      this._haptic();
      return true;
    } catch (error) {
      this._health = "disconnected";
      this._setError(error, notify);
      return false;
    }
  }

  private _apiBase(): string {
    const entry = this._config.entry_id ? `/${this._config.entry_id}` : "";
    return `/api/lg_webos_magic_touchpad${entry}`;
  }

  private _fetch(path: string, init?: RequestInit): Promise<Response> {
    if (path.startsWith("/api/") && this.hass?.fetchWithAuth) {
      return this.hass.fetchWithAuth(path, init);
    }
    return fetch(path, init);
  }

  private _setError(error: unknown, notify = false) {
    this._error = error instanceof Error ? error.message : String(error);
    if (notify) {
      this.dispatchEvent(
        new CustomEvent("hass-notification", {
          detail: { message: `LG remote: ${this._error}` },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _haptic() {
    if ("vibrate" in navigator) navigator.vibrate(8);
  }

  getCardSize() {
    return 8;
  }
}

if (!customElements.get("lg-webos-magic-remote-card")) {
  customElements.define("lg-webos-magic-remote-card", LgWebosMagicRemoteCard);
}

declare global {
  interface Window {
    customCards?: Array<Record<string, string>>;
  }
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "lg-webos-magic-remote-card")) {
  window.customCards.push({
    type: "lg-webos-magic-remote-card",
    name: "LG webOS Magic Remote Card",
    description: "Full LG Magic Remote control through the Home Assistant integration.",
  });
}
