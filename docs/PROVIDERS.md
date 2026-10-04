# Provider setup and data handling

All providers run on the server. Keys never enter site.json, browser bundles, or exports.

## OpenAI

Set `MOCK_AI=false`, `OPENAI_API_KEY`, and `OPENAI_TEXT_MODEL` to a model available to your account that supports Responses structured outputs. The planner selects approved component IDs and a sitemap; the page writer emits validated content. The application validates output, retries invalid output with feedback, and leaves a retryable job on persistent failures. Content is data, never executable code.

`OPENAI_IMAGE_API_KEY` can be separate; otherwise image requests use `OPENAI_API_KEY`. `OPENAI_IMAGE_MODEL` defaults to the requested `gpt-image-2`. Account access and image-generation permissions must be enabled. Configure pricing variables for cost estimates; token/call counts work without pricing.

References: [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2).

## Pexels

Set `PEXELS_API_KEY`. Contextual searches request multiple landscape candidates. Images are downloaded only from the approved Pexels image host and re-encoded as bounded WebP assets. Photographer and source credits travel with exports. Search results have a one-hour cache. Confirm your use complies with the [Pexels API terms and documentation](https://www.pexels.com/api/documentation/).

## Google Places

Enable Places API (New) in a billing-enabled Google Cloud project and set `GOOGLE_PLACES_API_KEY`. Use a Place ID, a Google URL containing `query_place_id`/`place_id`, or a business name/address/city search. API failures do not block website generation. Search matches are suggestions, not proof of identity. The editor offers a live lookup for reviewing name, address, phone, opening hours, coordinates, rating, and attribution.

Google content is not automatically cached, copied into revision history, or bundled in exports. The editor can save address, phone, and coordinates as owner-confirmed information after review. Google photos remain live attributed previews; upload business-owned photos for portable exports. The Google image strategy uses owner uploads first, then OpenAI, Pexels, ComfyUI, and original abstract artwork. The mixed strategy starts with Pexels. Review the [Places storage and attribution restrictions](https://developers.google.com/maps/documentation/places/web-service/policies) before using Google material.

## ComfyUI

Set `COMFYUI_BASE_URL` to a trusted local server. `COMFYUI_WORKFLOW` selects an API-format workflow file. The bundled default uses standard nodes and requires `v1-5-pruned-emaonly.safetensors`; change the checkpoint name to a model installed in your ComfyUI instance, or supply another exported API workflow.

`{{PROMPT}}` is replaced with image intent/style and `{{SEED}}` with a numeric random seed. Workflows are submitted through `/prompt`, polled via `/history`, and fetched via `/view`. Workflows are administrator-owned configuration, never user/AI executable input. Jobs fall back when the server is offline or times out. In Docker, `host.docker.internal` can reach a ComfyUI instance on the host.

## Demo mode

`MOCK_AI=true` makes no paid provider calls. It uses deterministic English starter copy and original abstract artwork. Regeneration, image storage, jobs, editing, contact forms, and export still use the real persistence paths. Demo copy is intentionally modest and should be reviewed before publication; live multilingual copy requires configured OpenAI access.
