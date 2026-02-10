# Security Documentation

## Authentification et Minimisation des Données

### Principe : Minimisation de l'exposition des données

Les endpoints d'authentification (`/auth/register` et `/auth/login`) appliquent le principe de **minimisation des données** pour réduire la surface d'attaque.

**Pourquoi ?**

- Un attaquant ne doit pas pouvoir extraire d'informations sur la structure de l'organisation
- Les données utilisateur (rôle, organization_id, etc.) ne sont pas nécessaires côté client immédiatement après login
- Le JWT contient déjà toutes les informations nécessaires pour l'autorisation

### Implémentation

**Réponse de `/auth/login`** :

```json
{
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**Comment obtenir les données utilisateur ?**

Le client doit appeler `GET /api/v1/auth/me` avec le token JWT :

```bash
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

Réponse :

```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "fullName": "...",
      "role": "...",
      "organizationId": "..."
    }
  }
}
```

### Messages d'erreur génériques

**Login échoué** :

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid credentials"
}
```

**Pourquoi pas "Invalid email" ou "Invalid password" ?**

- Évite l'énumération d'emails (un attaquant ne peut pas savoir si un email existe)
- Message générique.

## Audit Trail Integrity

### Principe : Append-Only et Immuabilité

Les audit logs sont **append-only** et **immuables**. Aucune suppression ni modification n'est autorisée, conformément aux meilleures pratiques de conformité et de traçabilité.

### Protection contre le Cascade Delete

Limiter le **delete cascade** est essentiel pour garantir l'intégrité et la traçabilité des logs d'audit. Si une contrainte `ON DELETE CASCADE` était appliquée sur les clés étrangères des `audit_logs`, une suppression accidentelle ou mal ciblée (ex: mauvaise requête SQL) sur une entité liée (utilisateur, fournisseur) entraînerait la suppression automatique de tous les logs associés. Cela compromettrait la conformité, la capacité d'investigation et la preuve d'historique.

**En pratique** :

- Les FK de `audit_logs` sont définies avec `ON DELETE RESTRICT` ou sans contrainte de suppression automatique.
- Toute tentative de suppression d'un utilisateur lié à des logs d'audit échoue (RESTRICT).
- Les logs d'audit restent toujours présents, même si l'entité d'origine est supprimée.

**But** : Prévenir la perte de données critiques et éviter qu'une erreur de manipulation ne supprime l'historique complet d'une organisation.

### Test de non-régression

Le test `CRUD operations generate audit trail with before/after state` vérifie :

1. Création d'un supplier → log CREATE avec `before: null`
2. Modification → log UPDATE avec `before` et `after`
3. Accès API aux logs avant suppression → 200 OK
4. Suppression du supplier → log DELETE avec `after: null`
5. Accès API aux logs après suppression → 404 NOT FOUND
6. **Vérification DB directe** → Les 3 logs (CREATE, UPDATE, DELETE) sont toujours présents ✅

---

## CSRF et XSS

### CSRF (Cross-Site Request Forgery)

**Protection** : ✅ Architecture résistante (JWT en header)

**Pourquoi CSRF est impossible ici ?**

CSRF exploite le fait que le navigateur **envoie automatiquement** les cookies à chaque requête vers un domaine.

**Notre architecture (avec JWT en header)** :

1. Client stocke le JWT (localStorage/memory, pas de cookie)
2. Chaque requête doit **manuellement** ajouter `Authorization: Bearer <token>`

**En résumé** :

- Cookie = envoi automatique par le navigateur → vulnérable CSRF
- JWT en header = envoi manuel par JavaScript → immunisé CSRF

### XSS (Cross-Site Scripting)

**Protection** : ✅ Validation regex stricte sur champ `notes`

**Effet** : Bloque `<script>`, `<iframe>`, `onclick=`, etc.

---

## Rate Limiting

**Protection** : ✅ Implémenté avec `@adonisjs/limiter`

### Limites configurées

| Endpoint            | Production  | Dev/Test   |
| ------------------- | ----------- | ---------- |
| POST /auth/register | 3 req/15min | 100 req/1h |
| POST /auth/login    | 5 req/5min  | 100 req/1h |

**Blocage** :

- Production : 30 min (register), 15 min (login)
- Dev/Test : 5 min

**Code HTTP** : `429 Too Many Requests`

## **Store** : `memory`

## Gestion des Secrets

**Protection** : ✅ Validation au boot + .env

**Comportement** : App refuse de démarrer si variable critique manquante

**Stockage** :

- `.env` en `.gitignore` ✅
- `.env.example` fourni ✅
- Aucun secret en dur dans le code ✅

---

## Headers de Sécurité

**Protection** : ✅ Helmet

### Headers configurés

1. **Content-Security-Policy** : Bloque scripts malveillants
2. **Strict-Transport-Security** : Force HTTPS (max-age=1 an)
3. **X-Frame-Options** : DENY (anti-clickjacking)
4. **X-Content-Type-Options** : nosniff (anti MIME-sniffing)
5. **Referrer-Policy** : strict-origin-when-cross-origin
6. **Permissions-Policy** : Désactive APIs non utilisées
7. **X-XSS-Protection** : 1; mode=block

---

## Isolation Multi-Tenant

**Protection** : ✅ Scoping applicatif + 5 tests d'isolation

### Principe

Chaque requête filtre par `organization_id` :

```typescript
const suppliers = await db
  .selectFrom('suppliers')
  .where('organization_id', '=', user.organizationId)
  .execute()
