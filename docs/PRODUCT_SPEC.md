You are a senior full-stack engineer, AI systems architect, product designer, and DevOps engineer.

Build a complete, production-ready AI website generator that can automatically create polished multi-page local-business/service-business websites from a short business brief.

The final product must be ready to run locally and deploy with Docker.

Do not create only a prototype, mockup, static example, or proof of concept.

Build the actual working application end-to-end.

The generator should produce websites similar in quality and structural richness to modern AI-generated local business websites: strong hero sections, business information, services, galleries, testimonials when legitimately supplied, FAQs, contact sections, maps/contact information, SEO metadata, structured data, responsive layouts, and reusable visual components.

The generator must NOT copy competitor websites, layouts, copy, images, branding, or proprietary assets.

Use generated layouts from our own component library.

---

# 1. Main Goal

Create a web application where a user can enter basic information such as:

- business name
- industry/category
- city
- country
- optional address
- Google Place URL or Place ID
- website language
- company description
- services
- style preferences
- colors
- preferred imagery source
- number of pages
- optional additional instructions

Then click:

"Generate Website"

The system should automatically:

1. enrich available business data using Google Places
2. determine an appropriate sitemap
3. create a visual design direction
4. generate website copy
5. select appropriate reusable components
6. obtain or generate images
7. assemble the website
8. create SEO metadata
9. create Schema.org structured data
10. produce responsive pages
11. allow previewing the website
12. allow editing/regenerating sections
13. allow downloading/exporting the generated site
14. allow running the generated website with Docker

The generated website should be production-quality, responsive, and usable without manually rewriting generated code.

---

# 2. Required Tech Stack

Use:

Frontend / app:

- Next.js latest stable version
- React
- TypeScript
- Tailwind CSS
- shadcn/ui where appropriate

Database:

- PostgreSQL

ORM:

- Prisma

AI:

- OpenAI API

Image providers:

- GPT Image 2 API
- Pexels API
- ComfyUI

Business data:

- Google Places API

Deployment:

- Docker
- Docker Compose

Reverse proxy if useful:

- Nginx or Traefik

Validation:

- Zod

Forms:

- React Hook Form

Use a clean modular architecture.

Avoid unnecessary dependencies.

---

# 3. Repository Structure

Use a monorepo-style or clean modular structure such as:

/app
/components
/components/site
/components/generator
/components/editor
/lib
/lib/ai
/lib/images
/lib/google
/lib/generation
/lib/seo
/lib/export
/lib/templates
/lib/validation
/prisma
/public
/generated-sites
/docker
/scripts
/types
/tests

Organize the code so image providers, AI models, deployment logic, and site components can easily be swapped later.

---

# 4. Core Principle: Do NOT Generate Arbitrary HTML

Do not ask the model to generate complete arbitrary HTML/CSS websites.

Instead implement:

AI Website Planner
        ↓
Structured Website JSON
        ↓
Validated schema
        ↓
Component Renderer
        ↓
Finished Website

The AI should generate structured JSON defining the website.

Example:

{
  "business": {
    "name": "Nova Dental Studio",
    "category": "Dentist",
    "city": "London",
    "country": "United Kingdom"
  },
  "design": {
    "style": "modern",
    "tone": "professional",
    "theme": "light",
    "borderRadius": "medium",
    "density": "comfortable"
  },
  "pages": [
    {
      "slug": "/",
      "title": "Home",
      "sections": [
        {
          "type": "hero",
          "variant": "hero-split-image",
          "content": {}
        },
        {
          "type": "trustStats",
          "variant": "stats-inline",
          "content": {}
        },
        {
          "type": "services",
          "variant": "services-cards",
          "content": {}
        }
      ]
    }
  ]
}

Create strict Zod schemas for all generated website configuration.

If AI output fails validation:

- automatically repair/retry
- never crash the generation flow

---

# 5. Component Library

Create a reusable website-section component library.

Each category must contain several substantially different variants.

Minimum:

Hero:
- 8 variants

Navigation:
- 4 variants

Trust/statistics:
- 5 variants

About:
- 6 variants

