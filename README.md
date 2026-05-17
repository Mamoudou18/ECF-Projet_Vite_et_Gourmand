# 🍽️  Vite & Gourmand 

Application web de commande en ligne de menus traiteur pour l'entreprise Vite et Gourmand (Julie et José) à Bordeaux.
Développée dans le cadre de mon projet de formation Développeur Web et web mobile.


# 🛠️ Stack Technique

* Front : HTML/CSS (Bootstrap), JavaScript
* Back-end : PHP (avec utilisation de PDO)
* Base de données relationnelle : MySQL
* Base de données non relationnelle (NoSQL) : MongoDB
* Serveur local :  Nginx via Docker
* Déploiement :  Heroku

# ⚙️  Prérequis
Avant de commencer l'install de ce projet en local, assurez-vous d'avoir installé : 
* Docker & Docker Compose voir https://www.docker.com/
* un Git voir https://git-scm.com/
* Composer pour installer les dépendances PHP voir https://getcomposer.org/doc/
* Node js pour l'installation de bootstrap et la compilation de scss voir : https://nodejs.org/fr/download et https://getbootstrap.com/docs/5.0/getting-started/download/


# Installation en local

1. Cloner le dépot git: 
    * git clone https://github.com/Mamoudou18/ECF-Projet_Vite_et_Gourmand.git
    * cd projet-ecf-vitegourmand

2. Configurer les variables d'environnement
    * créer un fichier .env
    * copier les paramètres ci-dessous et remplir les valeurs manquantes:

        # Base de données
            DB_HOST=mysql
            DB_NAME=NOM_DE_VOTRE_BDD
            DB_USER=NOM_USER_BDD
            DB_PASSWORD=VOTRE_MOT_DE_PASSE
            DB_ROOT_PASSWORD=VOTRE_MOT_DE_PASSE_ROOT

        # Ports
            MYSQL_PORT=3306
            PHPMYADMIN_PORT=8080
            NGINX_PORT=3000     

        # Application
            APP_ENV=development
            APP_DEBUG=true
            APP_SECRET=VOTRE_SECRET

        # Envoi mail
            MAIL_HOST=smtp.gmail.com
            MAIL_PORT=587
            MAIL_USERNAME=votre_adresse_mail_dediée
            MAIL_PASSWORD=VOTRE_MOT_DE_PASSE_APPLICATION
            MAIL_FROM_ADDRESS=votre_adresse_mail_dediée
            MAIL_FROM_NAME="Vite & Gourmand"
            CONTACT_PHONE=VOTRE_NUMERO

            ⚠️ une configuration de votre adresse mail est nécessaire pour la partie smtp (authentification double facteur, mot de passe l'application, ...)

        # URL Front
            FRONTEND_URL=http://localhost:3000

        # MongoDB
            MONGO_URI=mongodb://MongoDB:27017
            MONGO_DB=vite_gourmand_db

    ⚠️ NB :  Le fichier .env ne doit jamais être commiter

3. Installer les dépendances PHP pour le back-end

    * cd backend
    * composer install

4. Installer Bootstrap

    * cd frontend
    * npm install
    * télécharger l'extention vs code :  live Sass Compiler

5. Installer via Docker Compose : Nginx, MySQL, MongoDB, Mongo Express, PHP, PhpMyAdmin

    * docker-compose up -d --build
    * vérifier avec docker ps que tout tourne correctement


# 🌐 Accès à l'application

*   Service URL Application (Front) http://localhost:3000 
*   Installer l'extension VS Code PHP Server pour servir le front sur le port 3000
*   API (Back) http://localhost/api/* 
*   phpMyAdmin http://localhost:8080



# 📁 Structure du projet

projet-ecf-vitegourmand/
├──backend
│   ├── composer.json
│   ├── composer.lock
│   ├── config
│   │   └── database.php
│   ├── controllers
│   │   ├── AuthController.php
│   │   ├── AvisController.php
│   │   ├── CommandeController.php
│   │   ├── ContactController.php
│   │   ├── HoraireController.php
│   │   ├── MenuController.php
│   │   └── StatsController.php
│   ├── mails
│   │   ├── AccountCreateMail.php
│   │   ├── CommandeCreateMail.php
│   │   ├── CommandeRetourMaterielMail.php
│   │   ├── CommandeTermineeMail.php
│   │   ├── ContactMail.php
│   │   ├── ResetPasswordMail.php
│   │   └── WelcomeMail.php
│   ├── middleware
│   │   └── AuthMiddleware.php
│   ├── models
│   │   ├── Avis.php
│   │   ├── Commande.php
│   │   ├── Contact.php
│   │   ├── HistoriqueStatut.php
│   │   ├── Horaire.php
│   │   ├── Menu.php
│   │   ├── Stats.php
│   │   └── User.php
│   ├── public
│   │   ├── index.php
│   │   └── uploads
│   └── utils
│       ├── LogService.php
│       ├── RateLimitService.php
│       ├── ResponseService.php
│       └── ValidationService.php
├── composer.json
├── composer.lock
├── config
│   └── nginx.conf.erb
├── database
│   └── init.sql
├── docker
│   ├── nginx
│   │   ├── default.conf
│   │   └── Dockerfile
│   └── php
│       └── Dockerfile
├── docker-compose.yml
├── frontend
│   ├── eslint.config.js
│   ├── images
│   │   ├── bigtitle.webp
│   │   └── topChef.webp
│   ├── index.html
│   ├── js
│   │   ├── auth
│   │   ├── avis
│   │   ├── commandes
│   │   ├── comptes
│   │   ├── config.js
│   │   ├── contact
│   │   ├── home
│   │   ├── menus
│   │   ├── script.js
│   │   └── utils
│   ├── package-lock.json
│   ├── package.json
│   ├── pages
│   │   ├── 404.html
│   │   ├── auth
│   │   ├── avis
│   │   ├── commandes
│   │   ├── comptes
│   │   ├── contact.html
│   │   ├── home.html
│   │   ├── mentions-cgv
│   │   └── menus
│   ├── robots.txt
│   ├── Router
│   │   ├── allRoutes.js
│   │   ├── Route.js
│   │   └── Router.js
│   ├── router.php
│   └── scss
│       ├── _custom.scss
│       ├── main.css
│       ├── main.css.map
│       └── main.scss
├── mongo_configdb
├── Procfile
└── README.md

# 🔒 Sécurité

* Mots de passe hashés avec password_hash() (bcrypt)

* Protection contre les injections SQL via PDO et requêtes préparées

* Tokens JWT pour l'authentification

* Variables d'environnement pour les données sensibles

* Validation des données côté serveur


# 🌍 Déploiement
L'application est déployée sur Heroku : https://vite-et-gourmand.fr
Pour plus de détails sur le déploiement, consultez la documentation technique.

# 📄 Licence

Projet réalisé dans le cadre du TP Développeur Web et Web Mobile — Studi / FastDev