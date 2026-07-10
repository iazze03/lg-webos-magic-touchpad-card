# LG webOS Magic Touchpad

Custom integration Home Assistant installabile via HACS per controllare il puntatore mouse delle TV LG webOS/Magic Remote da Lovelace.

L'esperienza principale è ora tutta dentro Home Assistant:

- installazione HACS come integrazione;
- configurazione guidata da UI;
- richiesto solo l'indirizzo IP della TV;
- backend locale eseguito da Home Assistant;
- frontend Lovelace incluso nell'integrazione;
- nessun server esterno, iframe, CORS o problema mixed content.

## Funzioni

- Movimento puntatore Magic Remote.
- Tap/click.
- Scroll con due dita o rotella mouse.
- Inserimento testo.
- Enter, Back, Delete.
- Home, Volume +, Volume -, Mute.
- Stato connected/disconnected.
- Riconnessione automatica se la TV o il socket input cadono.
- Pairing LG webOS con salvataggio chiave in `.storage`.

## Installazione via HACS

1. Apri HACS in Home Assistant.
2. Vai in `Custom repositories`.
3. Aggiungi:

```text
iazze03/lg-webos-magic-touchpad-card
```

4. Categoria: `Integration`.
5. Installa `LG webOS Magic Touchpad`.
6. Riavvia Home Assistant.

## Configurazione Guidata

1. Vai in `Impostazioni` → `Dispositivi e servizi`.
2. Premi `Aggiungi integrazione`.
3. Cerca `LG webOS Magic Touchpad`.
4. Inserisci solo l'indirizzo IP della TV.
5. Salva.

Alla prima connessione la TV può mostrare una richiesta di pairing. Accettala con il telecomando LG. La chiave viene salvata da Home Assistant in:

```text
config/.storage/lg_webos_magic_touchpad/<entry_id>.json
```

## Card Lovelace

Config minima:

```yaml
type: custom:lg-webos-magic-touchpad-card
title: TV Salone
```

Config completa:

```yaml
type: custom:lg-webos-magic-touchpad-card
title: TV Salone
entity: media_player.tv_salone
sensitivity: 1.7
show_keyboard: true
show_volume: true
show_nav_buttons: true
```

Se configuri più TV, indica l'`entry_id` dell'integrazione nella card:

```yaml
type: custom:lg-webos-magic-touchpad-card
title: TV Camera
entry_id: 01JZEXAMPLEENTRYID
```

Con una sola TV configurata non serve `entry_id`.

## Risorsa Frontend

L'integrazione prova a registrare automaticamente la risorsa Lovelace:

```text
/lg_webos_magic_touchpad/lg-webos-magic-touchpad-card.js
```

Se la card non appare nel selettore, aggiungila manualmente in `Impostazioni` → `Dashboard` → menu `Risorse`:

```yaml
url: /lg_webos_magic_touchpad/lg-webos-magic-touchpad-card.js
type: module
```

## Uso

- Trascina sull'area touchpad per muovere il puntatore.
- Tap sull'area touchpad per click.
- Due dita su mobile per scroll.
- Rotella mouse per scroll.
- Il campo testo invia testo alla TV.
- Backspace della tastiera locale chiama Delete sulla TV.
- Enter invia il testo presente e poi chiama Enter.

## API Interna Home Assistant

La card usa endpoint autenticati di Home Assistant:

- `GET /api/lg_webos_magic_touchpad/health`
- `POST /api/lg_webos_magic_touchpad/move`
- `POST /api/lg_webos_magic_touchpad/click`
- `POST /api/lg_webos_magic_touchpad/type`
- `POST /api/lg_webos_magic_touchpad/enter`
- `POST /api/lg_webos_magic_touchpad/back`
- `POST /api/lg_webos_magic_touchpad/delete`
- `POST /api/lg_webos_magic_touchpad/scroll`
- `POST /api/lg_webos_magic_touchpad/home`
- `POST /api/lg_webos_magic_touchpad/volume_up`
- `POST /api/lg_webos_magic_touchpad/volume_down`
- `POST /api/lg_webos_magic_touchpad/mute`

Con più TV puoi usare:

```text
/api/lg_webos_magic_touchpad/<entry_id>/<command>
```

Risposte:

```json
{ "ok": true }
```

oppure:

```json
{ "ok": false, "error": "..." }
```

## Opzione Secure

Alcune TV LG webOS usano connessione websocket secure, altre no. L'integrazione usa di default la modalità non secure perché è quella più comune con `pywebostv`.

Per cambiarla:

1. Apri l'integrazione in `Dispositivi e servizi`.
2. Premi `Configura`.
3. Attiva `Usa connessione webOS secure`.
4. Salva.

## Sviluppo

Frontend:

```bash
npm install
npm run check
npm run build
```

Backend Home Assistant:

```bash
python3 -m py_compile custom_components/lg_webos_magic_touchpad/*.py
```

Il build genera:

- `dist/lg-webos-magic-touchpad-card.js`
- `custom_components/lg_webos_magic_touchpad/www/lg-webos-magic-touchpad-card.js`

## Server Standalone Legacy

La cartella `server/` resta disponibile come modalità avanzata o fallback per test esterni a Home Assistant. Per l'uso normale non serve più.

```bash
cd server
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export LG_TV_IP=192.168.1.50
python lg_touchpad_server.py
```

## Docker Legacy

Il `Dockerfile` e `docker-compose.example.yml` restano per chi vuole ancora usare il backend separato. Non sono necessari quando installi l'integrazione in Home Assistant via HACS.

## Pubblicazione Release

```bash
npm run build
git add .
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin main
git push origin v0.2.0
```

## Troubleshooting

### La TV resta disconnected

- Verifica che la TV sia accesa.
- Controlla che Home Assistant e TV siano nella stessa rete.
- Verifica l'IP inserito nella configurazione guidata.
- Guarda i log di Home Assistant filtrando `lg_webos_magic_touchpad`.

### Non vedo la richiesta pairing sulla TV

- Riavvia Home Assistant.
- Assicurati che la TV non sia in standby profondo.
- Rimuovi e riaggiungi l'integrazione.
- Controlla che la TV permetta il controllo remoto/app mobile.

### La card non appare

- Svuota la cache del browser.
- Controlla che la risorsa Lovelace sia registrata.
- Aggiungi manualmente:

```text
/lg_webos_magic_touchpad/lg-webos-magic-touchpad-card.js
```

### Ho più TV configurate

Con più TV la card deve sapere quale voce usare. Aggiungi `entry_id` nella configurazione YAML della card.
