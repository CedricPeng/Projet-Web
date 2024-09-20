Modules node:
- npm install express
- npm install ejs
- npm install pg
- npm install express-session
- npm install crypto-js
- npm install multer

Initialiser la base de donnée:
- lancer psql : psql -U postgres 
- Mot de Passe : root 
- se connecter à la base de donnée postgres en faisant \c postgres
- exécuter : " \i database.sql " pour créer les tables nécessaire au bon fonctionnement du site.

Exécuter le projet:
- node serveur.js
- aller à l'adresse http://localhost:8080/