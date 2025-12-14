# Taxi Zagreb

A modern, responsive landing page for a taxi service operating in Zagreb, Croatia. Built with HTML and Tailwind CSS, containerized with Docker for easy deployment.

## Features

- **Responsive Design** - Mobile-first approach with seamless experience across all devices
- **Modern UI** - Dark theme with vibrant yellow accents, smooth animations, and elegant typography
- **WhatsApp Integration** - Direct booking via WhatsApp with pre-filled messages
- **Service Showcase** - Highlighted services including airport transfers, city transport, business rides, and night service
- **Fast Loading** - Single-page static site with CDN-loaded assets
- **SEO Ready** - Meta tags and Google site verification configured

## Tech Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first styling via CDN
- **Google Fonts** - Outfit font family
- **Docker** - Containerized deployment
- **nginx** - High-performance web server with gzip compression and caching

## Project Structure

```
alen-taxi-zagreb/
├── index.html      # Main landing page (all content and styling)
├── Dockerfile      # Container configuration using nginx:alpine
├── nginx.conf      # Web server configuration
└── README.md       # Project documentation
```

## Local Development

To view the site locally, simply open `index.html` in your browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

Or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .
```

Then visit `http://localhost:8080`

## Docker Deployment

### Build the Image

```bash
docker build -t taxi-zagreb .
```

### Run the Container

```bash
docker run -p 8080:8080 taxi-zagreb
```

The site will be available at `http://localhost:8080`

## Cloud Deployment

This project is configured for **Google Cloud Run** deployment:

- Listens on port **8080** (Cloud Run requirement)
- Uses lightweight `nginx:alpine` base image
- Includes gzip compression for faster load times
- Static asset caching enabled (1 year for CSS, JS, images, fonts)

### Deploy to Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/taxi-zagreb

# Deploy to Cloud Run
gcloud run deploy taxi-zagreb \
  --image gcr.io/PROJECT_ID/taxi-zagreb \
  --platform managed \
  --region europe-west4 \
  --allow-unauthenticated
```

## Services Offered

| Service | Description |
|---------|-------------|
| Airport Transfer | Reliable transport to/from Zagreb Airport |
| City Transport | Quick rides anywhere in Zagreb |
| Business Transport | Professional service for business travelers |
| Night Service | Safe late-night transportation |

## Contact

- **Phone**: +385 95 770 3853
- **WhatsApp**: [Send Message](https://wa.me/385957703853)
- **Location**: Zagreb, Croatia

---

© 2024 Taxi Zagreb. All rights reserved.

