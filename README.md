# Kube-Guardian

**Enterprise-grade AI SRE Agent for Kubernetes**

Kube-Guardian is a React-based dashboard that simulates a "Day 2" Operations Agent. It utilizes Google Gemini AI to perform Root Cause Analysis (RCA) on failing Kubernetes pods. It features a Zero-Trust architecture with client-side PII redaction before logs are sent to the LLM.

## Features

- **AI-Driven RCA**: Automatic detection and analysis of `CrashLoopBackOff`, `OOMKilled`, and other pod errors.
- **PII Redaction Engine**: Client-side Regex-based sanitization of IPs, Emails, and Keys.
- **Immutable Audit Log**: Tracks every analysis request and applied patch.
- **Multi-Cloud Support**: Visual indicators for AWS, GCP, and Azure workloads.
- **Simulated Chaos**: Includes a "Chaos Monkey" mode to randomly break pods for testing.

## Prerequisites

- Node.js 18+
- Docker (for containerized deployment)
- Google Gemini API Key

## Local Development

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory and add your API Key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Production Build (Docker)

This project is optimized for Docker. The build process uses a multi-stage approach:
1.  **Build Stage**: Node.js builds the static assets.
2.  **Serve Stage**: Nginx (Alpine) serves the optimized files.

### Build the Image

```bash
# You must pass the API Key as a build argument if you want it baked in (for demo purposes)
# Note: For real production, consider injecting the key at runtime via a config.js endpoint.
docker build --build-arg API_KEY=your_key_here -t kube-guardian .
```

### Run the Container

```bash
docker run -p 8080:80 kube-guardian
```

Access the dashboard at `http://localhost:8080`.

## Security Architecture

- **Redaction**: Logs are sanitized in `services/geminiService.ts` before API calls.
- **Nginx**: Configured with security headers (`X-Frame-Options`, `X-Content-Type-Options`).
- **Non-Root**: The application serves static files; consider configuring Nginx to run as non-root for stricter environments.
