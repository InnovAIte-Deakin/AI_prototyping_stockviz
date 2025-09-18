## Project info

**URL**: https://lovable.dev/projects/e86b1806-d95a-4df8-bbcb-08124bfe5816

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e86b1806-d95a-4df8-bbcb-08124bfe5816) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Docker Deployment (Recommended)

This project can be deployed as a single Docker container that serves both the frontend and backend.

#### Prerequisites
- Docker installed on your system
- Docker Hub account (for sharing)

#### Build and Run Locally

```bash
# Build the Docker image
docker build -t stock-analysis-app .

# Run the container
docker run -p 3001:3001 stock-analysis-app
```

The application will be available at `http://localhost:3001`

#### Deploy to Docker Hub

```bash
# Tag your image for Docker Hub
docker tag stock-analysis-app your-username/stock-analysis-app:latest

# Push to Docker Hub
docker push your-username/stock-analysis-app:latest
```

#### Run from Docker Hub

```bash
# Pull and run from Docker Hub
docker run -p 3001:3001 your-username/stock-analysis-app:latest
```

#### Environment Variables

The application uses the following environment variables (optional):
- `ALPHA_VANTAGE_API_KEY`: Your Alpha Vantage API key
- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (defaults to 3001)

Example with environment variables:
```bash
docker run -p 3001:3001 \
  -e ALPHA_VANTAGE_API_KEY=your_key_here \
  -e GEMINI_API_KEY=your_gemini_key_here \
  stock-analysis-app
```

### Alternative Deployment

Simply open [Lovable](https://lovable.dev/projects/e86b1806-d95a-4df8-bbcb-08124bfe5816) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
