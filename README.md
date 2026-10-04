# Axogen

Axogen generates editable business websites from an owner supplied brief. The dashboard and worker share PostgreSQL; images live in `ASSET_DIR`. Exports contain static HTML, CSS, WebP assets, and a small Node server that stores contact messages in SQLite.

## Requirements

- Docker Engine and Compose, or Node.js 22.13+, npm, and PostgreSQL 17
- Disk space for generated images and ZIP exports
- API keys only for live AI, stock images, or Places lookup; demo mode needs none

## Quick start with Docker

1. Copy `.env.example` to `.env`. Set a random `BETTER_AUTH_SECRET` of at least 32 characters. For a public deployment, set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to its HTTPS origin and choose a strong `POSTGRES_PASSWORD`.
2. Run `docker compose up -d --build`.
3. Visit `http://localhost:3000`, create an account, and start a website. The worker generates it in the background.
4. Check `docker compose ps` and `docker compose logs -f app worker` if generation stalls.

The app starts by applying Prisma migrations. Compose keeps PostgreSQL, images, and exports in separate named volumes. Back up those volumes before upgrading or moving hosts. Run the app behind a TLS terminating reverse proxy in production. Set `TRUST_PROXY=true` only when that proxy overwrites forwarded headers. Set `ALLOW_SIGNUP=false` after accounts have been created if open signup is unwanted.

## Local development

1. Start PostgreSQL and configure `DATABASE_URL` in `.env`.
2. Run `npm ci`, `npx prisma migrate deploy`, and `npm run seed` (optional demo data).
3. Run `npm run dev` and `npm run worker` in separate terminals.
4. Open `http://localhost:3000`.

The worker must be running for queued generations. `npm run build` creates the production bundle; `npm start` serves it. `npm run typecheck`, `npm run lint`, and `npm test` run checks. `npm run test:integration` needs the integration environment described in `tests/workflow.integration.test.ts`; `npm run test:e2e` needs Playwright browser binaries. With the Docker app running, `node scripts/docker-smoke.mjs` tests signup, generation, preview, images, and ZIP export.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL`, `POSTGRES_PASSWORD` | App PostgreSQL connection and Compose database password |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | Auth signing secret and public origin |
| `MOCK_AI` | `true` for deterministic demo generation without paid APIs |
| `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL` | Live text planning and copy |
| `OPENAI_IMAGE_API_KEY`, `OPENAI_IMAGE_MODEL` | Image generation; image key falls back to text key |
| `PEXELS_API_KEY` | Stock image search |
| `GOOGLE_PLACES_API_KEY` | Live Places review and photo preview |
| `COMFYUI_BASE_URL`, `COMFYUI_WORKFLOW` | Local image workflow |
| `ASSET_DIR`, `EXPORT_DIR` | Image and export directories |
| `CONTACT_WEBHOOK_URL`, `CONTACT_WEBHOOK_SECRET` | Optional signed contact delivery |
| `TEXT_INPUT_USD_PER_MILLION`, `TEXT_OUTPUT_USD_PER_MILLION`, `IMAGE_USD_PER_GENERATION` | Cost estimates |
| `TRUST_PROXY`, `ALLOW_SIGNUP` | Proxy and signup controls |

See [provider setup](docs/PROVIDERS.md) for OpenAI, GPT Image 2, Pexels, Google Places, and ComfyUI details. Provider keys stay on the server. Set `MOCK_AI=false` to use live providers; test each key and account permission before relying on production generation.

## Create, edit, and export

Create a project from the dashboard or the NovaForge example. The editor saves changes automatically. Add, rename, reorder, and remove pages in the Pages tab; page URL edits update internal links. Settings holds owner confirmed business information. Google Places offers a live review; confirm the match before copying location details. Google photos are previews only. Upload business owned images if they must appear in portable exports.

The single creation form asks for industry, country, website size, page count when applicable, language, and an image source. Choose Automatic, GPT Image, ComfyUI, or Pexels for site images and a square favicon. The selected provider is tried first; an original abstract illustration is used if it is unavailable. The worker generates a business name, description, suitable services, voice, and city. In live mode, AI also chooses the visual style, colors, fonts, spacing, components, navigation, and footer. With a Google Places key, new-site generation randomly selects a venue in the chosen country with an address and phone from the same listing. The generated footer shows both as clearly labeled samples and identifies the source venue. Existing completed sites are not changed. Settings suggests a domain and email based on the generated name; verify domain ownership and mailbox setup before using them. The generated email uses a `.example` sample placeholder until then. Demo mode uses local sample copy and a preset design; live mode uses the configured OpenAI text model.

Landing page always creates one main page with services and a contact form, even if an older brief has `pageCount: 2`. Small site creates three main pages. Standard and Custom use the requested main-page count; a two-page site starts with Home and Contact. Large creates at least eight main pages. Every site also includes AI-drafted Privacy Policy, GDPR Policy, Cookie Policy, and Business Model pages in its footer. These four pages do not count toward the requested main-page count. Review and complete policy details, including legal identity, contact information, retention, and any later-added cookies, before publishing.

Every page footer displays phone, email, and address. Confirmed values become contact links where applicable. Missing or unconfirmed values appear as “Not provided”; confirm suggested details in Business settings to publish them.

Set the canonical domain in Website settings, choose an export format, then select **Export site**. **Node.js** includes the existing standalone server and stores contact messages in `data/contacts.sqlite`; run it with Node 22.13+ or the included Docker setup. **PHP** includes a working contact form that stores messages in `data/contacts.jsonl` outside the `public/` document root; serve `public/` with PHP 8.2+ or the included Docker setup. **HTML/CSS** contains files ready for static hosting and can also be opened locally by double-clicking `index.html` after extracting the whole ZIP. It has no server or working contact form; connect a form service before publishing if you need enquiries. Node.js and PHP messages stay with the exported site and do not appear in the Axogen dashboard inbox. Keep message files private. The downloaded ZIP includes format-specific setup instructions.

## Troubleshooting

- A project stays queued: verify the worker is running and can reach PostgreSQL; inspect `docker compose logs worker`.
- The app will not start: check `DATABASE_URL`, migrations, `BETTER_AUTH_SECRET`, and `docker compose logs app postgres`.
- Provider calls fail: verify the key, model access, billing, and provider configuration. Demo mode can confirm the local workflow independently.
- An image is missing: ensure the app and worker share `ASSET_DIR`; in Compose both use the `assets` volume.
- Export rejects a link: edit its page or section destination to an existing URL or anchor. The editor reports the first invalid destinations.
- Contact messages are missing from the dashboard after export: Node.js stores them in `data/contacts.sqlite`; PHP stores them in `data/contacts.jsonl`. Static HTML has no built-in contact form.