```

### Tests

- ✅ Org B ne voit pas les suppliers de Org A
- ✅ GET par ID → 404 (pas 403, masque l'existence)
- ✅ UPDATE → 404
- ✅ DELETE → 404
- ✅ Org A voit ses propres données

### RLS PostgreSQL

**Non implémenté** : Isolation applicative suffit pour ce scope

**Si production critique** :

- Défense en profondeur : app + DB
- Nécessite `SET LOCAL app.current_org_id`
- Overhead de performance

---

## CI Github Actions

### Audit Automatique (GitHub Actions)

**CI complète** exécutée sur chaque push et PR :

1. **Lint** : ESLint sur tous les packages (frontend, backend, shared)
2. **Tests** : Tests unitaires et d'intégration avec PostgreSQL et Redis
3. **pnpm audit** : Détecte les vulnérabilités dans les dépendances (niveau moderate+)

**Workflow CI** :

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    - ESLint sur tous les packages

  test:
    - Tests unitaires (shared, frontend, backend)
    - Tests d'intégration (avec PostgreSQL + Redis)

  audit:
    - pnpm audit --audit-level=moderate
```

### Commandes Manuelles

```bash
# Audit complet
pnpm audit

# Audit avec niveau de sévérité
pnpm audit --audit-level=high

# Fix automatique des vulnérabilités (si possible)
pnpm audit --fix
```

### Politique de Gestion des Vulnérabilités

| Sévérité | SLA de Correction | Action                                    |
| -------- | ----------------- | ----------------------------------------- |
| Critical | < 24h             | Hotfix immédiat, déploiement d'urgence    |
| High     | < 7 jours         | Fix prioritaire, inclus dans next release |
| Medium   | < 30 jours        | Fix planifié                              |
| Low      | Best effort       | Fix opportuniste lors de refactoring      |

---

## Protection contre l'Injection de Prompt (LLM)

**Protection** : ✅ Sanitisation des inputs avant envoi au LLM

### Vecteurs d'attaque bloqués

Tous les inputs utilisateur (name, domain, notes, category) sont sanitisés avant envoi au LLM :

- Suppression des blocs de code markdown (injection de code)
- Suppression des accolades (injection JSON)
- Suppression des patterns d'override d'instructions ("ignore previous instructions")
- Suppression des tentatives de leak du prompt ("show the instructions")
- Limitation de longueur à 1000 caractères (attaque par exhaustion de tokens)

### Implémentation

````typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[{}]/g, '')
    .replace(/(ignore|disregard|forget|override)\s+(previous|all|above)/gi, '')
    .replace(/(repeat|show|display)\s+(the\s+)?(instructions|prompt)/gi, '')
    .slice(0, 1000)
}
````

---

## Rate Limiting IA

**Protection** :

Le pipeline IA est protégé contre les abus :

- Rate limiting sur l'ajout de jobs dans la queue BullMQ
- Retry avec backoff exponentiel en cas d'échec
- Dead Letter Queue pour les jobs en échec permanent

---

## Résumé

| Aspect                  | Status | Détail                                  |
| ----------------------- | ------ | --------------------------------------- |
| **CSRF**                | ✅     | JWT en header                           |
| **XSS**                 | ✅     | Regex `/^[a-zA-Z0-9\s\.,;:!?\-()'"]*$/` |
| **Rate Limiting Auth**  | ✅     | 3/15min register, 5/5min login          |
| **Rate Limiting IA**    | ✅     |                                         |
| **Injection de Prompt** | ✅     | Sanitisation multi-vecteurs             |
| **Secrets**             | ✅     | Validation boot, .env.gitignore         |
| **Headers**             | ✅     | Helmet (7 headers)                      |
| **Multi-tenant**        | ✅     | Scoping + 5 tests                       |
| **Audit trail**         | ✅     | Append-only + FK RESTRICT               |
| **npm audit**           | ✅     | CI automatisée (GitHub Actions)         |