Services:
- 10 variants

Features:
- 6 variants

Process:
- 5 variants

Gallery:
- 6 variants

Team:
- 4 variants

Testimonials:
- 5 variants

Pricing:
- 6 variants

FAQ:
- 4 variants

CTA:
- 8 variants

Contact:
- 6 variants

Footer:
- 5 variants

Blog/article preview:
- 4 variants

Location:
- 4 variants

Logo/trust strip:
- 4 variants

The variants must have genuinely different compositions.

Do not simply change card colors or spacing.

Examples:

hero-centered
hero-split
hero-background-photo
hero-editorial
hero-with-stats
hero-with-service-grid
hero-minimal
hero-overlay

The AI planner selects components based on:

- industry
- business type
- available content
- visual style
- page intent
- conversion goal

---

# 6. Design System Generator

Generate a design system for every project.

Include:

- primary color
- secondary color
- accent color
- background colors
- text colors
- heading font
- body font
- typography scale
- spacing
- border radius
- shadows
- button style
- card style
- section spacing

Use CSS variables so the theme can be changed globally.

Example:

--color-primary
--color-secondary
--color-accent
--background
--foreground
--radius
--section-spacing

Do not allow AI to create unreadable color combinations.

Add automatic WCAG-friendly contrast checking.

---

# 7. Style Presets

Provide presets such as:

- Modern Corporate
- Premium Luxury
- Minimal
- Startup
- Professional Services
- Tech
- Gaming
- Industrial
- Medical
- Beauty
- Restaurant
- Creative Agency
- Financial
- Real Estate
- Automotive
- Local Service Business

The AI can modify the preset but should use it as a foundation.

---

# 8. Google Places Integration

Create a Google Places provider.

Allow lookup by:

- business name
- city
- address
- Place ID

Where legally and technically permitted, retrieve useful data such as:

- official business name
- address
- phone number
- website
- coordinates
- business category
- opening hours
- rating
- review count
- Google Maps link
- photos when permitted by Google's API terms

Store:

source
value
verified status

Example:

{
  "phone": {
    "value": "+44...",
    "source": "google_places",
    "verified": true
  }
}

Do NOT let AI overwrite verified data with invented values.

---

# 9. Fact Safety System

Create three data classifications:

VERIFIED
USER_PROVIDED
AI_GENERATED

The system must never present AI-invented factual claims as verified business facts.

Do not fabricate:

- Google ratings
- number of customers
- years in business
- awards
- testimonials
- certifications
- locations
- employees
- revenue
- projects completed
- business history
- addresses
- phone numbers

If such information is unavailable:

omit it
or use neutral copy.

Never generate fake testimonials.

Testimonials should only appear if:

- supplied by the user
- retrieved from an API in a legally permitted way

---

# 10. Website Content Generation

Use OpenAI to generate:

- sitemap
- page strategy
- page copy
- headings
- CTAs
- service descriptions
- FAQs
- SEO title
- meta description
- Open Graph fields
- image prompts
- alt text
- internal linking recommendations
- schema markup

Copy should sound natural and commercially usable.

Avoid:

- obvious AI clichés
- excessive em dashes
- repetitive headings
- repeated sentence patterns
- generic filler
- fake statistics
- unverifiable superiority claims

Allow tone options:

professional
friendly
premium
technical
bold
playful
luxury
minimal
authoritative

---

# 11. Sitemap Generation

The AI must determine which pages make sense.

Potential pages:

/
 /about
 /services
 /services/[service]
 /contact
 /pricing
 /gallery
 /faq
 /locations
 /blog

Do not automatically create unnecessary pages.

For simple businesses, 3–5 pages may be sufficient.

For larger service businesses, create more pages.

Provide a user setting:

Website size:

- Landing page
- Small site
- Standard
- Large
- Custom

---

# 12. Image Provider Architecture

Create an image-provider abstraction.

Interface example:

interface ImageProvider {
  searchImages(query: string, options?: ImageSearchOptions): Promise<ImageResult[]>
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<ImageResult>
}

Providers:

