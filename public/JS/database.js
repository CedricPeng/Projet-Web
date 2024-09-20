const crypto = require('crypto-js');
const pg = require('pg');
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'root',
    port: 5432
});

pool.connect()
    .then(() => {
        console.log("connected");
    })
    .catch(() => {
        console.error("error ");
    });

async function verif(userName, password, gerant) {
    try {
        // Exécuter une requête pour vérifier si l'utilisateur existe
        const result = await pool.query("SELECT username, password, gerant FROM users WHERE username = $1", [userName]);

        // Vérifier le résultat de la requête
        if (result.rows.length === 0) {
            return 1;
        }
        // Vérifier le mot de passe correspondant
        const user = result.rows[0];
        if ((crypto.SHA256(user.password).toString() === password || user.password === password) && gerant === user.gerant) {
            return 0;
        } else {
            return 2;
        }
    } catch (error) {
        // Gérer les erreurs
        console.error("Une erreur s'est produite lors de la vérification de l'utilisateur :", error);
        return -1; // Erreur non spécifiée
    }
}

async function getAllUsers() {
    try {
        const result = await pool.query("SELECT id, username, password, dateNaissance, nbr_points  FROM users WHERE gerant = false");
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des utilisateurs :", error);
        return null;
    }
}

async function getAllArticles() {
    try {
        const result = await pool.query("SELECT nom, prix, description, id, chemin_image FROM articles");
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles :", error);
        return null;
    }
}

async function addUser(username, password, dateNaissance, nbrPoints) {
    try {
        const result = await pool.query("INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ($1, $2, $3, $4, $5)", [username, password, dateNaissance, false, nbrPoints]);
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'ajout de l'utilisateur :", error);
        return null;
    }
}

async function addArticle(nom, prix, description, couleurListe, tailleListe, cheminImage) {
    try {
        const result = await pool.query("INSERT INTO articles (chemin_image, nom, prix, description) VALUES ($1, $2, $3, $4) RETURNING id", [cheminImage, nom, prix, description]);
        const articleId = result.rows[0].id;

        couleurListe.forEach(couleur => {
            console.log(couleur.trim());
            try {
                pool.query("INSERT INTO articlecouleurs (couleur, article_id) VALUES ($1, $2)", [couleur.trim(), articleId]);
            } catch (error) {
                console.error("Une erreur s'est produite lors de l'ajout de l'article :", error);
            }
        });
        console.log(tailleListe, couleurListe);
        tailleListe.forEach(taille => {
            console.log(taille.trim());
            pool.query("INSERT INTO articletailles (taille, article_id) VALUES ($1, $2)", [taille.trim(), articleId]);
        });
        console.log("Article ajouté avec succès !");
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'ajout de l'article :", error);
        return null;
    }
}

async function getAllArticlesWithPrice() {
    try {
        const result = await pool.query("SELECT id, nom, prix, description, chemin_image FROM articles");
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles avec points :", error);
        return null;
    }
}

async function getAllArticlesWithColor() {
    try {
        const result = await pool.query("SELECT DISTINCT a.id, a.nom, a.prix, a.description, ac.article_id, ac.couleur FROM articles a JOIN articlecouleurs ac ON a.id = ac.article_id");
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles avec couleur et taille :", error);
        return null;
    }
}

async function getAllArticlesWithSize() {
    try {
        const result = await pool.query("SELECT DISTINCT a.id, a.nom, a.prix, a.description, at.article_id, at.taille FROM articles a JOIN articletailles at ON a.id = at.article_id");
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles avec couleur et taille :", error);
        return null;
    }
}


async function getPoint(username) {
    try {
        const result = await pool.query("SELECT nbr_points FROM users WHERE username = $1", [username]);
        // console.log(result.rows);
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des points :", error);
        return null;
    }
}

