$(document).ready(function () {

    const overlay = $('#overlay');
    // 0.connexion , 1.ajoutMembre , 2.ajoutArticle, 3.modifMembre, 4.modifArticle 5.description
    let tabPopUp = [
        {
            popUp: $('#popupConnexion'),
            close: $('#close'), //ce qui ferme le popUp
            opener: $('#connexionLink') //ce qui permet d'ouvrir le popUp
        },
        {
            popUp: $('#popupAjoutMembre'),
            close: $('#close2'),
            opener: $('#ajouterMembre')
        },
        {
            popUp: $('#popupAjoutArticle'),
            close: $('#close3'),
            opener: $('#ajouterArticle')
        },
        {
            popUp: $('.popupModifMembre'),
            close: $('.close5'),
            opener: $('.membre-link')
        },
        {
            popUp: $('.popupModifArticle'),
            close: $('.close4'),
            opener: $('.article-link')
        },
        {
            popUp: $('#popupDescr'),
            close: $('#closeDescr'),
            opener: null
        }
    ];

    const submitButtons = [
        {
            buttonId: 'valider', //id du btn
            form: '#loginForm', //represente sur quoi le submit est envoyé
            fields: ['#username', '#password'], // represente les id des inputs dans le form en question
            messages: ['Nom d\'utilisateur', 'Mot de passe'] // represente les contenus des placeholders
        },
        {
            buttonId: 'valider2',
            form: '#ajoutMembre',
            fields: ['#newuser', '#newpassword', '#dateNaissance', '#points'],
            messages: ['Nouvel utilisateur', 'Nouveau mot de passe', 'Date de naissance', 'Points']
        },
        {
            buttonId: 'valider3',
            form: '#ajoutArticle',
            fields: ['#nomArticle', '#prix', '#tailles', '#couleurs', '#description'],
            messages: ['Nom de l\'article', 'Prix de l\'article', 'Tailles de l\'article', 'Couleurs de l\'article', 'Description de l\'article']
        }
    ];


    // Parcourir tous les éléments de tabPopUp
    tabPopUp.forEach((element, index) => {
        const popUp = element.popUp;
        const close = element.close;
        const opener = element.opener;

        // Appeler la fonction pour gérer les actions sur le popup
        handlePopupActions(popUp, opener, close, index);
    });

    // Fonction pour gérer l'ouverture et la fermeture des popups
    function handlePopupActions(popUp, opener, close, i) {
        if (i === 5) {
            // Cas spécial pour les articles avec détails
            setupArticleClickHandlers();
        } else if (i === 3 || i === 4) {
            const idType = (i === 3) ? 'idMembre' : 'idArticle';
            const popupIdPrefix = (i === 3) ? 'popupModifMembre' : 'popupModifArticle';
            const idPrefix = (i === 3) ? 'idM' : 'idA';
            const supprButtonIdPrefix = (i === 3) ? 'supprimer5' : 'supprimer4';
            handleModifPopup(opener, popupIdPrefix, idPrefix, supprButtonIdPrefix, idType);
        } else {
            // Gestion des autres ouvertures de popup
            opener.click(event => {
                event.preventDefault();
                // Afficher le popup correspondant
                popUp.show();
                // Afficher la superposition modale
                overlay.show();
            });
        }
        close.click(event => {
            //si popUpDescr est visible et que l'aside panier l'est aussi
            if ($('.aside').css('right') === 'Opx') {
                // Cacher l'overlay uniquement si tabPopUp[5].popUp n'est pas visible
                popUp.hide();
            } else {
                // Cacher le popup concerné
                popUp.hide();
                // Cacher la superposition modale si le panier n'est pas ouvert
                if ($('.aside').css('right') !== '0px') {
                    overlay.hide();
                }
            }
        });
    }
    

    // Fonction pour remplir le selecteur de couleur et de taille dans accueil
    function fillPopupSelectors(article) {
        const colorSelect = document.querySelector('#colorSelectorContainer');
        const sizeSelect = document.querySelector('#sizeSelectorContainer');

        // On efface les options précédentes
        colorSelect.innerHTML = '';
        sizeSelect.innerHTML = '';


        // On copie les options du sélecteur de couleur
        const articleColorSelect = article.querySelector('.ColorSelect');
        const articleSizeSelect = article.querySelector('.SizeSelect');

        // Dans le cas du popup du catalogue de produit
        if (articleColorSelect && articleSizeSelect) {
            // On copie tous les descendants dans ColorSelect
            const clonedColorOptions = articleColorSelect.cloneNode(true);
            // On ajoute les options dans le selecteur
            colorSelect.appendChild(clonedColorOptions);

            // On copie les options du sélecteur de taille
            // On copie tous les descendants dans SizeSelect
            const clonedSizeOptions = articleSizeSelect.cloneNode(true);
            // On ajoute les options dans le selecteur
            sizeSelect.appendChild(clonedSizeOptions);
        }

        // Dans le cas du popup du panier on ajoute uniquement la taille et la couleur choisie
        const taille = $(article).find('.asideTaille').text();
        const couleur = $(article).find('.asideCouleur').text();
        if (couleur && taille) {
            const popupCouleur = $('#colorSelectorContainer');
            const popupTaille = $('#sizeSelectorContainer');
            popupCouleur.text(couleur);
            popupTaille.text(taille);
        }
    }

    function setupArticleClickHandlers() {
        $(document).on('click',`.articlesWithPrice li, 
                                .articlesWithPricePanier li,
                                .historique li, 
                                .articlesWithPromo li
                               `
        , function (event) {
            event.preventDefault();
    
            const isPanier = $(this).closest('.articlesWithPricePanier').length > 0 || 
                             $(this).closest('.historique').length > 0; // pour afficher ou non le bouton ajouter
            const showBtnPanier = !isPanier;
            handleArticleClick(this, showBtnPanier);
        });
    }

    function handleArticleClick(article, showBtnPanier) {
        let prix = $(article).find('span:nth-child(3)').text();
        let description = $(article).find('span:nth-child(4)').text();
        let nom = "";
        if (showBtnPanier) {
            nom = $(article).find('.articleNom').text(); // Nom pour le popup
            $('#ajoutBtnPanier').show();
        } else {
            nom = $(article).find('.asideNom').text();
            $('#ajoutBtnPanier').hide();
        }
        const imageUrl = $(article).find('img').attr('src');
        const articleId = $(article).data('article-id');
        
        const popupTitle = $('#descrTitle');
        const popupImage = $('#descrImage');
        const popupDescription = $('#descrDescription');
        const popupPrice = $('#descrPrice');

        popupImage.attr('src', imageUrl);
        popupDescription.text(description);
        popupPrice.text(prix + (showBtnPanier ? ' ' : ''));
        $('#articleId').val(articleId);
      
        fillPopupSelectors(article);
        popupTitle.text(nom);

        $('#popupDescr').show();
        overlay.show();
    }

    overlay.click(function () {
        for (let i = 0; i < tabPopUp.length; ++i) { // // Cacher les popups
            tabPopUp[i].popUp.hide();
        }
        $('.aside').css('right', '-400px'); //cache le panier
        // Cacher la superposition modale
        overlay.hide();
    });

    if (window.erreurDeConnexion) {
        // Afficher le message d'erreur pendant 3 secondes
        $('#popUp-erreur').show().delay(3000).fadeOut();
    }

    function handlePanierClick(event) {
        event.preventDefault(); // Empêcher le comportement par défaut du lien
        if (!window.panierCo) {
            // Afficher le message d'erreur pendant 3 secondes
            $('#panierNonCo').show().delay(3000).fadeOut();
            tabPopUp[0].popUp.show();
            overlay.show();
        } else {
            // window.panierCo est true, gérer le comportement normal du panier ici
            overlay.show();
            $('.aside').css('right', '0'); // Ouvre le panier
        }
    }
    
    // Associer la fonction `handlePanierClick` à l'événement clic sur les éléments `.panier` et `.carte`
    $('.panier').click(handlePanierClick);
    $('.carte').click(handlePanierClick);

    $('#closePanier').click(function () {
        // Cacher le popup d'ajout
        $('.aside').css('right', '-400px');
        // Vérifier si tabPopUp[5].popUp est visible
        if (!tabPopUp[5].popUp.is(':visible')) {
            // Cacher l'overlay uniquement si tabPopUp[5].popUp n'est pas visible
            overlay.hide();
        }
    });

    // Fonction générique pour la validation des champs vides
    function validateFields(fields, messages) {
        let formIsValid = true;

        fields.forEach((fieldSelector, index) => {
            const field = $(fieldSelector);
            const fieldName = messages[index];

            if (field.val() === '' || field.val() === undefined) {
                field.addClass('empty');
                field.css('border-color', 'red');
                setTimeout(function () {
                    field.css('border-color', '');
                    field.removeClass('empty');
                }, 2000); // Délai en millisecondes (ici 2000 ms soit 2 secondes)

                console.log(`Le champ "${fieldName}" est requis.`);
                formIsValid = false;
            }
        });
        console.log(formIsValid);
        return formIsValid;
    }


    // Associer le gestionnaire d'événement à chaque bouton de soumission
    submitButtons.forEach(buttonInfo => {
        const button = $(`#${buttonInfo.buttonId}`);
        const fields = buttonInfo.fields; //egal au tableau de id
        //pour afficher le placeholder au dessus de l'input quand on clique dessus
        fields.forEach(fieldSelector => {
            const input = $(fieldSelector);
            const label = $(`${fieldSelector}Label`); // Supposant que les étiquettes ont des IDs dérivés des champs
            const defaultPlaceholder = input.attr('placeholder'); // Récupérer le placeholder par défaut
            manageInputBehavior(input, label, defaultPlaceholder);
        });

        button.click(event => {
            event.preventDefault(); // Empêcher le formulaire de se soumettre
            const messages = buttonInfo.messages;
            const formSelector = buttonInfo.form; // Sélecteur du formulaire associé
            const form = $(formSelector); // Sélectionner le formulaire associé
            const formIsValid = validateFields(fields, messages);
            if (formIsValid) {
                $('#PopUpValide').show().delay(3000).fadeOut();
                form.submit(); // Soumettre le formulaire associé
                
            }
        });
    });

    // Pour afficher le placeholder au dessus de l'input quand on clique dessus
    function manageInputBehavior(input, label, defaultPlaceholder) {
        input.click(function () {
            input.attr('placeholder', ''); // Effacer le placeholder
            label.show(); // Afficher le label
        });

        input.blur(function () {
            if (input.val() === '') {
                input.attr('placeholder', defaultPlaceholder); // Rétablir le placeholder
                label.hide(); // Cacher le label
            }
        });
    }

    //pour afficher l'oeil qui affiche le mdp
    const togglePassword = document.querySelector(".password-toggle-icon i");

    togglePassword.addEventListener("click", function () {
        const inputPassword = $('#password');
        if (inputPassword.prop('type') === "password") {
            inputPassword.prop('type', 'text');
            togglePassword.classList.remove("fa-eye");
            togglePassword.classList.add("fa-eye-slash");
        } else {
            inputPassword.prop('type', 'password');
            togglePassword.classList.remove("fa-eye-slash");
            togglePassword.classList.add("fa-eye");
        }
    });

    function handleModifPopup(opener, popupIdPrefix, idPrefix, supprButtonIdPrefix, idType) {
        opener.on('click', function (event) {
            index = $(this).data('index'),
                event.preventDefault();
            const popupId = `#${popupIdPrefix}_${index}`;
            const popup = $(popupId);
            const id = $(`#${idPrefix}_${index}`);
            const supprButton = $(`#${supprButtonIdPrefix}_${index}`);
            popup.show();
            overlay.show();
            supprButton.on('click', function () {
                const data = {};
                data[idType] = id.val();
                $.ajax({
                    url: '/gerante',
                    method: 'POST',
                    data: data,
                    success: function (response) {
                        window.location.href = '/gerante';
                    },
                    error: function (xhr, status, error) {
                        console.error('Erreur lors de la requête POST (ajax):', error);
                    }
                });
            });
        });
    }
});