<?php

class MenuFilterBuilder
{
    public function build(array $filters): array
    {
        $where = "WHERE is_active = 1";
        $params = [];

        if (isset($filters['minPrice'])) {
            $where .= " AND prix_base >= :minPrice";
            $params[':minPrice'] = (float) $filters['minPrice'];
        }

        if (isset($filters['maxPrice'])) {
            $where .= " AND prix_base <= :maxPrice";
            $params[':maxPrice'] = (float) $filters['maxPrice'];
        }

        if (isset($filters['minPersons'])) {
            $where .= " AND nb_personnes_min >= :minPersons";
            $params[':minPersons'] = (int) $filters['minPersons'];
        }

        if (!empty($filters['titre'])) {
            $where .= " AND titre LIKE :titre";
            $params[':titre'] = '%' . $filters['titre'] . '%';
        }

        if (isset($filters['stock']) && $filters['stock'] !== '') {
            if ($filters['stock'] === 'ok') {
                $where .= " AND stock >= 10";
            } elseif ($filters['stock'] === 'low') {
                $where .= " AND stock > 0 AND stock < 10";
            } elseif ($filters['stock'] === '0') {
                $where .= " AND stock = 0";
            }
        }

        if (!empty($filters['themes'])) {
            $placeholders = [];
            foreach ($filters['themes'] as $i => $theme) {
                $key = ":theme_{$i}";
                $placeholders[] = $key;
                $params[$key] = $theme;
            }
            $in = implode(',', $placeholders);
            $where .= " AND id IN (
                SELECT mt.menu_id FROM menu_theme mt
                JOIN themes t ON mt.theme_id = t.id
                WHERE t.libelle IN ($in)
            )";
        }

        if (!empty($filters['regimes'])) {
            $placeholders = [];
            foreach ($filters['regimes'] as $i => $regime) {
                $key = ":regime_{$i}";
                $placeholders[] = $key;
                $params[$key] = $regime;
            }
            $in = implode(',', $placeholders);
            $where .= " AND id IN (
                SELECT mr.menu_id FROM menu_regime mr
                JOIN regimes r ON mr.regime_id = r.id
                WHERE r.libelle IN ($in)
            )";
        }

        return [$where, $params];
    }
}