async function removeQuantityFromPanier(user_id, article_id, quantityToRemove) {
    try {
        // Vérifier si l'utilisateur avec l'ID spécifié existe dans la table users
        const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userExists.rows.length === 0) {
            console.error("L'utilisateur avec l'ID spécifié n'existe pas.");
            return false; // Retourner false si l'utilisateur n'existe pas
        }

        // Vérifier si l'article avec l'ID spécifié existe dans la table articles
        const articleExists = await pool.query("SELECT id FROM articles WHERE id = $1", [article_id]);
        if (articleExists.rows.length === 0) {
            console.error("L'article avec l'ID spécifié n'existe pas.");
            return false; // Retourner false si l'article n'existe pas
        }

        // Vérifier si l'article avec la quantité spécifiée existe dans le panier de l'utilisateur
        const panierItem = await pool.query("SELECT id, quantite FROM panier WHERE user_id = $1 AND article_id = $2", [user_id, article_id]);

        if (panierItem.rows.length === 0) {
            console.error("L'article n'est pas présent dans le panier de l'utilisateur.");
            return false; // Retourner false si l'article n'est pas dans le panier
        }

        const currentQuantite = panierItem.rows[0].quantite;
        const newQuantite = currentQuantite - quantityToRemove;

        if (newQuantite <= 0) {
            // Si la nouvelle quantité est inférieure ou égale à zéro, supprimer complètement l'article du panier
            await pool.query("DELETE FROM panier WHERE id = $1", [panierItem.rows[0].id]);
            // console.log("Article complètement supprimé du panier !");
        } else {
            // Mettre à jour la quantité de l'article dans le panier
            await pool.query("UPDATE panier SET quantite = $1 WHERE id = $2", [newQuantite, panierItem.rows[0].id]);
            // console.log("Quantité de l'article mise à jour dans le panier !");
        }

        return true; // Retourner true pour indiquer que l'opération s'est bien déroulée
    } catch (error) {
        console.error("Une erreur s'est produite lors de la suppression de la quantité dans le panier :", error);
        return false; // Retourner false en cas d'erreur
    }
}


async function getUserId(username) {
    try {
        const result = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection de l'userId :", error);
        return null;
    }
}

async function getBirthDate(userId) {
    try {
        const result = await pool.query("SELECT dateNaissance FROM users WHERE id = $1", [userId]);
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection de la date de naissance :", error);
        return null;
    }
}

async function getPanier(userId, isBirthday) {
    try {
        const result = await pool.query("SELECT p.article_id, p.quantite, p.couleur, p.taille, a.chemin_image FROM panier p JOIN articles a ON p.article_id = a.id WHERE user_id = $1", [userId]);
        const panier = result.rows;
        //console.log(panier);
        // Tableau pour stocker les détails des articles dans le panier
        const panierDetails = [];

        // Parcours chaque élément du panier
        for (let i = 0; i < panier.length; i++) {
            const articleId = panier[i].article_id;
            const quantite = panier[i].quantite;
            const couleur = panier[i].couleur;
            const taille = panier[i].taille;
            const chemin_image = panier[i].chemin_image;

            // Appel de la fonction getArticle pour obtenir les détails de l'article
            const articleDetails = await getArticle(articleId, isBirthday);

            if (articleDetails) {
                // Ajoute les détails de l'article avec la quantité dans le panierDetails
                panierDetails.push({
                    articleId,
                    nom: articleDetails[0].nom,
                    prix: articleDetails[0].prix,
                    description: articleDetails[0].description,
                    quantite,
                    couleur,
                    taille,
                    chemin_image: chemin_image
                });
            }
        }

        // Affichage des détails du panier avec les détails des articles
        //console.log("contenu du panier " + panierDetails);
        return panierDetails;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection du panier :", error);
        return null;
    }
}