1. Pexels
2. GPT Image 2
3. ComfyUI
4. Google Places photos when permitted
5. user uploads

The application must allow provider selection.

Example:

Image strategy:

- Stock only
- AI generated only
- Google business photos first
- Mixed
- Manual

---

# 13. Pexels

Integrate the Pexels API.

Generate search queries from section context.

Bad:

"business"

Good:

"modern dental clinic reception London bright interior"

"premium barbershop haircut close-up professional commercial photography"

"esports gaming lounge RGB PCs wide interior"

Fetch multiple candidates.

Store:

- image URL
- photographer
- source URL
- attribution information where required
- width
- height
- orientation

Do not hotlink blindly where inappropriate.

Support downloading/caching images according to API terms.

---

# 14. GPT Image 2

Integrate GPT Image 2 as an image generation provider.

Generate detailed commercial image prompts.

Example:

"wide cinematic commercial photograph of a premium esports gaming lounge, rows of high-end PCs, tasteful ambient LED lighting, customers naturally playing games, realistic interior architecture, high-end editorial photography, wide-angle lens, no text, no logos"

Generate prompts based on:

- industry
- section
- visual theme
- required aspect ratio
- brand colors where relevant

Store image intent separately from generated URL.

Example:

{
  "intent": "hero image showing premium esports environment",
  "prompt": "...",
  "provider": "gpt-image-2",
  "assetUrl": "..."
}

---

# 15. ComfyUI

Create a ComfyUI provider.

Allow configuration:

COMFYUI_BASE_URL

Support configurable workflows.

Store ComfyUI workflow JSON outside core application logic.

For example:

/config/comfyui/default.json
/config/comfyui/interior.json
/config/comfyui/portrait.json

Allow future custom models.

The generator must function even when ComfyUI is unavailable.

---

# 16. Image Selection Logic

Images should be selected based on semantic relevance.

Each section should generate an image intent.

Example:

{
  "section": "hero",
  "intent": "wide modern coworking office",
  "orientation": "landscape",
  "priority": "high"
}

Provider priority can be configurable.

Example:

Google Places
↓
Pexels
↓
GPT Image 2
↓
ComfyUI
↓
placeholder

Do not silently reuse copyrighted competitor images.

Never scrape competitor imagery.

For missing imagery use clean placeholders.

---

# 17. Generated Asset Manager

Create an asset manager inside the project.

Show:

- asset preview
- provider
- prompt/query
- usage location
- regenerate button
- replace button
- upload custom image

Allow regenerating a single image without regenerating the website.

---

# 18. Website Generation Pipeline

Implement generation as clear stages.

Stage 1:
Business intake

Stage 2:
Google Places enrichment

Stage 3:
Website strategy

Stage 4:
Sitemap

Stage 5:
Design system

Stage 6:
Page structure

Stage 7:
Copy generation

Stage 8:
Image intents

Stage 9:
Image retrieval/generation

Stage 10:
SEO generation

Stage 11:
Schema generation

Stage 12:
Validation

Stage 13:
Render

Stage 14:
Preview

Show progress in the UI.

Example:

Analyzing business...
Building sitemap...
Writing homepage...
Finding images...
Generating hero image...
Creating SEO...
Rendering website...

---

# 19. Generation Job System

Long generation jobs must not depend on one browser request staying open.

Implement a job system.

Prefer:

PostgreSQL-backed generation jobs

or

Redis + BullMQ if genuinely useful.

Persist:

status
progress
stage
errors
createdAt
updatedAt
result

If generation fails halfway through, allow:

Retry stage

instead of restarting everything.

---

# 20. Generator Dashboard

Create a clean dashboard.

Main dashboard:

Projects

Each project card:

- business name
- thumbnail
- industry
- status
- created date
- edit
- preview
- duplicate
- delete
- export

New Website button.

---

# 21. Website Creation Wizard

Create a multi-step wizard.

Step 1:
Business

- business name
- category
- country
- city
- address
- Google Place ID

Step 2:
Website

- website type
- number of pages
- language
- desired services/pages

Step 3:
Design

- style preset
- colors
- light/dark
- examples described in words

