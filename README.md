# Pre-Legal Website

A web application to support pre-legal work for the justice department — helping users prepare legal documents efficiently using ready-made templates.

## Overview

This project provides a platform for creating, filling, and managing pre-legal documents before they move into formal legal or court workflows. The first working slice is a Mutual NDA builder: users can complete a cover page, preview the agreement, and download a Markdown document ready for review.

## Key Features (Planned)

- **Document templates** — Pre-built templates for common justice department documents
- **Guided document creation** — Step-by-step forms to fill in template fields
- **Template management** — Organize and maintain document templates in one place
- **User-friendly interface** — A clean frontend for non-technical staff and legal assistants

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | [Next.js](https://nextjs.org/) |
| Backend    | [FastAPI](https://fastapi.tiangolo.com/) |

## Project Structure

```
pre-legal-website/
├── src/          # React interface and document generation logic
├── templates/    # Common Paper legal agreement source documents
├── catalog.json  # Available template metadata
├── index.html
└── package.json
```

## Getting Started

Install dependencies and start the frontend development server:

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn

## License

To be determined.
