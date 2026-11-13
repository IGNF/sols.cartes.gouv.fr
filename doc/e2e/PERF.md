# Durée de la suite e2e (T6)

`E2E_WORKERS=n` règle le nombre de workers Playwright (parallélisme par fichier, sans `fullyParallel`). Défaut : 4 en local, 1 si `CI` est défini.

Mesures (2026-11-13, machine à 22 cœurs, `preview:all` déjà lancé, 147 réussis et 11 ignorés à chaque passage, 0 échec, 0 flaky, 0 nouvel essai) :

| Workers | Passage 1 | Passage 2 |
|---|---|---|
| 1 | 487 s (8,1 min) | |
| 2 | 281 s | 278 s |
| 4 | 183 s | 180 s |

Où va le temps : `bun run build:all` ≈ 25 s (caches chauds) ; la suite ≈ 8 min à 1 worker, dominée par `03-carto.spec.ts` (test de stabilité du rendu, 20 chargements par projet, puis tuiles GPF) ; aucun nouvel essai déclenché sur ces passages. Le temps de la suite plafonne vers 3 min avec 4 workers parce qu'un fichier reste séquentiel. 05-captures est court et sert d'illustration pour `doc/e2e/` : à garder.

Pistes sûres non faites : sauter `build:all` si `dist/` est plus récent que les sources (gain ≈ 25 s) ; passer à 6 ou 8 workers (non mesuré).
