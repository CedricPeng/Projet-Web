$(document).ready(function () {
    // Fonction pour générer des confettis pour l'anniversaire de l'utilisateur
    function generateConfetti() {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');

        // On divise la fenêtre en 10 colonnes et on choisi une position aléatoire dans chaque colonne
        const columnWidth = window.innerWidth / 10;
        const randomColumn = Math.floor(Math.random() * 10); // Colonne aléatoire
        const randomLeft = columnWidth * randomColumn + Math.random() * columnWidth; // Position aléatoire dans la colonne

        // On divise la fenêtre en 5 lignes et on choisi une position aléatoire dans chaque ligne
        const rowHeight = window.innerHeight / 5;
        const randomRow = Math.floor(Math.random() * 5); // Ligne aléatoire
        const randomTop = rowHeight * randomRow + Math.random() * rowHeight; // Position aléatoire dans la ligne

        // On applique les positions aléatoires
        confetti.style.left = randomLeft + 'px';
        confetti.style.top = randomTop + 'px';
        confetti.style.backgroundColor = randomColor();
        confetti.style.width = Math.random() * 20 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.transform = 'rotateZ(' + Math.random() * 360 + 'deg)';

        // On ajoute le confetti dans le conteneur
        document.getElementById('confetti-container').appendChild(confetti);
        // On ajoute des delais pour les apparitions et les disparitions
        const delay = Math.random() * 2000;
        setTimeout(() => {
            confetti.classList.add('active');
        }, delay);

        setTimeout(() => {
            confetti.remove();
        }, delay + 4000);
    }

    // Fonction pour déterminer une couleur aléatoire pour les confettis
    function randomColor() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']; // Liste de couleurs
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Fonction pour déclencher les confettis
    function triggerConfetti() {
        for (let i = 0; i < 10; i++) {
            generateConfetti();
        }
    }
    
    if (document.getElementById('confetti-container')) {
        setInterval(triggerConfetti, 1000);
    }


    $('#btnProd').click(async function () {
        const valConnected = document.getElementById('isConnected').getAttribute('data-connected');
        try {
            const userId = $('#userId').val();
            const response = await $.ajax({
                url: '/nosProduits', // URL de l'endpoint pour ajouter au panier
                method: 'GET',
                data: {
                    user_id: userId,
                    connected: valConnected
                }
            });
            $('.milieu').html(response);
        } catch (error) {
            console.error('Une erreur s\'est produite lors du chargement de la page :', error);
            alert('Une erreur s\'est produite lors  du chargement de la page.');
        }
    });

    $('#btnPromo').click(async function () {
        const valConnected = document.getElementById('isConnected').getAttribute('data-connected');
        try {
            const userId = $('#userId').val();
            const response = await $.ajax({
                url: '/promo', // URL de l'endpoint pour ajouter au panier
                method: 'GET',
                data: {
                    user_id: userId,
                    connected: valConnected
                }
            });
            $('.milieu').html(response);
        } catch (error) {
            console.error('Une erreur s\'est produite lors du chargement de la page :', error);
            alert('Une erreur s\'est produite lors  du chargement de la page.');
        }
    });

    $('#btnHistorique').click(async function () {
        try {
            const userId = $('#userId').val();
            const response = await $.ajax({
                url: '/historique', // URL de l'endpoint pour ajouter au panier
                method: 'GET',
                data: {
                    user_id: userId
                }
            });
            $('.milieu').html(response);
        } catch (error) {
            console.error('Une erreur s\'est produite lors du chargement de la page historique :', error);
            alert('Une erreur s\'est produite lors  du chargement de la page historique.');
        }
    });

    // Pour le menu déroulant dans la partie gérant 
    let clickedMembre = false;
    $('#afficherMembres').click(function () {
        $('.membres').slideToggle('slow');
        if (clickedMembre) {
            $(this).text('Afficher les membres');
            clickedMembre = false;
        }
        else {
            $(this).text('Masquer les membres');
            clickedMembre = true;
        }
    });

    let clickedArticle = false;
    $('#afficherArticles').click(function () {
        $('.articles').slideToggle('slow');
        if (clickedArticle) {
            $(this).text('Afficher les articles');
            clickedArticle = false;
        }
        else {
            $(this).text('Masquer les articles');
            clickedArticle = true;
        }
    });

    document.addEventListener('scroll', function () {
        // Pour cacher la navbar quand l'utilisateur scroll
        let lastScrollTop = 0;
        const navbar = document.querySelector('.top');
        let scrollTop = window.scrollY || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop) {
            // L'utilisateur scroll vers le bas
            navbar.style.top = "-150px";

        } else {
            // L'utilisateur scroll vers le haut
            navbar.style.top = "0px";
        }

        lastScrollTop = scrollTop;


        var scrollPosition = window.scrollY;
        var pageHeight = document.documentElement.scrollHeight - window.innerHeight;
        let retourAccueil = document.querySelector('.retourAccueil');

        // Ajout de la transition
        retourAccueil.style.transition = "bottom 0.5s ease, left 0.5s ease, transform 0.5s ease";

        // Si on atteint 80% de la hauteur de la page
        if (scrollPosition > 0.8 * pageHeight) {
            retourAccueil.style.position = 'fixed';
            retourAccueil.style.bottom = '20%';
            retourAccueil.style.left = '50%';
            retourAccueil.style.transform = 'translate(-50%, -50%)';
        } else {
            // Rétablir la position d'origine
            retourAccueil.style.position = 'fixed';
            retourAccueil.style.bottom = '2%';
            retourAccueil.style.left = '2%';
            retourAccueil.style.transform = 'none';
        }
    });

});



