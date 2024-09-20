const data = require('./public/JS/database.js');
const express = require('express');
const app = express();
const port = 8080;
const session = require('express-session');
const crypto = require('crypto-js');
const ejs = require('ejs');
const multer = require('multer');
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'cLésecrète!test',
    resave: false,
    saveUninitialized: true
}));

data.insertArticleDetails();
data.addRandomArticlesToPromo();

//client
app.get('/', async (req, res) => {
    try {
        let articlesWithPrice = await data.getAllArticlesWithPrice();
        // on est connecté
        if (req.session.username) {
            let points = await data.getPoint(req.session.username);
            const userId = await data.getUserId(req.session.username);
            let panier = await data.getPanier(userId[0].id, req.session.isBirthday);
            let pointsValue = points[0].nbr_points;
            let prixTotal = await data.calculateTotalCostPanier(userId[0].id, req.session.isBirthday);
            let nbArticle = await data.countArticlesInPanier(userId[0].id);
            res.render('accueil.ejs', { fonction: 'client', gerant: false, connected: true, erreur: false, articlesWithPrice: articlesWithPrice, username: req.session.username, points: pointsValue, userId: userId[0].id, panier, prixTotal, nbArticle, isBirthday: req.session.isBirthday });
        } // pas connecté
        else {
            res.render('accueil.ejs', { fonction: 'client', gerant: false, connected: false, erreur: false, articlesWithPrice: articlesWithPrice });
        }
    } catch (error) {
        console.error("Une erreur s'est produite lors de la récupération des articles avec prix :", error);
        res.status(500).send("Erreur lors de la récupération des articles avec prix.");
    }
});


app.get('/gerante', async (req, res) => {
    try {
        if (req.session.username) {
            let articles = await data.getAllArticles();
            let articlesWithSize = await data.getAllArticlesWithSize();
            let articlesWithColor = await data.getAllArticlesWithColor();
            let users = await data.getAllUsers();
            res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: true, erreur: false, username: req.session.username, users: users, articles: articles, articlesWithSize: articlesWithSize, articlesWithColor: articlesWithColor, isBirthday: req.session.isBirthday });
        }
        else {
            res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: false, erreur: false });
        }
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles :", error);
        res.status(500).send("Erreur lors de la sélection des articles.");
    }
});


// Fonction pour gérer la vérification de l'utilisateur
async function handleVerification(req, res, gerant) {
    const username = req.body.username;
    const password = req.body.password;
    console.log(username, password, gerant);
    try {
        const hashedPasswordInput = crypto.SHA256(password).toString();
        let result = await data.verif(username, hashedPasswordInput, gerant);
        let articlesWithPrice = await data.getAllArticlesWithPrice();
        // Gérer les différents types en fonction du résultat de la vérification
        let type;
        if (result === 0) {
            // Si l'authentification réussit, créer une session
            // On ajoute des champs username et gérant à la session
            req.session.username = username;
            req.session.gerant = gerant;
            const userId = await data.getUserId(req.session.username);
            const birthDate = await data.getBirthDate(userId[0].id);
            req.session.birthDate = birthDate[0].datenaissance.toISOString().split('T')[0];
            const dateNaiss = new Date(req.session.birthDate);
            const dateActu = new Date(new Date().toISOString().split('T')[0]);
            const jour = dateActu.getDate();
            const mois = dateActu.getMonth() + 1;
            const jourNaiss = dateNaiss.getDate();
            const moisNaiss = dateNaiss.getMonth() + 1;
            if ((jour != jourNaiss || mois != moisNaiss)) {
                req.session.isBirthday = false;
            }
            else {
                req.session.isBirthday = true;
            }
            type = "bon";
        } else if (result === 1) {
            // Utilisateur inconnu (aucun utilisateur trouvé avec ce nom d'utilisateur)
            type = "inconnu";
        } else if (result === 2) {
            // Mauvais mot de passe (utilisateur trouvé mais le mot de passe est incorrect)
            type = "mauvaisMdp";
        } else {
            type = "erreur";
        }
        // Rendre la vue en fonction du résultat et du type
        if (result === 0) {
            if (gerant) {// connection en tant que gérant
                let articles = await data.getAllArticles();
                let users = await data.getAllUsers();
                let articlesWithSize = await data.getAllArticlesWithSize();
                let articlesWithColor = await data.getAllArticlesWithColor();
                res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: true, erreur: false, username: req.session.username, users: users, articles: articles, articlesWithSize: articlesWithSize, articlesWithColor: articlesWithColor, isBirthday: req.session.isBirthday });
            }
            else {// connection en tant que client
                let points = await data.getPoint(username);
                let pointsValue = points[0].nbr_points;
                const userId = await data.getUserId(username);
                let panier = await data.getPanier(userId[0].id, req.session.isBirthday);
                let prixTotal = await data.calculateTotalCostPanier(userId[0].id, req.session.isBirthday);
                let nbArticle = await data.countArticlesInPanier(userId[0].id);

                res.render('accueil.ejs', { fonction: 'client', gerant: false, connected: true, erreur: false, username: req.session.username, articlesWithPrice: articlesWithPrice, points: pointsValue, panier, prixTotal, userId: userId[0].id, nbArticle, isBirthday: req.session.isBirthday });
            }
            //erreur de connection
        } else {
            if (gerant) {
                res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: false, erreur: true, type: type, });
            }
            else {
                res.render('accueil.ejs', { fonction: 'client', gerant: false, connected: false, erreur: true, type: type, articlesWithPrice: articlesWithPrice });
            }
        }
    } catch (error) {
        console.error("Une erreur s'est produite lors de la vérification de l'utilisateur :", error);
        res.status(500).send("Erreur lors de la vérification de l'utilisateur.");
    }
}

