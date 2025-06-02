# terminalgame

A terminal-based game application. (Please update this description with more details about the game).

## Features
- (Add features here)

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm (or pnpm, if `pnpm-lock.yaml` is used)

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/igor-kan/terminalgame.git
    cd terminalgame
    ```
2. Install dependencies:
    ```bash
    npm install 
    # or
    # pnpm install
    ```

### Running the Development Server
To start the development server, run:
```bash
npm run dev
# or
# pnpm dev
```
This will typically start the server on `http://localhost:3000`.

## Technologies Used
- (Likely Next.js, React, Tailwind CSS based on typical project structure, please confirm and update)

## Deployment (GitHub Pages)

You can deploy this project to GitHub Pages:

1. **Build the static site:**
   Many Next.js apps require `next export` after `next build` for static site generation. If this project is a standard Next.js app, you might need to update `package.json` scripts.
    ```bash
    npm run build 
    # Potentially: npm run export (if using Next.js static export)
    ```
2. **Install `gh-pages`:**
    ```bash
    npm install --save-dev gh-pages
    ```
3. **Update `package.json`:**
    Add `homepage` and `scripts` for deployment. The `deploy` script might need to point to the `out` directory if using `next export`.
    ```json
    {
      "homepage": "https://igor-kan.github.io/terminalgame",
      "scripts": {
        "predeploy": "npm run build", // or "npm run build && npm run export"
        "deploy": "gh-pages -d out" // or "-d build" or "-d dist" depending on the build output
      }
    }
    ```
    **Note:** Verify the correct build output directory (`out`, `build`, `dist`, etc.).
4. **Deploy:**
    ```bash
    npm run deploy
    ```

## Custom Domain
You can connect a custom domain to your deployed project. Refer to your hosting provider's documentation for instructions. 