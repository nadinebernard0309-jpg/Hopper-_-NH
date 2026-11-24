# Hopper · Atelier vélo

Mini site fictif du cours « Création de site web » (The Bridge).

- Lancer le site sur l'ordinateur : demander à Claude Code « Lance le site sur mon ordinateur ».
- Il faut Node.js (nodejs.org, version LTS).

## Déploiement sur Cloudflare Workers

Le site est publié par le Worker **hopper-site** (voir `wrangler.jsonc`), qui sert le dossier `dist/` produit par `npm run build`.

- Depuis l'ordinateur : `npm run deploy` (demande une connexion Cloudflare la première fois).
- Depuis GitHub (Workers Builds) : commande de build `npm run build`, commande de déploiement `npx wrangler deploy`.
- Les variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `VITE_SUPABASE_ANON_KEY` sont lues au moment du build : il faut les ajouter dans Cloudflare (Settings → Build → Variables), sinon le formulaire et le chatbot ne marchent pas en ligne.
