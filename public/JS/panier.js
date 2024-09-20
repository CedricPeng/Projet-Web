$(document).ready(function () {

    
    $('#ajoutBtnPanier').click(async function () {
        //on force l'utilisateur a se connecter s'il ne l'est pas
        if (!window.ajoutPanierCo) {
            $('#ajoutPanierNonCo').show().delay(3000).fadeOut();
            $('#popupDescr').hide();
            $('#popupConnexion').show();
            overlay.show();
        } else {
            const selectedColor = $('#colorSelectorContainer select').val();
            const selectedSize = $('#sizeSelectorContainer select').val();

            // On vérifie si une couleur et une taille ont été sélectionnées
            if (!selectedColor || !selectedSize) {
                // On affiche un popup d'erreur si aucune couleur ou taille n'a été sélectionnée
                $('#ajoutPanierNonComplet').show().delay(3000).fadeOut();
                overlay.show();
                return;
            }
            else {
                // Effectuer une requête AJAX pour ajouter l'article au panier
                try {
                    const userId = $('#userId').val(); // Récupérer l'ID de l'utilisateur actuellement connecté
                    const article_id = $('#articleId').val(); // Récupérer l'ID de l'article à ajouter au panier
                    const promoOrNotString = $('#promoOrNOt').val();
                    const response = await $.ajax({
                        url: '/addPanier', // URL de l'endpoint pour ajouter au panier
                        method: 'POST',
                        data: {
                            user_id: userId,
                            article_id: article_id,
                            color: selectedColor,
                            size: selectedSize,
                            promoOrNot : promoOrNotString
                        }
                    });
                    if (response.success) {
                        $('.panier-content').html(generatePanierHtml(response.panier, response.prixTotal));
                        $('.chiffrePanier').html('(' + response.nbArticle + ')');
                        $('#overlay').hide();
                        $('#popupDescr').hide();
                        if(response.affiche === false){
                            $('#popUpPromo').show().delay(3000).fadeOut();
                        }else{
                            $('#panierAjoutVal').show().delay(3000).fadeOut();
                        }
                    } else {
                        console.error('Erreur lors de l\'ajout de l\'article au panier.');
                        $('#panierAjoutErr').show().delay(3000).fadeOut();
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'ajout de l\'article au panier :', error);
                }
            }
        }
    });

    //changer dynamiquement le contenu du panier
    function generatePanierHtml(panier, prixTotal) {
        let html = '';
        if (panier && panier.length > 0) {
            html += '<p>Votre panier :</p><ul class="articlesWithPricePanier">';
            panier.forEach(item => {
                html += `<li>
                            <a href="#"><img src="images/${item.chemin_image}" alt="${item.article_id}"></a>
                            <div class="containerAsidePanier">
                                <span class="asideNom" id="nomAside">${item.nom}</span>
                                <span class="asideQuantite">Quantité : ${item.quantite}</span>
                                <span class="asidePrix">${item.prix} pts</span>
                                <span class="descrHide">${item.description}</span>
                                <span class="asideCouleur">Couleur : ${item.couleur}</span>
                                <span class="asideTaille">Taille : ${item.taille}</span>
                                <span class="descrHide articleIdPanier">${item.articleId}</span>
                            </div>
                            <div class="containerBoutonPanier">
                                <button class="moinsArticle" data-article-id="${item.articleId}">-</button>
                                <button class="plusArticle" data-article-id="${item.articleId}">+</button>
                            </div>
                        </li>`;
            });
            html += '</ul><div class="buttonPanier"><button id="videPanier">Vider le panier</button><span>Coût : ' +
                prixTotal +
                '</span><button id="validerPanier">Valider l\'achat</button></div>';
        } else {
            html += '<p>Votre panier est vide.</p>';
        }
        return html;
    }

    //ajouter un article depuis le panier
    $(document).on('click', '.plusArticle', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const article_id = $(this).data('article-id');
        const userId = $('#userId').val();
        // On récupère les informations de l'article couleur et taille
        const couleurFull = $(this).closest('li').find('.asideCouleur').text();
        const tailleFull = $(this).closest('li').find('.asideTaille').text();
        // On extrait les valeurs de couleur et taille
        const taille = tailleFull.split(': ')[1].trim();
        const couleur = couleurFull.split(': ')[1].trim();

        try {
            const response = await $.ajax({
                url: '/addPanier', // URL de l'endpoint pour ajouter au panier
                method: 'POST',
                data: {
                    user_id: userId,
                    article_id: article_id,
                    color: couleur,
                    size: taille,
                    quantite: 1
                }
            });

            if (response.success) {
                $('.panier-content').html(generatePanierHtml(response.panier, response.prixTotal));
                $('.chiffrePanier').html(`(${response.nbArticle})`);
                $('.pointCard').html(`${response.pointsValue - response.prixTotal} pts`);
                $('#panierAjoutVal').show().delay(3000).fadeOut();
            } else {
                console.log("Impossible d'ajouter au panier pas assez de points");
                $('#panierAjoutErr').show().delay(3000).fadeOut();
            }
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la requête AJAX :', error);
            alert('Une erreur s\'est produite lors de la requête AJAX.');
        }
    });


    // retirer un article
    $(document).on('click', '.moinsArticle', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const articleId = $(this).data('article-id');
        const userId = $('#userId').val();
        try {
            const response = await $.ajax({
                url: '/moinsArticle',
                method: 'POST',
                data: {
                    user_id: userId,
                    article_id: articleId
                }
            });

            if (response.success) {
                $('.panier-content').html(generatePanierHtml(response.panier, response.prixTotal));
                $('.chiffrePanier').html(`(${response.nbArticle})`);
                $('.pointCard').html(`${response.pointsValue - response.prixTotal} pts`);
                $('#panierSuppVal').show().delay(3000).fadeOut();
            } else {
                console.error('Erreur lors de la suppression de la quantité dans le panier.');
                alert('Une erreur s\'est produite lors de la suppression de la quantité dans le panier. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la requête AJAX :', error);
            alert('Une erreur s\'est produite lors de la requête AJAX.');
        }
    });

    //vider le panier
    $('.panier-content').on('click', '#videPanier', async function () {
        const user_id = $('#userId').val();
        try {
            const response = await $.ajax({
                url: '/viderPanier', // URL de l'endpoint pour vider le panier
                method: 'POST',
                data: { user_id: user_id }
            });
            if (response.success) {
                $('.panier-content').html(generatePanierHtml(response.panier));
                $('.chiffrePanier').html(`(${response.panier.length})`);
                $('.pointCard').html(response.pointsValue + ' pts');
                $('#panierVide').show().delay(3000).fadeOut();
                $('.aside').css('right', '-400px'); //cache le panier
                $('#overlay').hide();
            } else {
                console.error('Erreur lors du vidage du panier.');
                // Afficher un message d'erreur à l'utilisateur
                alert('Une erreur s\'est produite lors du vidage du panier. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la suppression du panier :', error);
            alert('Une erreur s\'est produite lors de la suppression du panier.');
        }
    });

    //Bouton Valider
    $('.panier-content').on('click', '#validerPanier', async function () {
        const user_id = $('#userId').val();
        try {
            const response = await $.ajax({
                url: '/validerPanier', // URL de l'endpoint pour vider le panier
                method: 'POST',
                data: { user_id: user_id }
            });
            if (response.success) {
                $('.panier-content').html(generatePanierHtml(response.panier));
                $('.chiffrePanier').html(`(${response.panier.length})`);
                $('.pointCard').html(response.nvPoints + ' pts');
                $('.aside').css('right', '-400px'); //cache le panier
                $('#overlay').hide();
                $('#achatPopUpValide').show().delay(3000).fadeOut();
            } else {
                console.error('Erreur lors du validage du panier.');
                // Afficher un message d'erreur à l'utilisateur
                alert('Une erreur s\'est produite lors du validage du panier. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la validation du panier :', error);
            alert('Une erreur s\'est produite lors de la validation du panier.');
        }
    });



});