Step 4:
Images

- Google Places
- Pexels
- GPT Image 2
- ComfyUI
- mixed

Step 5:
Generation

Show estimated work stages, but do not require manual intervention.

---

# 22. Website Editor

After generation allow editing.

Left sidebar:

Pages
Sections
Theme
SEO
Images
Settings

Center:

live preview

Right sidebar:

selected section settings

Allow:

- edit text
- change image
- change section variant
- regenerate copy
- regenerate image
- move section up/down
- duplicate section
- delete section
- add section
- change CTA
- change colors
- change typography

Do not attempt to build a full Figma clone.

Use structured section editing.

---

# 23. Regeneration

Allow regeneration at different scopes:

- one headline
- one paragraph
- section
- page
- image
- design theme
- entire website

Regenerating one section must not unexpectedly change unrelated sections.

---

# 24. SEO

Generate:

Title
Meta description
Canonical
Open Graph
Twitter metadata
robots.txt
sitemap.xml

Create useful titles and descriptions without keyword stuffing.

Each page must have unique metadata.

---

# 25. Structured Data

Generate valid Schema.org JSON-LD.

Support when appropriate:

LocalBusiness
Organization
ProfessionalService
Restaurant
MedicalBusiness
FAQPage
BreadcrumbList
Service

Only include verified factual data.

Do not put invented ratings/reviews in structured data.

Validate generated schema.

---

# 26. Local SEO

For local businesses include where appropriate:

- city references
- service area
- NAP information
- map/contact details
- opening hours
- location schema
- service-area copy

Avoid automatically generating dozens of doorway location pages.

---

# 27. Performance

Generated websites should target:

Lighthouse:

Performance >= 90
Accessibility >= 90
Best Practices >= 90
SEO >= 90

where realistically achievable.

Use:

- optimized images
- lazy loading
- next/image
- minimal JS
- server rendering where useful
- semantic HTML

---

# 28. Accessibility

Implement:

- semantic headings
- keyboard navigation
- accessible forms
- labels
- ARIA only where necessary
- alt text
- adequate contrast
- visible focus states

---

# 29. Contact Forms

Generated websites should include working contact forms.

Fields:

name
email
phone optional
message

Create a configurable submission adapter.

Initially support:

- database storage
- webhook

Structure code so SMTP/Resend/etc. can be added later.

Implement:

spam protection
honeypot
rate limiting
server-side validation

---

# 30. Map / Contact Data

If coordinates are available from Google Places, support a map/location component.

Do not expose private API keys client-side.

---

# 31. Export

Allow exporting a generated website.

Options:

1. ZIP source code
2. generated project directory
3. Docker-ready package

Exported site should contain:

- website configuration
- components needed
- public assets
- environment template
- Dockerfile
- README

The exported website must not depend on the generator dashboard to render.

---

# 32. Docker

Docker is mandatory.

Create:

Dockerfile
docker-compose.yml
.dockerignore

Services should include at minimum:

app
postgres

Optionally:

redis
reverse proxy

Use multi-stage Docker builds.

Application must start with something equivalent to:

docker compose up -d

Provide production and development configurations if useful.

---

# 33. Generated Website Docker Deployment

Each exported website must optionally be deployable independently through Docker.

Example:

docker build -t generated-site .
docker run -p 3000:3000 generated-site

Or:

docker compose up -d

Document the deployment process.

---

# 34. Environment Variables

Provide:

.env.example

Include examples such as:

OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
OPENAI_IMAGE_MODEL=gpt-image-2

GOOGLE_PLACES_API_KEY=

PEXELS_API_KEY=

COMFYUI_BASE_URL=

DATABASE_URL=

NEXT_PUBLIC_APP_URL=

Do not commit secrets.

Validate required variables on startup.

---

# 35. AI Provider Layer

Create an AI provider abstraction.

Do not scatter raw OpenAI API calls throughout the code.

Example:

/lib/ai/openai.ts

Expose services such as:

planWebsite()
generatePage()
generateSection()
generateSEO()
generateImagePrompt()
repairStructuredOutput()

Use structured outputs when supported.

