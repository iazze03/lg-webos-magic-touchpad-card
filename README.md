# LG webOS Magic Touchpad Card

Lovelace custom card per Home Assistant che controlla il puntatore mouse delle TV LG webOS/Magic Remote tramite un piccolo backend locale Python.

La card non usa iframe: chiama direttamente endpoint REST locali. Il backend parla con la TV tramite `pywebostv`, mantiene il pairing in `client_key.json` e prova a riconnettersi se il socket input cade.

## Architettura

- `dist/lg-webos-magic-touchpad-card.js`: custom card installabile via HACS.
- `src/lg-webos-magic-touchpad-card.ts`: sorgente LitElement.
- `server/lg_touchpad_server.py`: backend REST locale.
- `Dockerfile` e `docker-compose.example.yml`: base per container.

## Prerequisiti

- Home Assistant con Lovelace.
- TV LG webOS raggiungibile dalla rete locale.
- Python 3.11+ per il backend.
- Un host locale sempre acceso: Mac, VM, mini PC, TrueNAS, Docker host o simile.
- Se Home Assistant è servito in HTTPS, anche il backend deve essere raggiungibile in HTTPS oppure tramite reverse proxy HTTPS.

Il backend non richiede password o token Home Assistant.

## Installazione Backend

```bash
cd server
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Avvio HTTP locale:

```bash
export LG_TV_IP=192.168.1.50
export LG_KEYFILE=./client_key.json
export LG_SERVER_HOST=0.0.0.0
export LG_SERVER_PORT=5055
python lg_touchpad_server.py
```

Alla prima connessione la TV mostrerà una richiesta di pairing. Accettala con il telecomando. La chiave verrà salvata nel file indicato da `LG_KEYFILE`.

Test rapido:

```bash
curl http://IP_SERVER:5055/health
curl -X POST http://IP_SERVER:5055/move -H 'content-type: application/json' -d '{"dx":40,"dy":0}'
curl -X POST http://IP_SERVER:5055/click
```

## Variabili Ambiente Backend

| Variabile | Default | Descrizione |
| --- | --- | --- |
| `LG_TV_IP` | obbligatoria | IP della TV LG webOS. |
| `LG_KEYFILE` | `client_key.json` | Percorso file pairing. |
| `LG_SERVER_HOST` | `0.0.0.0` | Host Flask. |
| `LG_SERVER_PORT` | `5055` | Porta REST. |
| `LG_SSL_CERT` | vuota | Certificato PEM per HTTPS locale. |
| `LG_SSL_KEY` | vuota | Chiave PEM per HTTPS locale. |
| `LG_SECURE` | `false` | Prova connessione secure se supportata da `pywebostv`. |
| `LG_LOG_LEVEL` | `INFO` | Livello log. |

## HTTPS Locale e Mixed Content

Se Home Assistant è aperto in HTTPS, il browser blocca richieste verso `http://...` per mixed content. Usa una di queste opzioni:

- avvia il backend con HTTPS locale;
- esponi il backend dietro Nginx/Caddy/Traefik con certificato valido;
- usa un reverse proxy/add-on già presente nella tua rete.

Certificato autofirmato per test:

```bash
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout key.pem \
  -out cert.pem \
  -sha256 \
  -days 365 \
  -subj "/CN=lg-touchpad.local"

export LG_SSL_CERT=$PWD/cert.pem
export LG_SSL_KEY=$PWD/key.pem
python server/lg_touchpad_server.py
```

Apri `https://IP_SERVER:5055/health` dal browser e accetta il certificato prima di usare la card.

## Installazione Card via HACS

1. Pubblica questo repository su GitHub.
2. In Home Assistant apri HACS.
3. Vai in `Custom repositories`.
4. Inserisci l'URL del repository GitHub.
5. Categoria: `Lovelace`.
6. Installa `LG webOS Magic Touchpad Card`.
7. Riavvia o ricarica le risorse Lovelace se richiesto.

