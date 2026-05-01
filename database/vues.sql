-- =============================================
-- VUES - Vite & Gourmand
-- =============================================

-- =============================================
-- Vue : menus complets
-- =============================================
CREATE OR REPLACE VIEW vue_menus_complets AS
SELECT 
    m.id,
    m.titre,
    m.description,
    m.prix_base,
    m.nb_personnes_min,
    m.stock,
    m.conditions,
    m.is_active,
    GROUP_CONCAT(DISTINCT t.libelle  ORDER BY t.libelle  SEPARATOR ', ') AS themes,
    GROUP_CONCAT(DISTINCT r.libelle  ORDER BY r.libelle  SEPARATOR ', ') AS regimes,
    GROUP_CONCAT(DISTINCT mi.url     ORDER BY mi.ordre   SEPARATOR ', ') AS images
FROM menus m
LEFT JOIN menu_theme  mt ON m.id = mt.menu_id
LEFT JOIN themes       t ON mt.theme_id  = t.id
LEFT JOIN menu_regime mr ON m.id = mr.menu_id
LEFT JOIN regimes      r ON mr.regime_id = r.id
LEFT JOIN menu_images mi ON m.id = mi.menu_id
GROUP BY 
    m.id, m.titre, m.description, m.prix_base,
    m.nb_personnes_min, m.stock, m.conditions, m.is_active;

-- =============================================
-- Vue : plats avec allergènes
-- =============================================
CREATE OR REPLACE VIEW vue_plats_allergenes AS
SELECT 
    p.id,
    p.nom,
    p.description,
    p.type_id,
    GROUP_CONCAT(a.libelle SEPARATOR ', ') AS allergenes
FROM plats p
LEFT JOIN plat_allergene pa ON p.id = pa.plat_id
LEFT JOIN allergenes a ON pa.allergene_id = a.id
GROUP BY p.id, p.nom, p.description, p.type_id;

-- =============================================
-- Vue : menus avec plats
-- =============================================
CREATE OR REPLACE VIEW vue_menus_plats AS
SELECT 
    m.id AS menu_id,
    m.titre AS menu_titre,
    p.id AS plat_id,
    p.nom AS plat_nom,
    p.type_id AS plat_type
FROM menus m
JOIN menu_plat mp ON m.id = mp.menu_id
JOIN plats p ON mp.plat_id = p.id;

-- =============================================
-- Vue : commandes détaillées
-- =============================================
CREATE OR REPLACE VIEW vue_commandes_details AS
SELECT 
    c.id,
    c.numero_commande,
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
    c.user_id,
    c.menu_id,
    m.titre    AS menu_titre,
    sc.libelle AS statut
FROM commandes c
JOIN menus m             ON c.menu_id   = m.id
JOIN statuts_commande sc ON c.statut_id = sc.id;

-- =============================================
-- Vue : historique commandes
-- =============================================
CREATE OR REPLACE VIEW vue_historique_commandes AS
SELECT 
    h.id,
    h.created_at,
    h.modifie_par,
    c.id AS commande_id,
    sc.libelle AS statut,
    u.nom,
    u.prenom
FROM commande_historique_statuts h
JOIN commandes c         ON h.commande_id = c.id
JOIN statuts_commande sc ON h.statut_id   = sc.id
JOIN users u             ON c.user_id     = u.id;