---

# 36. Prompt Management

Store AI prompt templates centrally.

Example:

/lib/ai/prompts/site-planner.ts
/lib/ai/prompts/page-writer.ts
/lib/ai/prompts/seo.ts
/lib/ai/prompts/image-intent.ts

Do not bury long prompts inside UI components.

Version prompts where useful.

---

# 37. Caching

Avoid unnecessary AI/API calls.

Cache:

- Google Places response
- Pexels searches
- AI plans
- image generation results where appropriate

Provide force-regenerate controls.

---

# 38. Cost Tracking

Track API usage per project.

At minimum track:

- OpenAI text calls
- text token usage where available
- GPT Image generations
- Pexels requests
- Google Places requests

Show approximate project generation cost where possible.

Architecture must allow configurable pricing later.

---

# 39. Error Handling

Handle:

- invalid OpenAI output
- OpenAI timeout
- rate limit
- Google Places failure
- Pexels failure
- image generation failure
- ComfyUI offline
- missing API keys
- database issues

The system should gracefully fall back when possible.

Example:

ComfyUI offline
→ GPT Image
→ Pexels
→ placeholder

Do not leave broken image URLs.

---

# 40. Security

Implement sane production security.

Include:

- server-only API keys
- input validation
- rate limiting
- safe file uploads
- MIME validation
- filename sanitization
- XSS prevention
- secure headers
- no arbitrary code execution from AI output

Never execute HTML/JavaScript generated directly by the model.

The renderer must only use whitelisted components.

---

# 41. Authentication

Implement basic authentication for the generator dashboard.

Use a production-suitable authentication library.

Support:

- user accounts
- login
- logout

Projects belong to users.

Keep architecture ready for teams later.

---

# 42. Database Models

Create sensible Prisma models including approximately:

User
Project
Business
Page
Section
Asset
GenerationJob
GenerationLog
ApiUsage
ContactSubmission

Store the structured site configuration.

Do not unnecessarily normalize every text field if JSON storage is cleaner.

---

# 43. Example Project

Seed the application with at least one generated example business.

Example:

Business:
NovaForge Gaming Lounge

Category:
Gaming / Esports Lounge

Location:
Manchester, UK

Style:
premium dark esports

Pages:

Home
Gaming
Events
Pricing
About
Contact

Use generated/stock placeholders rather than copyrighted competitor assets.

The example must demonstrate the complete component system.

---

# 44. UI Quality

The generator dashboard itself should look like a real SaaS product.

Use:

- clear spacing
- professional typography
- responsive dashboard
- polished empty states
- loading states
- progress indicators
- useful error states

Do not deliver developer-only forms with unstyled inputs.

---

# 45. Generated Site Quality

Generated sites must NOT all look identical.

Variation should come from:

- component selection
- section ordering
- design tokens
- typography
- imagery
- navigation style
- card design
- section background treatment
- spacing
- content density

But maintain quality constraints.

Randomness should not cause ugly designs.

Use deterministic generation seeds where useful.

---

# 46. Component Compatibility Rules

Create rules so incompatible combinations are avoided.

Examples:

Do not use:

dark hero
+
dark navigation
+
dark text

unless contrast is correct.

Do not place:

three statistic sections next to each other.

Do not show:

pricing section

when no pricing is supplied or intentionally generated.

Do not show:

team

if no team information exists.

Do not show testimonials without legitimate testimonials.

---

# 47. Responsive Requirements

Test all components at approximately:

375px
768px
1024px
1440px

No horizontal scrolling.

Images must crop gracefully.

Navigation must work on mobile.

---

# 48. Testing

Add useful tests.

At minimum:

unit tests for:

- schema validation
- component resolver
- image provider abstraction
- SEO generator
- factual data protection

integration tests for:

- project creation
- generation pipeline
- rendering
- export

If practical use Playwright for:

- generator wizard
- website preview
- editor
- exported website

---

# 49. Seed / Demo Mode

Provide demo functionality when external API keys are missing.

Use mock providers.

Example:

MOCK_AI=true

This allows developers to start the platform and inspect the UI without spending API credits.

