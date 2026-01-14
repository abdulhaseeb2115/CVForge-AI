# CVForge AI

**Precision-tailored resumes, powered by AI and LaTeX.**

Transform your CV into an ATS-optimized, job-tailored document with the precision of LaTeX and the intelligence of AI.

![CVForge AI Screenshot](./public/screenshot.png)

## ✨ Features

- **AI-Powered CV Generation**: Generate ATS-optimized LaTeX CVs using OpenAI GPT-4o-mini, Anthropic Claude, or Google Gemini
- **Multi-Provider Support**: Choose from multiple AI providers (OpenAI, Anthropic Claude, or Google Gemini)
- **Live LaTeX Editor**: Monaco editor with syntax highlighting for real-time LaTeX editing
- **Live PDF Preview**: See your CV changes instantly with real-time PDF preview
- **Server-Side LaTeX Compilation**: Reliable PDF generation using Docker-based LaTeX compilation service
- **Job Description Optimization**: Tailor your CV to specific job descriptions for maximum ATS compatibility
- **Modern UI**: Clean, professional interface built with Next.js 15 and React 19

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ (LTS version recommended)
- **npm** or **yarn** or **pnpm**
- **Docker** and **Docker Compose** (for LaTeX compilation service)
- **API Keys** (at least one of the following):
  - OpenAI API key
  - Anthropic API key
  - Google API key

## 📦 Installation

1. **Clone the repository**:

```bash
git clone https://github.com/abdulhaseeb2115/cvforge-ai.git
cd cvforge-ai
```

2. **Install dependencies**:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

Or using pnpm:

```bash
pnpm install
```

## ⚙️ Configuration

1. **Create a `.env` file** in the root directory:

```bash
cp .env.example .env
```

2. **Configure environment variables** in your `.env` file:

```env
# AI Provider API Keys (at least one is required)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# LaTeX Service Configuration
LATEX_SERVICE_URL=http://localhost:8080
```

### Getting API Keys

- **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
- **Google**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

> **Note**: You need at least one API key to use the application. The application will use the provider you select in the UI.

## 🚀 Running Locally

### Step 1: Start the LaTeX Compilation Service

The LaTeX service is required for PDF compilation. Start it using Docker Compose:

```bash
docker-compose up -d
```

This will start the LaTeX server on `http://localhost:8080`.

To verify the service is running:

```bash
curl http://localhost:8080/health
```

### Step 2: Start the Development Server

In a separate terminal, start the Next.js development server:

```bash
npm run dev
```

Or using yarn:

```bash
yarn dev
```

Or using pnpm:

```bash
pnpm dev
```

### Step 3: Open the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 Usage

1. **Prepare your CV**: Paste or upload your CV in JSON format
2. **Enter Job Description**: Paste the job description you want to optimize for
3. **Select AI Provider**: Choose from OpenAI, Claude, or Gemini
4. **Generate CV**: Click "Generate CV" to create an optimized LaTeX CV
5. **Edit LaTeX** (optional): Use the Monaco editor to customize the LaTeX code
6. **Preview PDF**: View the live PDF preview of your CV
7. **Download**: Click "Download PDF" to save your optimized CV

### Example CV JSON Format

```json
{
	"personalInfo": {
		"name": "John Doe",
		"email": "john.doe@example.com",
		"phone": "+1 (555) 123-4567",
		"location": "San Francisco, CA",
		"linkedin": "linkedin.com/in/johndoe",
		"github": "github.com/johndoe"
	},
	"summary": "Experienced software engineer...",
	"experience": [
		{
			"company": "Tech Company",
			"position": "Senior Software Engineer",
			"duration": "2020 - Present",
			"description": "Led development of..."
		}
	],
	"education": [
		{
			"degree": "BS in Computer Science",
			"university": "University of Example",
			"year": "2020"
		}
	],
	"skills": ["JavaScript", "TypeScript", "React", "Node.js"]
}
```

## 📚 API Documentation

### Generate LaTeX CV

**Endpoint**: `POST /api/generate`

**Request Body**:

```json
{
  "cv": {
    // Your CV object
  },
  "jd": "Job description text...",
  "provider": "openai" | "claude" | "gemini"
}
```

**Response**:

```json
{
	"latex": "\\documentclass{article}..."
}
```

### Compile LaTeX to PDF

**Endpoint**: `POST /api/compile`

**Request Body**:

```json
{
	"latex": "\\documentclass{article}..."
}
```

**Response**: PDF file (binary)

## 📁 Project Structure

```
cvforge-ai/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── generate/   # CV generation endpoint
│   │   │   └── compile/    # PDF compilation endpoint
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── latex-server/           # LaTeX compilation service
│   ├── Dockerfile          # Docker configuration
│   ├── server.js           # Express server
│   └── package.json        # Service dependencies
├── config/                 # Configuration files
├── docker-compose.yml      # Docker Compose configuration
├── package.json            # Project dependencies
└── README.md              # This file
```

## 🐳 Docker Deployment

### Build and Run with Docker

1. **Build the Docker image**:

```bash
docker build -t cvforge-ai .
```

2. **Run the container**:

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e GOOGLE_API_KEY=$GOOGLE_API_KEY \
  -e LATEX_SERVICE_URL=http://localhost:8080 \
  cvforge-ai
```

> **Note**: Ensure the LaTeX service is running separately or configure it in your Docker Compose setup.

### Docker Compose (Full Stack)

For a complete setup with both the Next.js app and LaTeX service:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - LATEX_SERVICE_URL=http://latex-server:8080
    depends_on:
      - latex-server

  latex-server:
    build: ./latex-server
    ports:
      - "8080:8080"
```

## 🧪 Development

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

### Building for Production

```bash
npm run build
```

### Running Production Build

```bash
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), and [Google](https://ai.google.dev)
- LaTeX compilation with [TeX Live](https://www.tug.org/texlive/)
- Code editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ by the CVForge AI team
