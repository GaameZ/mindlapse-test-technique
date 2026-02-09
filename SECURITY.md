# Security Documentation

## Authentification et Minimisation des Données

### Principe : Minimisation de l'exposition des données

Les endpoints d'authentification (`/auth/register` et `/auth/login`) appliquent le principe de **minimisation des données** pour réduire la surface d'attaque.

**Pourquoi ?**
- Un attaquant ne doit pas pouvoir extraire d'informations sur la structure de l'organisation
- Les données utilisateur (rôle, organization_id, etc.) ne sont pas nécessaires côté client immédiatement après login
- Le JWT contient déjà toutes les informations nécessaires pour l'autorisation

### Implémentation

**Réponse de `/auth/register` et `/auth/login`** :
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

| Endpoint | Production | Dev/Test |
|----------|------------|----------|
| POST /auth/register | 3 req/15min | 100 req/1h |
| POST /auth/login | 5 req/5min | 100 req/1h |

**Blocage** :
- Production : 30 min (register), 15 min (login)
- Dev/Test : 5 min

**Code HTTP** : `429 Too Many Requests`

**Store** : `memory`

**Production** : Utiliser Redis store pour clustering

### Pourquoi Redis pour le clustering ?

**Problème avec memory store** :

Avec 3 instances Node.js derrière un load balancer :

```
Instance 1 (memory): user@example.com → 2 requêtes
Instance 2 (memory): user@example.com → 2 requêtes  
Instance 3 (memory): user@example.com → 2 requêtes
```

Total : **6 requêtes** alors que la limite est 5 → ⚠️ Rate limiting inefficace

**Raison** : Chaque instance a sa propre mémoire isolée

**Solution avec Redis store** :

```
Instance 1 → Redis (compteur partagé): user@example.com = 1
Instance 2 → Redis (compteur partagé): user@example.com = 2
Instance 3 → Redis (compteur partagé): user@example.com = 3
Instance 1 → Redis (compteur partagé): user@example.com = 4
Instance 2 → Redis (compteur partagé): user@example.com = 5
Instance 3 → Redis (compteur partagé): user@example.com = 6 → 🚫 429 Too Many Requests
```

**Bénéfices** :
- Compteur **centralisé** et **partagé** entre toutes les instances
- Rate limiting **cohérent** peu importe quelle instance traite la requête
- Persistence optionnelle (survit aux redémarrages)

**Quand utiliser Redis ?**
- ✅ Production avec load balancer (2+ instances)
- ✅ Déploiement horizontal (auto-scaling)
- ❌ Dev/test mono-instance (memory suffit)

---

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

## Vulnérabilités (npm audit)

**État** : ⚠️ Audit manuel (pas de CI)

**Politique** :
- 🔴 Critical : Fix < 24h
- 🟠 High : Fix < 7j
- 🟡 Moderate : Fix < 30j

**Commande** : `pnpm audit`

**Roadmap** : GitHub Actions + Dependabot

---

## Résumé

| Aspect | Status | Détail |
|--------|--------|--------|
| **CSRF** | ✅ | JWT en header |
| **XSS** | ✅ | Regex `/^[a-zA-Z0-9\s\.,;:!?\-()'"]*$/` |
| **Rate Limiting** | ✅ | 3/15min register, 5/5min login |
| **Secrets** | ✅ | Validation boot, .env.gitignore |
| **Headers** | ✅ | Helmet (7 headers) |
| **Multi-tenant** | ✅ | Scoping + 5 tests |
| **Audit trail** | ✅ | Append-only + FK RESTRICT |
| **npm audit** | ⚠️ | Manuel (CI TODO) |