Production must use real providers.

---

# 50. README

Create a complete README covering:

- requirements
- architecture
- installation
- local development
- environment variables
- database setup
- OpenAI setup
- Google Places setup
- Pexels setup
- GPT Image 2 setup
- ComfyUI setup
- Docker
- deployment
- creating a site
- exporting a site
- troubleshooting

---

# 51. Required Commands

Ensure common commands work.

Example:

npm install

npm run dev

npm run build

npm run test

npm run lint

npx prisma migrate dev

docker compose up -d

Use pnpm if you prefer, but document everything clearly.

---

# 52. Developer Experience

Add:

ESLint
Prettier
TypeScript strict mode

Avoid widespread:

any
@ts-ignore

Provide clean error messages.

---

# 53. Implementation Strategy

Do not try to write every file blindly before verifying the architecture.

Implement in functional vertical slices.

Recommended order:

Phase 1

- repository
- Next.js
- database
- authentication
- Docker
- dashboard

Phase 2

- Project model
- business intake
- Google Places integration

Phase 3

- AI provider
- site planner
- structured schemas

Phase 4

- section component library
- renderer
- preview

Phase 5

- page content generation
- SEO
- schema

Phase 6

- Pexels
- GPT Image 2
- ComfyUI
- asset management

Phase 7

- editor
- section regeneration

Phase 8

- export
- standalone Docker website

Phase 9

- testing
- error handling
- documentation

However, continue through all phases unless genuinely blocked.

Do not stop after Phase 1 and call the task complete.

---

# 54. Important Generation Rules

The AI must never directly decide arbitrary executable component code.

The model may only select from approved component IDs.

For example:

{
  "type": "services",
  "variant": "services-grid-03"
}

Then our React application resolves:

services-grid-03

to a known React component.

Use a registry.

Example:

const sectionRegistry = {
  "hero-split-01": HeroSplit01,
  "hero-center-02": HeroCenter02,
  "services-grid-03": ServicesGrid03
}

Unknown section IDs must fail validation.

---

# 55. AI Context

When generating content provide AI with:

business facts
verified Google data
user supplied facts
industry
location
existing generated content
page objective
SEO intent
tone
section purpose

Do not ask the model to invent missing factual information.

---

# 56. Image Context

Image prompts/search queries must know:

business
industry
section purpose
page
design style
desired composition
orientation

Example:

Hero:

wide cinematic commercial photography

Service card:

clean close-up service-related imagery

About:

natural environmental business photography

Avoid generic unrelated stock.

---

# 57. Asset Reuse

Do not generate a unique expensive image for every tiny card.

Allow a project image library.

Reuse relevant assets appropriately.

But do not show the same hero image repeatedly across several major sections.

---

# 58. Generated Site Storage

Store generated website state separately from UI source code.

Example:

site.json

The renderer consumes this configuration.

This makes:

editing
export
versioning
regeneration

easier.

---

# 59. Versioning

Save project revisions.

At minimum support:

current version
previous generation

Prefer creating snapshots before major regeneration.

Allow user to restore the previous version.

---

# 60. Autosave

Editor changes should autosave.

Use debounce.

Show:

Saved
Saving...
Error saving

---

# 61. Production Readiness

The final system must:

build successfully
run through Docker
connect to PostgreSQL
create an account
create a project
generate a website
show preview
edit sections
generate/select images
save project
export website
run exported website independently

These are mandatory acceptance criteria.

---

# 62. Final Acceptance Test

Before declaring completion perform an end-to-end test.

Scenario:

Create business:

Name:
NovaForge Esports

Category:
Gaming lounge

City:
Manchester

Country:
United Kingdom

Services:

PC Gaming
Console Gaming
Esports Events
Private Events
Coaching

Style:

dark
premium
modern
esports

Image source:

Mixed Pexels + GPT Image 2

Generate the website.

Verify:

- homepage renders
- several pages exist
- navigation works
- images load
- content is coherent
- mobile layout works
- SEO exists
- JSON-LD exists
- contact form submits
- image can be regenerated
- section can be regenerated
- section variant can be changed
- project persists after restart
- export works
- exported Docker website starts successfully