// Fonction de gestion pour l'ajout de membre
async function handleAjoutMembre(req, res, next) {
    try {
        // Crypter le mot de passe
        const hashedPassword = crypto.SHA256(req.body.newpassword).toString();

        // Requête pour ajouter un membre avec le mot de passe crypté
        await data.addUser(req.body.newuser, hashedPassword, req.body.dateNaissance, req.body.points);

        console.log("Membre ajouté avec succès !");
        let articlesWithSize = await data.getAllArticlesWithSize();
        let articlesWithColor = await data.getAllArticlesWithColor();
        let users = await data.getAllUsers();
        let articles = await data.getAllArticles();
        res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: true, erreur: false, username: req.session.username, users: users, articles: articles, articlesWithSize: articlesWithSize, articlesWithColor: articlesWithColor, isBirthday: req.session.isBirthday });
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'ajout du membre :", error);
        res.status(500).send("Erreur lors de l'ajout du membre.");
    }
}

// Fonction de gestion pour l'ajout d'article
async function handleAjoutArticle(req, res, next) {
    try {
        const tailleListe = req.body.tailles.split(',');
        const couleurListe = req.body.couleurs.split(',');
        await data.addArticle(req.body.nom, req.body.prix, req.body.description, couleurListe, tailleListe, req.file.filename);
        let articlesWithSize = await data.getAllArticlesWithSize();
        let articlesWithColor = await data.getAllArticlesWithColor();
        let users = await data.getAllUsers();
        let articles = await data.getAllArticles();
        res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: true, erreur: false, username: req.session.username, users: users, articles: articles, articlesWithSize: articlesWithSize, articlesWithColor: articlesWithColor, isBirthday: req.session.isBirthday });
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'ajout de l'article :", error);
        res.status(500).send("Erreur lors de l'ajout de l'article.");
    }
}

// Fonction de gestion pour la modification d'article
async function handleModifArticle(req, res, next) {
    try {
        const tailleListe = req.body.taillesModif.split(',');
        const couleurListe = req.body.couleursModif.split(',');
        if (req.file) {
            await data.updateArticle(req.body.idArticle, req.body.nomArticleModif, req.body.prixModif, req.body.descriptionModif, couleurListe, tailleListe, req.file.filename);
        }
        else {
            await data.updateArticleNoImg(req.body.idArticle, req.body.nomArticleModif, req.body.prixModif, req.body.descriptionModif, couleurListe, tailleListe);
        }
        let users = await data.getAllUsers();
        let articles = await data.getAllArticles();
        let articlesWithSize = await data.getAllArticlesWithSize();
        let articlesWithColor = await data.getAllArticlesWithColor();
        res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: true, erreur: false, username: req.session.username, users: users, articles: articles, articlesWithSize: articlesWithSize, articlesWithColor: articlesWithColor, isBirthday: req.session.isBirthday });
    } catch (error) {
        console.error("Une erreur s'est produite lors de la modification de l'article :", error);
        res.status(500).send("Erreur lors de la modification de l'article.");
    }
}