async function getArticle(articleId, isBirthday) {
    try {
        let result;
        if (isBirthday) {
            result = await pool.query(`
            SELECT a.nom, 
            COALESCE(p.nvPrix, a.prix) AS prix,  -- Utiliser nvPrix s'il est défini, sinon utiliser le prix de base de l'article
            a.description,
            p.pourcentage
            FROM articles a
            LEFT JOIN promo p ON a.id = p.article_id
            WHERE a.id = $1
        `, [articleId]);
        }
        else {
            result = await pool.query("SELECT * FROM articles WHERE id = $1", [articleId]);
        }
        return result.rows; // Retourne les détails de l'article ou un tableau vide s'il n'existe pas
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection de l'article :", error);
        return null;
    }
}

async function addPanier(user_id, article_id, color, size) {
    try {
        // Vérifier si l'utilisateur avec l'ID spécifié existe dans la table users
        const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userExists.rows.length === 0) {
            console.error("L'utilisateur avec l'ID spécifié n'existe pas.");
            return null;
        }

        // Vérifier si l'article avec l'ID spécifié existe dans la table articles
        const articleExists = await pool.query("SELECT id FROM articles WHERE id = $1", [article_id]);
        if (articleExists.rows.length === 0) {
            console.error("L'article avec l'ID spécifié n'existe pas.");
            return null;
        }

        // Vérifier si l'article est déjà dans le panier de l'utilisateur
        const panierItem = await pool.query("SELECT p.id, p.couleur, p.taille, p.quantite, a.chemin_image FROM panier p JOIN articles a ON p.article_id = a.id WHERE user_id = $1 AND article_id = $2", [user_id, article_id]);

        if (panierItem.rows.length > 0) {
            // On vérifie si lorsqu'on ajoute l'article, il y a un changement de couleur ou de taille
            if (panierItem.rows[0].couleur === color && panierItem.rows[0].taille === size) {
                // L'article est déjà dans le panier, donc mettre à jour la quantité en ajoutant +1
                const existingQuantite = panierItem.rows[0].quantite;
                const newQuantite = existingQuantite + 1;

                // Mettre à jour la quantité dans la table panier
                await pool.query("UPDATE panier SET quantite = $1 WHERE id = $2", [newQuantite, panierItem.rows[0].id]);
                // console.log("Quantité de l'article mise à jour dans le panier !");
            } else {
                // L'article est dans le panier mais avec une couleur ou une taille differente, donc l'ajouter avec une quantité de 1
                await pool.query("INSERT INTO panier (user_id, article_id, couleur, taille, quantite) VALUES ($1, $2, $3, $4, $5)", [user_id, article_id, color, size, 1]);
            }
        } else {
            // L'article n'est pas encore dans le panier, donc l'ajouter avec une quantité de 1
            await pool.query("INSERT INTO panier (user_id, article_id, couleur, taille, quantite) VALUES ($1, $2, $3, $4, $5)", [user_id, article_id, color, size, 1]);
            // console.log("Article ajouté avec succès dans le panier !");
        }

        return true; // Retourner true pour indiquer que l'opération s'est bien déroulée
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'ajout de l'article dans le panier :", error);
        return false; // Retourner false en cas d'erreur
    }
}



async function countArticlesInPanier(user_id) {
    try {
        // Vérifier si l'utilisateur avec l'ID spécifié existe dans la table users
        const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userExists.rows.length === 0) {
            console.error("L'utilisateur avec l'ID spécifié n'existe pas.");
            return 0; // Aucun article dans le panier si l'utilisateur n'existe pas
        }

        // Obtenir la somme des quantités de tous les articles dans le panier de l'utilisateur
        const result = await pool.query("SELECT COALESCE(SUM(quantite), 0) AS total_articles FROM panier WHERE user_id = $1", [user_id]);

        // Extraire le nombre total d'articles du résultat de la requête
        const totalArticles = result.rows[0].total_articles;
        return totalArticles;
    } catch (error) {
        console.error("Une erreur s'est produite lors du comptage des articles dans le panier :", error);
        return 0;
    }
}

