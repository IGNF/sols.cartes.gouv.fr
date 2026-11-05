# Références de design (Figma)

Source de vérité : <https://www.figma.com/design/8G2DLGMfv3MoFmf8lRy7rG/sols.cartes.gouv.fr>. Les captures ci-dessous ont été exportées le 2026-11-05 par l'orchestrateur (outil Figma MCP, lecture seule) pour que les agents et les relecteurs puissent comparer sans accès Figma. Elles sont réduites et quantifiées (moins de 300 kB chacune) ; se référer au fichier Figma pour le détail.

| Fichier | Nœud Figma | Contenu |
|---|---|---|
| `figma-home-1440-light.png` | `8:4414` (« 1440w light ») | Page d'accueil complète : HEADER, HERO, SERVICE, CAS D'USAGE, DONNÉES, AGENDA, PARTENAIRES, CTA LANCEMENT, FOOTER |
| `figma-hero-1440.png` | `8:4415` (HERO) | Bloc d'en-tête de la page d'accueil |
| `figma-header-1440.png` | `8:4924` (HEADER) | En-tête : Marianne + logo GIS Sol, titre « sols.cartes.gouv.fr », tagline « Observatoire des sols de France », outils Aide / Services / Se connecter |
| `figma-footer-1440.png` | `8:4907` (FOOTER) | Pied de page sombre personnalisé (hors DSFR standard) |

Autres pages du fichier : « Couverture » (`1:10969`) et, dans « Prototype », des imports html.to.design de cartes.gouv.fr et osf.gissol.fr (composants de référence, non des maquettes du projet).

## Écarts v0 consignés

- En-tête : titre et tagline repris tels quels ; les outils Aide / Services / Se connecter ne sont pas dans le périmètre v0 (pas d'authentification).
- Pied de page : la maquette propose un bloc sombre personnalisé ; la v0 garde le pied de page DSFR standard (question Q7 dans `doc/agents/QUESTIONS.md`).
- Page d'accueil : ordre des sections respecté avec des composants DSFR, textes provisoires ; agenda, partenaires, chiffres et capture d'application non repris (voir E-1).
