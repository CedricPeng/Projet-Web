DROP TABLE IF EXISTS panier;
DROP TABLE IF EXISTS dejaAchete;
DROP TABLE IF EXISTS promo;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS ArticleCouleurs;
DROP TABLE IF EXISTS ArticleTailles;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    dateNaissance DATE NOT NULL,
    gerant BOOLEAN NOT NULL, 
    nbr_points INTEGER NOT NULL DEFAULT 0 
);

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    chemin_image VARCHAR(100) NOT NULL DEFAULT 'logo.png',
    nom VARCHAR(100) NOT NULL,
    prix INTEGER NOT NULL,
    description VARCHAR(500)
);

CREATE TABLE ArticleCouleurs (
    id SERIAL PRIMARY KEY,
    couleur VARCHAR(50),
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE ArticleTailles (
    id SERIAL PRIMARY KEY,
    taille VARCHAR(20),
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE panier (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    couleur VARCHAR(50),
    taille VARCHAR(20),
    quantite INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE dejaAchete (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    couleur VARCHAR(50),
    taille VARCHAR(20)
);

CREATE TABLE promo (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    nvPrix INTEGER NOT NULL,
    pourcentage INTEGER NOT NULL
);

INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Matthieu', '1234567890', '1990-05-15', TRUE, 10);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('g', 'g', '1990-05-15', TRUE, 10);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('a', 'a', '1985-09-20', FALSE, 1000);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Vincent Padovani', 'mdp', '2000-05-18', FALSE, 500);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Peter Habermehl', 'mdp', '2000-05-18', FALSE, 500);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Cedric', '0987654321', '1988-03-10', TRUE, 80);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Guillaume Xue', 'test', '1993-11-25', FALSE, 40);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Yohan Leconte', 'aaaaa', '1992-07-08', FALSE, 123);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('David Yu', 'genshin', '1987-01-30', FALSE, 100);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Pierre Fournier', 'cailloux', '1994-04-18', FALSE, 50);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Tsiory Irina', 'ttttt', '1991-08-05', FALSE, 123);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Yacine Tamdrari', 'crack', '1989-12-15', FALSE, 90);
INSERT INTO users (username, password, dateNaissance, gerant, nbr_points) VALUES ('Loic Jiraud', 'foo', '1996-02-28', FALSE, 20);

INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('seau.jpg', 'Seau', 10, 'Ajoutez une touche de praticité à vos aventures en plein air avec ce seau polyvalent.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('pelle.jpg', 'Pelle', 20, 'Parfaite pour sculpter des sculptures de sable époustouflantes ou pour aider à construire des fortifications dignes d''un château.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('serviette.jpg', 'Serviette de plage', 30, 'Enveloppez-vous de confort et de style avec notre serviette de plage luxueuse. Douce, absorbante et dotée de motifs éclatants, cette serviette est votre compagnon idéal pour vous détendre au soleil');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('lunettes.jpg', 'Lunettes de soleil', 40, 'Protégez vos yeux avec élégance grâce à nos lunettes de soleil tendance.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('casquette.jpg', 'Casquette', 50, 'Restez cool et protégé du soleil avec notre casquette classique. Parfaite pour les journées ensoleillées à la plage ou lors de vos activités de plein air.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('ballon.jpg', 'Ballon de plage', 60, 'Amusez-vous sous le soleil avec notre ballon de plage coloré. Léger, durable et facile à gonfler, ce ballon est idéal pour des jeux amusants sur le sable ou dans l''eau.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('parasol.jpg', 'Parasol', 70, 'Créez votre propre oasis d''ombre avec notre parasol élégant. Parfait pour vous protéger du soleil brûlant tout en ajoutant une touche de style à votre espace extérieur.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('bouee.jpg', 'Bouée géante', 80, 'Faites sensation à la plage avec notre bouée géante amusante. Parfaite pour flotter dans l''eau en toute sécurité ou pour des séances de bronzage relaxantes.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('transat.jpg', 'Transat', 130, 'Détendez-vous avec style grâce à notre transat confortable. Conçu pour offrir un soutien optimal et un confort ultime, ce transat est l''endroit idéal pour vous prélasser au soleil.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('maillotH.jpg', 'Maillot de bain homme', 40, 'Plongez dans l''été avec notre maillot de bain pour homme élégant. Conçu pour allier confort et style, ce maillot est parfait pour des journées de détente à la plage.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('maillotF.jpg', 'Maillot de bain femme', 40, 'Faites tourner les têtes avec notre maillot de bain pour femme chic et élégant.');
INSERT INTO articles (chemin_image, nom, prix, description) VALUES ('chaise.jpg', 'Chaise pliante', 120, 'Profitez de moments de détente où que vous soyez avec notre chaise pliante portable. Légère, compacte et facile à transporter, cette chaise est parfaite pour la plage.');