async function calculateTotalCostPanier(user_id, isBirthday) {
    try {
        // Vérifier si l'utilisateur avec l'ID spécifié existe dans la table users
        const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userExists.rows.length === 0) {
            console.error("L'utilisateur avec l'ID spécifié n'existe pas.");
            return 0; // Retourner 0 si l'utilisateur n'existe pas
        }

        let panierItems;
        // Obtenir les détails de chaque article dans le panier de l'utilisateur avec son prix unitaire (nvPrix si disponible) et sa quantité
        if (isBirthday) { // Si c'est un anniversaire, on prend le nvPrix de la promo sinon on prend le prix normal
            panierItems = await pool.query(`
            SELECT COALESCE(pr.nvPrix, a.prix) AS prix_unitaire, p.quantite
            FROM panier p
            LEFT JOIN promo pr ON p.article_id = pr.article_id
            LEFT JOIN articles a ON p.article_id = a.id
            WHERE p.user_id = $1
        `, [user_id]);
        } else {
            panierItems = await pool.query(`
                SELECT a.prix AS prix_unitaire, p.quantite
                FROM panier p
                LEFT JOIN articles a ON p.article_id = a.id
                WHERE p.user_id = $1
            `, [user_id]);
        }


        let totalCost = 0;

        // Calculer le coût total en parcourant chaque article dans le panier
        panierItems.rows.forEach(item => {
            const prixUnitaire = item.prix_unitaire;
            const quantite = item.quantite;
            const articleCost = prixUnitaire * quantite;
            totalCost += articleCost;
        });

        //console.log(`Coût total du panier de l'utilisateur ${user_id} : ${totalCost} euros`);
        return totalCost;
    } catch (error) {
        console.error("Une erreur s'est produite lors du calcul du coût total du panier :", error);
        return 0; // Retourner 0 en cas d'erreur
    }
}


async function updateArticle(id, nom, prix, description, couleursListe, taillesListe, image) {
    try {
        const result = await pool.query("UPDATE articles SET nom = $3, prix = $1, description = $2, chemin_image = $4 WHERE id = $5", [prix, description, nom, image, id]);
        const result2 = await pool.query("DELETE FROM articlecouleurs WHERE article_id = $1", [id]);
        const result3 = await pool.query("DELETE FROM articletailles WHERE article_id = $1", [id]);
        couleursListe.forEach(couleur => {
            pool.query("INSERT INTO articlecouleurs (couleur, article_id) VALUES ($1, $2)", [couleur.trim(), id]);
        });
        taillesListe.forEach(taille => {
            pool.query("INSERT INTO articletailles (taille, article_id) VALUES ($1, $2)", [taille.trim(), id]);
        });
        console.log("Article mis à jour avec succès !");
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la mise à jour de l'article :", error);
        return null;
    }
}

async function updateArticleNoImg(id, nom, prix, description, couleursListe, taillesListe) {
    try {
        const result = await pool.query("UPDATE articles SET nom = $3, prix = $1, description = $2 WHERE id = $4", [prix, description, nom, id]);
        const result2 = await pool.query("DELETE FROM articlecouleurs WHERE article_id = $1", [id]);
        const result3 = await pool.query("DELETE FROM articletailles WHERE article_id = $1", [id]);
        couleursListe.forEach(couleur => {
            pool.query("INSERT INTO articlecouleurs (couleur, article_id) VALUES ($1, $2)", [couleur.trim(), id]);
        });
        taillesListe.forEach(taille => {
            pool.query("INSERT INTO articletailles (taille, article_id) VALUES ($1, $2)", [taille.trim(), id]);
        });
        console.log("Article mis à jour avec succès !");
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la mise à jour de l'article :", error);
        return null;
    }
}


async function deleteArticle(id) {
    try {
        const result = await pool.query("DELETE FROM articles WHERE id = $1", [id]);
        console.log("Article supprimé avec succès !");
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la suppression de l'article :", error);
        return null;
    }
}

