# Clipboard Share

A simple, public clipboard sharing web app built with Flask. Paste text, links, images, or files and share them via a unique URL.

## Features

- **Text & Links** — Auto-detects URLs, renders markdown with syntax highlighting
- **Image Paste** — Ctrl+V images directly onto the page
- **File Upload** — Upload any file type; images render inline, others offer download
- **Dark/Light Mode** — Auto-detects system preference, manual toggle available
- **Copy to Clipboard** — One-click copy for text, links, and images
- **Pagination** — 5 items per page with prev/next navigation
- **Delete** — Confirmation modal before deletion

## Tech Stack

- **Backend:** Flask, SQLAlchemy, Python 3.11, Gunicorn
- **Frontend:** Tailwind CSS (CLI), Jinja2, vanilla JS
- **Database:** SQLite (dev), PostgreSQL (prod)
- **Containerization:** Docker, Docker Compose

## Quick Start

### Development (SQLite)

```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Install Tailwind CSS dependencies
npm install

# Build Tailwind CSS
npx @tailwindcss/cli -i assets/css/input.css -o assets/css/output.css --minify

# Run the app
python app.py
```

App runs at `http://localhost:5000`.

### Production (Docker)

```bash
docker compose up --build
```

App runs at `http://localhost:8000`.

## Environment Variables

| Variable      | Description                          | Default                                        |
|---------------|--------------------------------------|------------------------------------------------|
| `APP_ENV`     | `dev` or `prod`                      | `dev` (SQLite)                                 |
| `DATABASE_URL`| PostgreSQL connection string         | `postgresql://clipboard:clipboard@db:5432/clipboard` |

## Project Structure

```
clipboard_share/
├── app.py                  # Flask app, routes, config
├── extensions.py           # SQLAlchemy instance
├── models.py               # ClipboardItem model
├── requirements.txt        # Python dependencies
├── package.json            # Node dependencies (Tailwind CLI)
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # App + PostgreSQL
├── .env                    # Environment config
├── templates/
│   └── index.html          # Single-page template
├── assets/
│   ├── css/
│   │   ├── input.css       # Tailwind v4 config
│   │   ├── output.css      # Built Tailwind output
│   │   └── style.css       # Custom styles
│   └── js/
│       └── app.js          # Client-side logic
└── instance/               # SQLite database (dev)
```

## API

| Method   | Endpoint              | Description              |
|----------|-----------------------|--------------------------|
| `GET`    | `/`                   | Main page                |
| `POST`   | `/paste`              | Submit content (form)    |
| `DELETE` | `/item/<id>`          | Delete an item           |
| `GET`    | `/item/<id>/download` | Download a file          |

## License

MIT
