# Arc Finance

AI-powered stablecoin finance dashboard with command bar.

## Setup

```bash
npm install
cp .env.example .env
# Add your Anthropic API key to .env
npm start
```

## Deploy

### Vercel (Recommended)
1. Push to GitHub
2. Import repo on vercel.com
3. Add REACT_APP_ANTHROPIC_API_KEY env var
4. Deploy

### GitHub Pages
```bash
# Add homepage to package.json first:
# "homepage": "https://YOUR_USERNAME.github.io/arc-finance"
npm run deploy
```

## Features
- AI Command Bar (⌘K)
- Stablecoin Analytics Dashboard
- Arc Testnet Wallet (mock RainbowKit/Wagmi)
- Automation Rules Engine
- Merchant Analytics
- Real Claude AI integration