async function updateUser(id, username, password, dateNaissance, nbrPoints) {
    try {
        const result = await pool.query("UPDATE users SET username = $2, password = $3, dateNaissance = $4, nbr_points = $5 WHERE id = $1", [id, username, password, dateNaissance, nbrPoints]);
        console.log("Utilisateur mis à jour avec succès !");
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la mise à jour de l'utilisateur :", error);
        return null;
    }
}

async function deleteUser(id) {
    try {
        const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
        console.log("Utilisateur supprimé avec succès !");
        return null;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la suppression de l'utilisateur :", error);
        return null;
    }
}

async function viderPanierUtilisateur(user_id) {
    try {
        const query = 'DELETE FROM panier WHERE user_id = $1';
        const result = await pool.query(query, [user_id]);

        console.log(`Le panier de l'utilisateur avec l'ID ${user_id} a été vidé.`);
        return true; // Retourne true pour indiquer que le panier a été vidé avec succès
    } catch (error) {
        console.error(`Une erreur s'est produite lors de la suppression du panier de l'utilisateur avec l'ID ${user_id} :`, error);
        return false; // Retourne false en cas d'erreur
    }
}

async function getArticleCouleur(articleId) {
    try {
        const result = await pool.query("SELECT couleur FROM articlecouleurs WHERE article_id = $1", [articleId]);
        return result.rows; // Retourne les couleurs de l'article ou un tableau vide s'il n'existe pas
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection de l'article :", error);
        return null;
    }
}

async function getArticleTaille(articleId) {
    try {
        const result = await pool.query("SELECT taille FROM articletailles WHERE article_id = $1", [articleId]);
        return result.rows; // Retourne les tailles de l'article ou un tableau vide s'il n'existe pas
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection de l'article :", error);
        return null;
    }
}


async function validatePanier(userId, isBirthday) {
    try {
        // Récupérer les détails du panier de l'utilisateur
        const panierDetails = await getPanier(userId, isBirthday);

        if (!panierDetails || panierDetails.length === 0) {
            console.error("Le panier de l'utilisateur est vide.");
            return { success: false, message: "Le panier est vide." };
        }

        // Calculer le coût total du panier
        let totalCost = await calculateTotalCostPanier(userId, isBirthday);

        // Récupérer le nombre de points de l'utilisateur
        const userPoints = await getPointsByID(userId);
        const pointsValue = userPoints.nbr_points;
        // Vérifier si l'utilisateur a suffisamment de points pour valider le panier
        if (pointsValue < totalCost) {
            console.error("L'utilisateur n'a pas suffisamment de points pour valider le panier.");
            return { success: false, message: "Points insuffisants pour valider le panier." };
        }

        // Ajouter chaque article du panier dans la table dejaAchete
        for (const item of panierDetails) {
            await addToDejaAchete(userId, item.articleId, item.couleur, item.taille);
        }

        // Soustraire le coût total des points de l'utilisateur
        const newPointsValue = pointsValue - totalCost;
        await updateUserPoints(userId, newPointsValue);

        return { success: true, message: "Le panier a été validé avec succès." };
    } catch (error) {
        console.error("Une erreur s'est produite lors de la validation du panier :", error);
        return { success: false, message: "Erreur lors de la validation du panier." };
    }
}

