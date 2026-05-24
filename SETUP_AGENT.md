# Step 1 — Install Gemini SDK
cd "c:\programming files of my\cricAi"
npm install @google/generative-ai --prefix server

# Step 2 — Add your API key to server/.env
# Open server/.env and add:
# GEMINI_API_KEY=your_key_here
# Get free key at: https://aistudio.google.com/

# Step 3 — Run the app
npm run dev