Risorsa manuale, se non usi HACS:

```yaml
url: /local/lg-webos-magic-touchpad-card.js
type: module
```

Con HACS il percorso tipico è:

```yaml
url: /hacsfiles/lg-webos-magic-touchpad-card/lg-webos-magic-touchpad-card.js
type: module
```

## Configurazione Lovelace

```yaml
type: custom:lg-webos-magic-touchpad-card
title: TV Salone
server: https://IP_SERVER:5055
entity: media_player.tv_salone
sensitivity: 1.7
show_keyboard: true
show_volume: true
show_nav_buttons: true
```

## Uso

- Trascina con un dito o mouse sull'area touchpad per muovere il puntatore.
- Tap sull'area touchpad per click.
- Due dita su mobile per scroll.
- Rotella mouse per scroll.
- Il campo testo invia testo alla TV.
- Backspace sulla tastiera locale chiama `/delete`.
- Enter sulla tastiera locale invia il testo presente e poi chiama `/enter`.

## Endpoint REST

Tutte le risposte seguono:

```json
{ "ok": true }
```

oppure:

```json
{ "ok": false, "error": "..." }
```

Endpoint:

- `GET /health`
- `POST /move` con `{ "dx": number, "dy": number }`
- `POST /click`
- `POST /type` con `{ "text": string }`
- `POST /enter`
- `POST /back`
- `POST /delete`
- `POST /scroll` con `{ "dy": number }`
- `POST /home`
- `POST /volume_up`
- `POST /volume_down`
- `POST /mute`

`/health` resta leggero: se la TV è spenta indica `connected: false` e avvia un tentativo di riconnessione in background.

## Docker

Copia il compose di esempio e modifica l'IP:

```bash
cp docker-compose.example.yml docker-compose.yml
docker compose up -d --build
```

Con `network_mode: host` il container vede direttamente la rete locale, utile per TV LG e pairing.

Per HTTPS in Docker, monta `cert.pem` e `key.pem` nella cartella `data` e abilita:

```yaml
LG_SSL_CERT: "/data/cert.pem"
LG_SSL_KEY: "/data/key.pem"
```

## Sviluppo Frontend

```bash
npm install
npm run check
npm run build
```

Il file da rilasciare per HACS è:

```text
dist/lg-webos-magic-touchpad-card.js
```

## Pubblicazione GitHub

```bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin https://github.com/TUO_UTENTE/lg-webos-magic-touchpad-card.git
git push -u origin main
git tag v0.1.0
git push origin v0.1.0
```

HACS può installare il repository anche senza release, ma un tag versionato rende più puliti aggiornamenti e rollback.

## Troubleshooting

### La card mostra disconnected

- Controlla `server: https://IP_SERVER:5055`.
- Apri `/health` dal browser dello stesso dispositivo.
- Se usi certificato autofirmato, accettalo nel browser.
- Verifica che `LG_TV_IP` sia corretto.
- Controlla che TV e host backend siano nella stessa rete.

### Home Assistant blocca le chiamate

Quasi sempre è mixed content: Home Assistant è in HTTPS e il backend è in HTTP. Usa HTTPS locale o reverse proxy.

### Pairing non appare sulla TV

- Cancella `client_key.json`.
- Riavvia il backend.
- Assicurati che la TV sia accesa e non in standby profondo.
- Controlla eventuali impostazioni LG per app mobile/remote control.

### Movimento o scroll non funzionano su alcuni modelli

`pywebostv` e webOS variano tra modelli. Il backend usa `InputControl.scroll` quando disponibile e un fallback sul pointer socket quando supportato. Se il modello non accetta scroll, gli altri comandi possono continuare a funzionare.

### Volume o Home non funzionano

Alcuni firmware espongono controlli diversi. Verifica i log backend; i comandi pointer restano indipendenti dai controlli media/app.