async function addToDejaAchete(userId, articleId, couleur, taille) {
    try {
        // Vérifier d'abord si l'article existe déjà dans dejaAchete pour l'utilisateur donné
        const existingPurchase = await pool.query(
            "SELECT id FROM dejaAchete WHERE user_id = $1 AND article_id = $2 AND couleur = $3 AND taille = $4",
            [userId, articleId, couleur, taille]
        );

        if (existingPurchase.rows.length > 0) {
            console.log("L'article est déjà acheté par cet utilisateur avec la même couleur et taille.");
            return; // Ne rien faire si l'article est déjà acheté avec la même couleur et taille
        }

        // Insérer l'article dans la table dejaAchete s'il n'existe pas déjà avec la même couleur et taille
        const query = `
            INSERT INTO dejaAchete (user_id, article_id, couleur, taille)
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(query, [userId, articleId, couleur, taille]);

        console.log("Article ajouté avec succès à dejaAchete.");
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'ajout d'un article à dejaAchete :", error);
        throw error; // Propager l'erreur vers le niveau supérieur
    }
}

// Fonction pour mettre à jour le nombre de points de l'utilisateur
async function updateUserPoints(userId, newPointsValue) {
    try {
        const query = `
            UPDATE users
            SET nbr_points = $1
            WHERE id = $2
        `;
        await pool.query(query, [newPointsValue, userId]);
    } catch (error) {
        console.error("Une erreur s'est produite lors de la mise à jour des points de l'utilisateur :", error);
        throw error; // Propager l'erreur vers le niveau supérieur
    }
}

async function getPointsByID(userId) {
    try {
        const query = `
            SELECT nbr_points
            FROM users
            WHERE id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0]; // Retourner les points de l'utilisateur
    } catch (error) {
        console.error("Une erreur s'est produite lors de la récupération des points de l'utilisateur :", error);
        throw error; // Propager l'erreur vers le niveau supérieur
    }
}

async function getDejaAchete(userId) {
    try {
        // Vérifier si l'utilisateur avec l'ID spécifié existe dans la table users
        const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
        if (userExists.rows.length === 0) {
            console.error("L'utilisateur avec l'ID spécifié n'existe pas.");
            return []; // Retourner un tableau vide si l'utilisateur n'existe pas
        }

        // Sélectionner les articles déjà achetés par l'utilisateur avec leurs détails
        const query = `
            SELECT a.id AS id, a.nom AS nom, a.prix AS prix, a.chemin_image AS chemin_image,
                   a.description AS description, da.couleur AS couleur, da.taille AS taille
            FROM dejaAchete da
            JOIN articles a ON da.article_id = a.id
            WHERE da.user_id = $1
        `;
        const result = await pool.query(query, [userId]);

        // Renvoyer les articles déjà achetés avec leurs détails
        return result.rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la récupération des articles déjà achetés :", error);
        return []; // Retourner un tableau vide en cas d'erreur
    }
}


async function insertArticleDetails() {
    try {
        // Récupérer tous les articles de la table articles
        const articles = await pool.query("SELECT id, nom FROM articles");

        // Liste des identifiants d'articles avec taille unique
        const tailleUnique = [1, 2, 3, 4, 6, 7, 8, 9, 12];
        const couleurUnique = [4, 5];

        // Parcourir chaque article
        for (let i = 0; i < articles.rows.length; i++) {
            const articleId = articles.rows[i].id;
            const articleName = articles.rows[i].nom;

            // Insérer des couleurs pour l'article dans la table 'ArticleCouleurs'
            const colors = couleurUnique.includes(articleId) ? ['Unique'] : ['Rouge', 'Bleu', 'Vert', 'Jaune'];
            for (const color of colors) {
                await pool.query("INSERT INTO ArticleCouleurs (couleur, article_id) VALUES ($1, $2)", [color, articleId]);
            }

            // Insérer des tailles pour l'article dans la table 'ArticleTailles'
            const sizes = tailleUnique.includes(articleId) ? ['Unique'] : ['S', 'M', 'L', 'XL'];
            for (const size of sizes) {
                await pool.query("INSERT INTO ArticleTailles (taille, article_id) VALUES ($1, $2)", [size, articleId]);
            }

            console.log(`Données insérées pour l'article "${articleName}"`);
        }

        console.log('Insertion terminée avec succès.');
    } catch (error) {
        console.error('Une erreur s\'est produite lors de l\'insertion des détails des articles :', error);
    }
}

