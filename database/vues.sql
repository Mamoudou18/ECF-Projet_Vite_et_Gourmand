-- =============================================
-- VUES - Vite & Gourmand
-- =============================================

-- Vue : menus complets
CREATE VIEW vue_menus_complets AS
SELECT 
    m.id,
    m.titre,
    m.description,
    m.prix,
    m.nb_personnes_min,
    m.stock,
    m.conditions,
    t.libelle AS theme,
    r.libelle AS regime,
    GROUP_CONCAT(mi.url ORDER BY mi.ordre SEPARATOR ', ') AS images
FROM menus m
JOIN themes t ON m.theme_id = t.id
JOIN regimes r ON m.regime_id = r.id
LEFT JOIN menu_images mi ON m.id = mi.menu_id
GROUP BY 
    m.id, m.titre, m.description, m.prix, 
    m.nb_personnes_min, m.stock, m.conditions,
    t.libelle, r.libelle;

-- =============================================

-- Vue : plats avec allergènes
CREATE VIEW vue_plats_allergenes AS
SELECT 
    p.id,
    p.nom,
    p.description,
    p.type,
    GROUP_CONCAT(a.libelle SEPARATOR ', ') AS allergenes
FROM plats p
LEFT JOIN plats_allergenes pa ON p.id = pa.plat_id
LEFT JOIN allergenes a ON pa.allergene_id = a.id
GROUP BY p.id, p.nom, p.description, p.type;

-- =============================================

-- Vue : menus avec plats
CREATE VIEW vue_menus_plats AS
SELECT 
    m.id AS menu_id,
    m.titre AS menu_titre,
    p.id AS plat_id,
    p.nom AS plat_nom,
    p.type AS plat_type
FROM menus m
JOIN menus_plats mp ON m.id = mp.menu_id
JOIN plats p ON mp.plat_id = p.id;

-- =============================================

-- Vue : commandes détaillées
CREATE VIEW vue_commandes_details AS
SELECT 
    c.id,
    c.nom_client,
    c.prenom_client,
    c.email_client,
    c.gsm_client,
    c.adresse_prestation,
    c.ville_prestation,
    c.code_postal_prestation,
    c.date_prestation,
    c.heure_prestation,
    c.nb_personnes,
    c.prix_menu,
    c.prix_livraison,
    c.prix_total,
    c.commentaire,
    c.location_materiel,
    c.motif_annulation,
    c.mode_contact,
    c.created_at,
    c.updated_at,
    u.nom        AS user_nom,
    u.prenom     AS user_prenom,
    u.email      AS user_email,
    u.gsm        AS user_gsm,
    m.titre      AS menu_titre,
    sc.libelle   AS statut
FROM commandes c
JOIN users u          ON c.user_id   = u.id
JOIN menus m          ON c.menu_id   = m.id
JOIN statuts_commande sc ON c.statut_id = sc.id;


-- =============================================

-- Vue : avis validés
CREATE VIEW vue_avis_valides AS
SELECT 
    a.id,
    a.note,
    a.commentaire,
    a.created_at,
    u.nom,
    u.prenom
FROM avis a
JOIN users u ON a.user_id = u.id
JOIN statuts_avis sa ON a.statut_id = sa.id
WHERE sa.libelle = 'valide';

-- =============================================

-- Vue : historique commandes
CREATE VIEW vue_historique_commandes AS
SELECT 
    h.id,
    h.changed_at,
    c.id AS commande_id,
    sc.libelle AS statut,
    u.nom,
    u.prenom
FROM historique_statuts h
JOIN commandes c ON h.commande_id = c.id
JOIN statuts_commande sc ON h.statut_id = sc.id
JOIN users u ON h.user_id = u.id;