Fix any discovered blocking bugs.

---

# 63. Deliverables

At completion provide:

1. full source code
2. Dockerfile
3. docker-compose.yml
4. .env.example
5. Prisma schema and migrations
6. working dashboard
7. generation wizard
8. generated site renderer
9. editor
10. Google Places integration
11. Pexels integration
12. GPT Image 2 integration
13. ComfyUI integration
14. SEO system
15. structured-data system
16. contact form
17. export system
18. independent generated-site Docker deployment
19. tests
20. README

---

# 64. Environment / API Configuration

Use configuration similar to:

OPENAI_API_KEY=
OPENAI_TEXT_MODEL=

OPENAI_IMAGE_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2

GOOGLE_PLACES_API_KEY=

PEXELS_API_KEY=

COMFYUI_BASE_URL=http://host.docker.internal:8188

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sitegenerator

NEXT_PUBLIC_APP_URL=http://localhost:3000

Never hardcode credentials.

---

# 65. Default Image Strategy

Default image strategy should be:

User-uploaded image
↓
Google Places photo if legitimate and available
↓
Pexels stock
↓
GPT Image 2
↓
ComfyUI
↓
designed placeholder

But allow configuration.

For visually specific hero sections, prefer AI generation when stock imagery is weak.

For generic services/business environments, prefer good Pexels photography when appropriate to reduce generation costs.

---

# 66. Image Search vs Image Generation Decision

Build logic similar to:

if verifiedBusinessPhotoAvailable:
    useBusinessPhoto()

else if sectionNeedsRealisticGenericPhotography:
    searchPexels()

else if sectionNeedsBrandSpecificScene:
    generateWithGPTImage()

else if customLocalComfyWorkflowSelected:
    generateWithComfyUI()

else:
    usePlaceholder()

Examples:

"plumber repairing boiler"
→ Pexels likely sufficient

"fictional premium cyberpunk esports facility matching purple brand design"
→ GPT Image 2

"user configured custom Flux model"
→ ComfyUI

---

# 67. Copyright / Content Rules

Never:

- scrape competitor websites for images
- copy competitor text
- clone competitor branding
- reproduce proprietary page designs exactly
- generate fake customer quotes
- present generated facts as real

Competitor URLs may eventually be used as high-level inspiration only if a user explicitly supplies them, but do not reuse their assets or wording.

---

# 68. Optional Competitor Inspiration Architecture

Prepare an optional architecture for future support where a user can describe desired styles such as:

"premium dark gaming website"

or manually provide screenshots/reference descriptions.

Do not implement unauthorized website scraping as a requirement.

The design system should translate high-level style concepts into our own layout/components.

---

# 69. Model Configuration

Make the text model configurable through environment settings rather than hardcoding a model everywhere.

Example:

OPENAI_TEXT_MODEL=

Use structured output / JSON schema capabilities where available.

Use separate prompts for planning, writing, SEO, repair, and images.

---

# 70. Avoid Overengineering

The product must be robust but understandable.

Do not introduce:

Kubernetes
microservices
Kafka
complex event sourcing

unless truly needed.

A well-structured Next.js application + PostgreSQL + optional Redis + Docker is sufficient.

---

# 71. Start Working

First inspect the current repository.

If it is empty, initialize the complete project.

If files already exist, preserve useful work and integrate the architecture cleanly.

Then build the generator.

Do not return only an architecture document.

Do not give me pseudo-code instead of implementation.

Do not stop after scaffolding.

Do not ask me to manually create files you can create.

Do not leave TODO placeholders for core functionality.

When an API credential is unavailable, implement the integration completely using environment variables and provide mock/demo behavior for testing.

Keep working until the application satisfies the mandatory acceptance criteria.

At the end:

- run lint
- run TypeScript checks
- run tests
- run production build
- run Docker build
- verify Docker Compose
- fix errors found
- summarize architecture
- list setup commands
- list environment variables
- identify any non-blocking future improvements

The expected result is a genuinely ready-to-use AI website generator, not an example website.