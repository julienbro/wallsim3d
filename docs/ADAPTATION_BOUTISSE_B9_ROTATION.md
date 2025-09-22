# Boutisse B9: mêmes décalages que panneresse (rotation 90°)

Date: 2025-09-20

Objectif: Quand on place un bloc B9 en boutisse (via clic droit, rotation 90°), les suggestions de blocs adjacents conservent exactement les mêmes décalages qu'en panneresse, simplement tournés de 90°.

## Résumé du changement
- La génération des suggestions d'angle en boutisse (positions S, T, U, V) réutilise désormais les positions d'angle panneresse (G, H, I, J) en leur appliquant une rotation locale de +90°.
- Ainsi, tous les décalages fins déjà calibrés pour le mode panneresse sont préservés en boutisse.

Fichier impacté:
- `js/construction-tools.js`
  - Section « SUGGESTIONS D'ANGLE POUR LES BOUTISSES »: remplacement de la logique de calcul direct par une rotation des positions de panneresse.

## Détails techniques
- Les positions panneresse G/H/I/J sont calculées comme avant (x/z locaux + rotation).
- On applique une rotation locale de +90°: x' = -z, z' = x, et rotation' = rotation + 90°.
- On remappe: G→S, H→T, I→U, J→V, en conservant les types d'angle correspondants.
- Les ajustements spécifiques par lettre (système de lettrage combiné) restent appliqués de façon indépendante après rotation.

## Effet utilisateur
- Clic droit sur le fantôme -> rotation 90° (boutisse).
- Les propositions adjacentes autour d'un B9 en boutisse gardent les mêmes écarts qu'en panneresse, simplement tournés.

## Vérification
- Charger une scène avec un B9 de référence.
- Afficher les suggestions, puis clic droit pour passer en boutisse.
- Constater que les positions S/T/U/V correspondent à la rotation des positions G/H/I/J.

---

Notes: La logique est générique (s'applique aussi aux autres blocs), mais l'objectif premier était B9.
