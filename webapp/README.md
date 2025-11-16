# Hyperliquid Hackathon 2025 Webapp

## Installation

```bash
npm i
npm run dev
```

## Déploiement sur Netlify

### Configuration requise

1. **Variables d'environnement** à configurer dans Netlify :
   - `NEXT_PUBLIC_PRIVY_APP_ID` - ID de l'application Privy
   - `NEXT_PUBLIC_API_URL` - URL de l'API backend
   - `NEXT_PUBLIC_ZERODEV_BASE_RPC` - RPC ZeroDev pour Base
   - `NEXT_PUBLIC_BASE_HTTPS_PROVIDER` - Provider HTTPS pour Base (optionnel)
   - `NEXT_PUBLIC_ALCHEMY_BASE_RPC` - RPC Alchemy pour Base (optionnel)
   - `NEXT_PUBLIC_PIMLICO_BASE_BUNDLER_RPC` - RPC Pimlico Bundler pour Base (optionnel)

### Étapes de déploiement

1. **Via l'interface Netlify** :
   - Connectez votre repository GitHub/GitLab/Bitbucket
   - Netlify détectera automatiquement Next.js
   - Configurez les variables d'environnement dans `Site settings > Environment variables`
   - Déployez !

2. **Via Netlify CLI** :
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

### Configuration du build

Le fichier `netlify.toml` est déjà configuré avec :
- Build command: `npm run build`
- Publish directory: `.next`
- Plugin Next.js officiel de Netlify
- Node.js version 20

### Notes importantes

- Le projet utilise Next.js 15 avec App Router
- Le package manager par défaut est `pnpm` (mais npm fonctionne aussi)
- Assurez-vous que toutes les variables d'environnement sont configurées avant le déploiement