// Fonction de gestion pour la suppression d'article
async function handleSupprArticle(req, res, next) {
    try {
        await data.deleteArticle(req.body.idArticle);
        res.status(200).json({ message: "L'article a été supprimé avec succès." });
    } catch (error) {
        console.error("Une erreur s'est produite lors de la suppression de l'article :", error);
        res.status(500).send("Erreur lors de la suppression de l'article.");
    }
}

// Fonction de gestion pour la modification d'un membre
async function handleModifMembre(req, res, next) {
    try {
        await data.updateUser(req.body.idMembre, req.body.usernameModif, crypto.SHA256(req.body.passwordModif).toString(), req.body.dateModif, req.body.pointsModif);
        let articlesWithSize = await data.getAllArticlesWithSize();
        let articlesWithColor = await data.getAllArticlesWithColor();
        let users = await data.getAllUsers();
        let articles = await data.getAllArticles();
        res.render('accueil.ejs', { fonction: 'gérant', gerant: true, connected: true, erreur: false, username: req.session.username, users: users, articles: articles, articlesWithSize: articlesWithSize, articlesWithColor: articlesWithColor, isBirthday: req.session.isBirthday });
    } catch (error) {
        console.error("Une erreur s'est produite lors de la modification du membre :", error);
        res.status(500).send("Erreur lors de la modification du membre.");
    }
}

// Fonction de gestion pour la suppression d'un membre
async function handleSupprMembre(req, res, next) {
    try {
        await data.deleteUser(req.body.idMembre);
        res.status(200).json({ message: "Le membre a été supprimé avec succès." });
    } catch (error) {
        console.error("Une erreur s'est produite lors de la suppression du membre :", error);
        res.status(500).send("Erreur lors de la suppression du membre.");
    }
}

// Gestionnaire de route pour '/'
app.post('/', async (req, res) => {
    await handleVerification(req, res, false);
});

// Pour stocker les images
const storage = multer.diskStorage({
    // Dossier ou les images seront stockées
    destination: function (req, file, cb) {
        cb(null, './public/images');
    },
    // Nom de l'image
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Gestionnaire de route pour '/gerante'
app.post('/gerante', upload.single('image'), async (req, res, next) => {
    // Si le formulaire soumis est pour l'ajout de membre
    if (req.body.newuser && req.body.newpassword && req.body.dateNaissance && req.body.points) {
        // Traitement de l'ajout de membre
        await handleAjoutMembre(req, res, next);
    }
    else if (req.body.nom && req.body.prix && req.body.description && req.body.couleurs && req.body.tailles) {
        // Traitement de l'ajout d'article
        await handleAjoutArticle(req, res, next);
    }
    else if (req.body.nomArticleModif && req.body.prixModif && req.body.descriptionModif && req.body.idArticle && req.body.couleursModif && req.body.taillesModif) {
        // Traitement de la modification d'article
        await handleModifArticle(req, res, next);
    }
    else if (req.body.idArticle) {
        // Traitement de la suppression d'article
        await handleSupprArticle(req, res, next);
    }
    else if (req.body.usernameModif && req.body.passwordModif && req.body.dateModif && req.body.pointsModif && req.body.idMembre) {
        // Traitement de la modification du membre
        await handleModifMembre(req, res, next);
    }
    else if (req.body.idMembre) {
        // Traitement de la suppression du membre
        await handleSupprMembre(req, res, next);
    }
    else if (req.body.username && req.body.password) {
        // Action normale de connexion du gérant
        await handleVerification(req, res, true);
    }
    else {
        res.status(400).send("Erreur dans le formulaire.");
    }
});

app.get('/logout', async (req, res) => {
    // Détruire la session lors de la déconnexion
    wasGerant = req.session.gerant;
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur durant la déconnexion:', err);
            res.status(500).send('Erreur lors de la déconnexion.');
        } else {
            console.log('Déconnexion reussie.');
            if (wasGerant === true) {
                res.redirect('/gerante');
            } else {
                res.redirect('/');
            }
        }
    });
});

