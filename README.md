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

## 🛡️ Security & Configuration (Crucial)

Since this is a client-side application, managing your API key securely is critical, especially in public repositories.

1.  **Get your API Key**:
    Obtain a key from [Google AI Studio](https://aistudio.google.com/).

2.  **Configure Environment**:
    Create a `.env` file in the root directory. **DO NOT COMMIT THIS FILE**.
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

3.  **Verify Git Ignore**:
    Ensure your `.gitignore` includes `.env` to prevent accidental leaks to GitHub.

4.  **Apply API Key Restrictions (Production/Deployment)**:
    Because the API key is used in the browser, it is technically visible to the user. To prevent abuse:
    - Go to **Google Cloud Console > APIs & Services > Credentials**.
    - Edit your API Key.
    - Under **Application restrictions**, select **Websites**.
    - Add the URL of your deployed application (e.g., `https://kube-guardian.vercel.app`, `http://localhost:8080`).
    - Save changes. The key will now reject requests from any other domain.

## Local Development

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Production Build (Docker)

This project is optimized for Docker. The build process uses a multi-stage approach.

### Build the Image

```bash
# Pass the API Key as a build argument.
# WARNING: In a real CI/CD pipeline, ensure this variable is injected securely.
docker build --build-arg API_KEY=${API_KEY} -t kube-guardian .
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