// Fonction pour sélectionner 5 articles aléatoires
async function selectRandomArticles() {
    try {
        // Requête SQL pour sélectionner des articles aléatoires
        const query = `
        SELECT id, chemin_image, nom, prix, description
        FROM articles
        ORDER BY RANDOM()
        LIMIT 5;
      `;

        // Exécution de la requête
        const { rows } = await pool.query(query);

        // Renvoyer les résultats
        return rows;
    } catch (error) {
        console.error('Erreur lors de la sélection des articles aléatoires :', error);
        throw error; // Propager l'erreur vers le niveau supérieur
    }
}


async function getRandomPercentage() {
    // Générer un pourcentage aléatoire entre 10 et 50
    return Math.floor(Math.random() * (50 - 10 + 1) + 10);
}

async function addRandomArticlesToPromo() {
    try {
        // Supprimer tous les enregistrements existants dans la table promo
        const deleteQuery = `DELETE FROM promo`;
        await pool.query(deleteQuery);

        // Appeler la fonction pour sélectionner des articles aléatoires
        const randomArticles = await selectRandomArticles();

        // Parcourir les articles sélectionnés
        for (const article of randomArticles) {
            const { id, prix } = article;

            // Générer un pourcentage aléatoire entre 10% et 50%
            const pourcentageReduction = await getRandomPercentage();

            // Calculer le nouveau prix avec la réduction
            const nvPrix = Math.round(prix * (1 - pourcentageReduction / 100));

            // Insérer l'article dans la table promo avec son nouveau prix
            const insertQuery = `
                INSERT INTO promo (article_id, nvPrix, pourcentage)
                VALUES ($1, $2, $3)
            `;
            await pool.query(insertQuery, [id, nvPrix, pourcentageReduction]);

            console.log(`Article ID ${id} ajouté à la table promo avec un nouveau prix de ${nvPrix} (Réduction de ${pourcentageReduction}%)`);
        }

        console.log('Tous les articles sélectionnés ont été ajoutés à la table promo avec leurs nouveaux prix.');
    } catch (error) {
        console.error('Une erreur s\'est produite lors de l\'ajout d\'articles à la table promo :', error);
        throw error; // Propager l'erreur vers le niveau supérieur
    }
}

async function getAllPromoArticles() {
    try {
        const query = `
            SELECT a.id, a.nom, a.prix, a.description, a.chemin_image, p.nvPrix, p.pourcentage
            FROM articles a
            JOIN promo p ON a.id = p.article_id
        `;

        // Exécution de la requête
        const { rows } = await pool.query(query);

        // Renvoyer les résultats
        return rows;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles de promo :", error);
        return null;
    }
}

async function isArticleInPromo(articleId) {
    try {
        const query = `
            SELECT article_id
            FROM promo
            WHERE article_id = $1
        `;
        const { rows } = await pool.query(query, [articleId]);
        const articleInPromo = rows.length > 0;
        return articleInPromo;
    } catch (error) {
        console.error("Une erreur s'est produite lors de la sélection des articles de promo :", error);
        throw error;
    }
}


module.exports =
{
    verif,
    getAllUsers,
    getAllArticles,
    addUser,
    addArticle,
    getAllArticlesWithPrice,
    getPoint,
    getArticle,
    updateArticle,
    updateArticleNoImg,
    deleteArticle,
    updateUser,
    deleteUser,
    getPanier,
    getUserId,
    addPanier,
    viderPanierUtilisateur,
    countArticlesInPanier,
    calculateTotalCostPanier,
    removeQuantityFromPanier,
    getArticleCouleur,
    getArticleTaille,
    getAllArticlesWithColor,
    getAllArticlesWithSize,
    validatePanier,
    insertArticleDetails,
    getDejaAchete,
    addRandomArticlesToPromo,
    getAllPromoArticles,
    isArticleInPromo,
    getBirthDate
};
