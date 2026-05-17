-- =============================================
-- BASE DE DONNÉES : ViteGourmandRestaurent_db
-- =============================================

CREATE DATABASE IF NOT EXISTS ViteGourmandRestaurent_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ViteGourmandRestaurent_db;

-- =============================================
-- TABLES DE RÉFÉRENCE
-- =============================================

CREATE TABLE roles (
    id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE themes (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE regimes (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE types_plat (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE statuts_commande (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE,
    ordre   INT NOT NULL
);

CREATE TABLE jours (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(20) NOT NULL UNIQUE,
    ordre   INT NOT NULL
);

-- =============================================
-- UTILISATEURS
-- =============================================

CREATE TABLE users (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom                    VARCHAR(100) NOT NULL,
    prenom                 VARCHAR(100) NOT NULL,
    email                  VARCHAR(255) NOT NULL UNIQUE,
    password               VARCHAR(255) NOT NULL,
    gsm                    VARCHAR(20),
    adresse                VARCHAR(255),
    ville                  VARCHAR(100),
    code_postal            VARCHAR(10),
    role_id                INT UNSIGNED NOT NULL,
    is_actif               BOOLEAN DEFAULT 1,
    api_token              VARCHAR(64) NOT NULL UNIQUE,
    reset_token            VARCHAR(64) NULL,
    reset_token_expires_at DATETIME NULL,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id),

    INDEX idx_users_reset_token (reset_token)
);

-- =============================================
-- HORAIRES
-- =============================================

CREATE TABLE horaires (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    jour_id        INT UNSIGNED NOT NULL UNIQUE,
    heure_ouverture TIME,
    heure_fermeture TIME,
    is_ferme        BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_horaires_jour
        FOREIGN KEY (jour_id) REFERENCES jours(id)
);

-- =============================================
-- ALLERGÈNES
-- =============================================

CREATE TABLE allergenes (
    id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE
);

-- =============================================
-- PLATS
-- =============================================

CREATE TABLE plats (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(150) NOT NULL,
    description TEXT,
    type_id     INT UNSIGNED NOT NULL,

    CONSTRAINT fk_plats_type
        FOREIGN KEY (type_id) REFERENCES types_plat(id)
);

-- Pivot plats <-> allergènes (N,N)
CREATE TABLE plat_allergene (
    plat_id      INT UNSIGNED NOT NULL,
    allergene_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (plat_id, allergene_id),

    CONSTRAINT fk_plat_allergene_plat
        FOREIGN KEY (plat_id) REFERENCES plats(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_plat_allergene_allergene
        FOREIGN KEY (allergene_id) REFERENCES allergenes(id)
        ON DELETE CASCADE
);

-- =============================================
-- MENUS
-- =============================================

CREATE TABLE menus (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titre            VARCHAR(150) NOT NULL,
    description      TEXT,
    nb_personnes_min INT UNSIGNED NOT NULL DEFAULT 1,
    prix_base        DECIMAL(10,2) NOT NULL,
    stock            INT UNSIGNED NOT NULL DEFAULT 0,
    conditions       TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NULL DEFAULT NULL
                     ON UPDATE CURRENT_TIMESTAMP
);

-- Images d'un menu (1,N)
CREATE TABLE menu_images (
    id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    menu_id  INT UNSIGNED NOT NULL,
    url      VARCHAR(500) NOT NULL,
    ordre    INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_menu_images_menu
        FOREIGN KEY (menu_id) REFERENCES menus(id)
        ON DELETE CASCADE
);

-- Pivot menus <-> thèmes (N,N)
CREATE TABLE menu_theme (
    menu_id  INT UNSIGNED NOT NULL,
    theme_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (menu_id, theme_id),

    CONSTRAINT fk_menu_theme_menu
        FOREIGN KEY (menu_id) REFERENCES menus(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_menu_theme_theme
        FOREIGN KEY (theme_id) REFERENCES themes(id)
        ON DELETE CASCADE
);

-- Pivot menus <-> régimes (N,N)
CREATE TABLE menu_regime (
    menu_id   INT UNSIGNED NOT NULL,
    regime_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (menu_id, regime_id),

    CONSTRAINT fk_menu_regime_menu
        FOREIGN KEY (menu_id) REFERENCES menus(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_menu_regime_regime
        FOREIGN KEY (regime_id) REFERENCES regimes(id)
        ON DELETE CASCADE
);

-- Pivot menus <-> plats (N,N)
CREATE TABLE menu_plat (
    menu_id INT UNSIGNED NOT NULL,
    plat_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (menu_id, plat_id),

    CONSTRAINT fk_menu_plat_menu
        FOREIGN KEY (menu_id) REFERENCES menus(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_menu_plat_plat
        FOREIGN KEY (plat_id) REFERENCES plats(id)
        ON DELETE CASCADE
);

-- =============================================
-- COMMANDES
-- =============================================

CREATE TABLE commandes (
    id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_commande        VARCHAR(50) NULL,
    user_id                INT UNSIGNED NOT NULL,
    menu_id                INT UNSIGNED NOT NULL,
    statut_id              INT UNSIGNED NOT NULL,
    nom_client             VARCHAR(100) NOT NULL,
    prenom_client          VARCHAR(100) NOT NULL,
    email_client           VARCHAR(255) NOT NULL,
    gsm_client             VARCHAR(20) NOT NULL,
    adresse_prestation     VARCHAR(255) NOT NULL,
    ville_prestation       VARCHAR(100) NOT NULL,
    code_postal_prestation VARCHAR(10) NOT NULL,
    date_prestation        DATE NOT NULL,
    heure_prestation       TIME NOT NULL,
    nb_personnes           INT UNSIGNED NOT NULL,
    prix_menu              DECIMAL(10,2) NOT NULL,
    prix_livraison         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    prix_total             DECIMAL(10,2) NOT NULL,
    commentaire            TEXT NULL,
    location_materiel      TINYINT(1) NOT NULL DEFAULT 0,
    motif_annulation       TEXT NULL,
    mode_contact           VARCHAR(50) NULL,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NULL DEFAULT NULL
                           ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_commandes_user
        FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT fk_commandes_menu
        FOREIGN KEY (menu_id) REFERENCES menus(id),

    CONSTRAINT fk_commandes_statut
        FOREIGN KEY (statut_id) REFERENCES statuts_commande(id),

    INDEX idx_commandes_numero (numero_commande),
    INDEX idx_commandes_date_prestation (date_prestation)
);

-- =============================================
-- HISTORIQUE DES STATUTS DE COMMANDE
-- =============================================

CREATE TABLE commande_historique_statuts (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    commande_id INT UNSIGNED NOT NULL,
    statut_id   INT UNSIGNED NOT NULL,
    modifie_par INT UNSIGNED NOT NULL,
    commentaire TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historique_commande
        FOREIGN KEY (commande_id) REFERENCES commandes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_historique_statut
        FOREIGN KEY (statut_id) REFERENCES statuts_commande(id),

    CONSTRAINT fk_historique_user
        FOREIGN KEY (modifie_par) REFERENCES users(id)
);


-- =============================================
-- DONNÉES DE RÉFÉRENCE (INSERTS)
-- =============================================

INSERT INTO roles (libelle) VALUES
    ('admin'),
    ('employe'),
    ('utilisateur');

INSERT INTO themes (libelle) VALUES
    ('noel'),
    ('paques'),
    ('classique'),
    ('evenement');

INSERT INTO regimes (id,libelle) VALUES
    (1, 'vegetarien'),
    (2, 'vegan'),
    (3, 'classique'),
    (4, 'hallal'),
    (5, 'sans-gluten');

INSERT INTO types_plat (libelle) VALUES
    ('entree'),
    ('plat'),
    ('dessert');

INSERT INTO statuts_commande (libelle, ordre) VALUES
    ('en_attente',               1),
    ('accepte',                  2),
    ('en_preparation',           3),
    ('en_cours_livraison',       4),
    ('livre',                    5),
    ('attente_retour_materiel',  6),
    ('terminee',                 7),
    ('annulee',                  8);

INSERT INTO jours (libelle, ordre) VALUES
    ('Lundi',    1),
    ('Mardi',    2),
    ('Mercredi', 3),
    ('Jeudi',    4),
    ('Vendredi', 5),
    ('Samedi',   6),
    ('Dimanche', 7);

-- Horaires par défaut (à modifier via espace admin/employé)
INSERT INTO horaires (jour_id, heure_ouverture, heure_fermeture, is_ferme)
SELECT id, '09:00:00', '19:00:00', FALSE FROM jours;