app.get('/nosProduits', async (req, res) => {
    const { user_id, connected } = req.query;
    let articlesWithPrice = await data.getAllArticlesWithPrice();
    let articlesWithColor = await data.getAllArticlesWithColor();
    let articlesWithSize = await data.getAllArticlesWithSize();
    if (req.session.username) { // connecté
        let points = await data.getPoint(req.session.username);
        let pointsValue = points[0].nbr_points;
        let panier = await data.getPanier(user_id, req.session.isBirthday);
        res.render('nosProduits.ejs', { connected: true, articlesWithPrice, userId: user_id, panier, points: pointsValue, articlesWithColor, articlesWithSize, erreur: false, isBirthday: req.session.isBirthday }, (err, html) => {
            if (err) {
                console.error('Erreur lors du rendu de nosProduits.ejs :', err);
                res.status(500).send('Erreur lors du rendu');
            } else {
                res.send(html);
            }
        });
    }
    else {
        res.render('nosProduits.ejs', { connected: false, articlesWithPrice, articlesWithColor, articlesWithSize, erreur: false }, (err, html) => {
            if (err) {
                console.error('Erreur lors du rendu de nosProduits.ejs :', err);
                res.status(500).send('Erreur lors du rendu');
            } else {
                res.send(html);
            }
        });
    }
});

app.get('/promo', async (req, res) => {
    const { user_id, connected } = req.query;
    let articlesWithPromo = await data.getAllPromoArticles();
    let articlesWithColor = await data.getAllArticlesWithColor();
    let articlesWithSize = await data.getAllArticlesWithSize();

    if (req.session.username) { // connecté
        let points = await data.getPoint(req.session.username);
        let pointsValue = points[0].nbr_points;
        let panier = await data.getPanier(user_id, req.session.isBirthday);
        res.render('promo.ejs', { connected: true, articlesWithPromo, userId: user_id, panier, points: pointsValue, articlesWithColor, articlesWithSize, erreur: false, isBirthday: req.session.isBirthday }, (err, html) => {
            if (err) {
                console.error('Erreur lors du rendu de nosProduits.ejs :', err);
                res.status(500).send('Erreur lors du rendu');
            } else {
                res.send(html);
            }
        });
    }
    else {
        res.render('promo.ejs', { connected: false, articlesWithPromo, articlesWithColor, articlesWithSize, erreur: false, isBirthday: req.session.isBirthday }, (err, html) => {
            if (err) {
                console.error('Erreur lors du rendu de nosProduits.ejs :', err);
                res.status(500).send('Erreur lors du rendu');
            } else {
                res.send(html);
            }
        });
    }
});

app.get('/historique', async (req, res) => {
    const { user_id } = req.query;
    let points = await data.getPoint(req.session.username);
    let pointsValue = points[0].nbr_points;
    let panier = await data.getPanier(user_id, req.session.isBirthday);
    let historique = await data.getDejaAchete(user_id);
    res.render('historique.ejs', { connected: true, historique, userId: user_id, panier, points: pointsValue, erreur: false, isBirthday: req.session.isBirthday }, (err, html) => {
        if (err) {
            console.error('Erreur lors du rendu de nosProduits.ejs :', err);
            res.status(500).send('Erreur lors du rendu');
        } else {
            res.send(html);
        }
    });
});

app.post('/moinsArticle', async (req, res) => {
    const { user_id, article_id } = req.body;
    try {
        await data.removeQuantityFromPanier(user_id, article_id, 1);
        const panier = await data.getPanier(user_id, req.session.isBirthday);
        let nbArticle = await data.countArticlesInPanier(user_id);
        let points = await data.getPoint(req.session.username);
        let pointsValue = points[0].nbr_points;
        let prixTotal = await data.calculateTotalCostPanier(user_id, req.session.isBirthday);
        res.json({ success: true, panier, nbArticle, pointsValue, prixTotal });
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la suppression de la quantité dans le panier :', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la quantité dans le panier.' });
    }
});


