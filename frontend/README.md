# CyberDesk — Frontend

Interface React + TypeScript + Vite pour la gestion d'un cyber-café. Cette première version utilise des données de démonstration côté client : elle ne contacte pas encore les services backend.

## Prérequis
- Node.js 20+
- npm

## Lancer en local
```bash
cd frontend
npm install
npm run dev
```

Ouvrir l'URL affichée par Vite (par défaut http://localhost:5173).

## Build de production
```bash
npm run build
npm run preview
```

## Prochaine étape
Connecter l'authentification FastAPI et le service clients NestJS, puis remplacer les données de démonstration par les réponses API.