// Endpoint POST pour ajouter un article au panier
app.post('/addPanier', async (req, res) => {
    const { user_id, article_id, color, size, promoOrNot } = req.body;

    try {
        let affiche;
        let articleDetails;
        
        if (req.session.isBirthday === false) {
            articleDetails = await data.getArticle(article_id, req.session.isBirthday);
            affiche = promoOrNot;
        }
        else {
            articleDetails = await data.getArticle(article_id, req.session.isBirthday);
            affiche = !await data.isArticleInPromo(article_id);
        }
        // Récupérer les données nécessaires à l'ajout de l'article
        const [totalCost, userPoints, articleCount] = await Promise.all([
            data.calculateTotalCostPanier(user_id, req.session.isBirthday),
            data.getPoint(req.session.username),
            data.countArticlesInPanier(user_id)
        ]);


        if (!articleDetails || articleDetails.length === 0) {
            // L'article spécifié n'existe pas ou n'a pas été trouvé
            return res.status(404).json({ error: 'L\'article spécifié n\'existe pas.' });
        }

        const prix = articleDetails[0].prix;
        const pointsValue = userPoints[0].nbr_points;
        const panier = await data.getPanier(user_id, req.session.isBirthday);
        if (totalCost + prix > pointsValue) {
            // Le prix total du panier dépasserait le nombre de points disponibles
            return res.json({ success: false, panier, nbArticle: articleCount, prixTotal: totalCost, pointsValue });
        }

        // Ajouter l'article au panier si les conditions sont remplies
        await data.addPanier(user_id, article_id, color, size);

        // Mettre à jour les données du panier après l'ajout
        let updatedPanier = await data.getPanier(user_id, req.session.isBirthday);
        let updatedTotalCost = await data.calculateTotalCostPanier(user_id, req.session.isBirthday);
        const updatedArticleCount = await data.countArticlesInPanier(user_id);

        // Répondre avec succès et retourner les données mises à jour
        res.json({ success: true, panier: updatedPanier, nbArticle: updatedArticleCount, prixTotal: updatedTotalCost, pointsValue, affiche });

    } catch (error) {
        console.error('Une erreur s\'est produite lors de l\'ajout de l\'article au panier :', error);
        // Répondre avec un code d'erreur approprié et un message d'erreur
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'article au panier.' });
    }
});



app.post('/viderPanier', async (req, res) => {
    const user_id = req.body.user_id; // Récupérer l'ID de l'utilisateur depuis les données POST

    try {
        const success = await data.viderPanierUtilisateur(user_id);
        const panier = await data.getPanier(user_id, req.session.isBirthday);
        let points = await data.getPoint(req.session.username);
        let pointsValue = points[0].nbr_points;
        if (success) {
            res.json({ success: true, panier, pointsValue });
        } else {
            res.json({ success: false, panier });
        }
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la suppression du panier :', error);
        res.status(500).send('Erreur lors de la suppression du panier.');
    }
});

app.post('/validerPanier', async (req, res) => {
    const user_id = req.body.user_id; // Récupérer l'ID de l'utilisateur depuis les données POST
    try {
        let ajoute = await data.validatePanier(user_id, req.session.isBirthday); // on ajoute les articles dans la table dejaAchete
        if (ajoute.success) {
            const success = await data.viderPanierUtilisateur(user_id); // on vide le panier
            const panier = await data.getPanier(user_id, req.session.isBirthday);
            let points = await data.getPoint(req.session.username);
            let nvPoints = points[0].nbr_points;
            if (success) {
                res.json({ success: true, panier, nvPoints });
            } else {
                res.json({ success: false, panier });
            }
        } else {
            console.error('Une erreur s\'est produite lors de la validation du panier ');
            res.status(500).send('Erreur lors de la validation du panier.');
        }
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la validation du panier :', error);
        res.status(500).send('Erreur lors de la validation du panier.');
    }
});


app.use((req, res, next) => {
    const gerant = req.session && req.session.gerant; // Récupérer la valeur de gerant depuis la session si disponible

    // Définir le lien de retour en fonction de la valeur de gerant
    const retourAccueilLink = gerant ? '/' : '/gerante';
    const retourAccueilText = gerant ? 'Retour à l\'accueil' : 'Retour à l\'accueil';

    // Envoyer la réponse avec le lien approprié
    res.status(404).send(`Page introuvable. <a href="${retourAccueilLink}">${retourAccueilText}</a>`);
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

