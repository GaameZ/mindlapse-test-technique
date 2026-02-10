# Architecture

## Stack Technique Frontend

### Choix Techniques

**Framework & Langage**

- **React 19** : Composants fonctionnels avec hooks, performance optimale
- **TypeScript strict** : Typage fort pour réduire les erreurs runtime, meilleure maintenabilité
- **Vite** : Build ultra-rapide, meilleur DX que webpack

**Interface & Design System**

- **shadcn/ui** : Composants accessibles et personnalisables (pas une dépendance, code owned)
- **Tailwind CSS** : Utility-first, cohérence visuelle, pas de CSS-in-JS

**Gestion d'État**

- **TanStack Query (React Query)** : State serveur (caching, invalidation, refetch automatique)
- **Context API** : State client (auth, theme, permissions)
- **Pas de Redux** : Overkill pour ce scope, React Query + Context suffisent

**Formulaires & Validation**

- **React Hook Form** : Performance optimale (uncontrolled inputs), moins de re-renders
- **Zod** : Validation type-safe, schémas réutilisables frontend/backend
- **shadcn/ui Form** : Wrapper RHF + Zod avec accessibilité intégrée

**Authentification**

- **JWT en localStorage** : Simplicité, pas de cookie CORS issues
- **Refresh token** : Rotation automatique, sécurité améliorée
- **Pourquoi pas sessionStorage** : Persiste entre onglets, meilleure UX

**Notifications**

- **Sonner** : Toasts accessibles, API simple, animations fluides
- **Pas de react-toastify** : Moins moderne, setup plus verbeux

**Accessibilité**

- **aria-\*** attributes : Formulaires, modals, toasts, navigation
- **Focus management** : Trap focus dans les dialogs, restore focus après fermeture
- **Keyboard navigation** : Toutes les actions accessibles au clavier (Tab, Enter, Escape)
- **Screen reader** : Labels explicites, live regions pour les notifications

**Routing**

- **TanStack Router** : Type-safe routing, meilleur DX que React Router v6
- **Pas de React Router** : Moins de type-safety, API moins moderne

### Justification des Choix

| Choix                 | Pourquoi                                                             | Alternative Rejetée       | Raison du Rejet                     |
| --------------------- | -------------------------------------------------------------------- | ------------------------- | ----------------------------------- |
| **shadcn/ui**         | Code owned, personnalisable, accessible                              | Material UI, Chakra UI    | Bundle size                         |
| **React Hook Form**   | Performance (uncontrolled), DX excellent                             | Formik                    | Moins performant, API plus verbeux  |
| **Zod**               | Type-safe, schémas réutilisables, erreurs custom                     | Yup, Joi                  | Pas de type inference TypeScript    |
| **TanStack Query**    | State serveur natif, caching intelligent, refetch auto               | SWR, Redux Toolkit        | Moins de features (SWR), overkill   |
| **localStorage JWT**  | Simplicité, pas de CSRF, compatible SPA                              | Cookie httpOnly           | CORS issues, setup backend complexe |
| **TanStack Router**   | Type-safe, meilleur DX, file-based routing                           | React Router v6           | Moins de type-safety                |
| **Tailwind CSS**      | Utility-first, cohérence, pas de CSS-in-JS runtime cost              | CSS Modules, Emotion      | Setup verbeux, runtime overhead     |
| **Sonner**            | API simple, accessible, animations modernes                          | react-toastify            | Setup plus verbeux, moins moderne   |
| **Vite**              | HMR instantané, build rapide, config simple                          | webpack, Create React App | Lent, config complexe, deprecated   |
| **TypeScript strict** | Catch erreurs avant runtime, refactoring safe, meilleure maintenance | JavaScript, TS non-strict | Pas de safety, bugs runtime         |

---

## Stack Technique Backend

### Choix Technologiques

**Framework & Langage**

- **AdonisJS v6** : Framework fullstack moderne, TypeScript natif, conventions claires
- **TypeScript strict** : Typage fort, cohérence avec le frontend, partage de types via `@mindlapse/shared`
- **Node.js v22** : Performance améliorée, fetch API native, module ESM stable

**Base de Données**

- **PostgreSQL 16** : ACID, JSONB natif, row-level security
- **Kysely** : Query builder type-safe, contrôle SQL total

**Authentification & Sécurité**

- **JWT (access + refresh)** : Rotation automatique des refresh tokens
- **@adonisjs/limiter** : Rate limiting sur auth et endpoints IA (protection DDoS/brute-force)
- **@adonisjs/shield (Helmet)** : Headers de sécurité (CSP, HSTS, X-Frame-Options)
- **bcrypt** : Hash de mots de passe

**Job Queue & Async**

- **BullMQ** : Queue asynchrone, retry avec backoff exponentiel, dead letter queue
- **Redis** : Backend BullMQ, cache applicatif (sessions, rate limiting)

**Validation & Middleware**

- **VineJS** : Validateur natif AdonisJS, type-safe, messages d'erreur custom
- **Middleware RBAC custom** : Vérification granulaire des permissions
- **Middleware Audit** : Capture before/after state, IP tracking, append-only logs

**Migrations & Seed**

- **Kysely migrations** : Type-safe, version control DB, rollback possible
- **Seeders** : Données de test (2 orgs, 4 users, 20 suppliers) pour démo rapide

### Architecture Modulaire

**Structure des Packages**

```
package/backend/
├── app/
│   ├── controllers/     # Logique métier (SuppliersController, UsersController)
│   ├── middleware/      # Auth, RBAC, Audit, Rate Limiting
│   ├── validators/      # VineJS schemas (création, update, filtres)
│   └── services/        # Logique réutilisable (AI queue, permissions)
├── database/
│   ├── migrations/      # Kysely migrations (up/down)
│   └── seeders/         # Données de test
├── start/
│   ├── routes.ts        # Définition des routes API
│   └── kernel.ts        # Enregistrement des middlewares
└── config/              # Configuration (DB, auth, limiter, shield)
```

**Séparation des Responsabilités**

- **Controllers** : Validation inputs → Appel services → Retour HTTP
- **Services** : Logique métier réutilisable (permissions, AI queue, audit)
- **Middleware** : Auth, RBAC, audit trail
- **Validators** : Schémas de validation centralisés

### Justification des Choix

| Choix               | Pourquoi                                                           | Alternative Rejetée  | Raison du Rejet                         |
| ------------------- | ------------------------------------------------------------------ | -------------------- | --------------------------------------- |
| **AdonisJS v6**     | Framework fullstack moderne, TypeScript natif, conventions claires | NestJS, Express      | Trop verbeux (Nest), trop bas niveau    |
| **Kysely**          | Type-safe, contrôle SQL total, performance                         | Lucid ORM, Prisma    | Imposé par test (Lucid), vendor lock    |
| **PostgreSQL**      | ACID, JSONB, row-level security, window functions                  | MySQL, MongoDB       | Pas de JSONB natif, pas de ACID (Mongo) |
| **BullMQ**          | Retry, dead letter, observabilité, production-ready                | Agenda, Bee-Queue    | Moins de features, pas de Redis UI      |
| **JWT**             | Stateless, scalable, pas de session DB                             | Session cookies      | State DB, moins scalable                |
| **VineJS**          | Natif AdonisJS, type-safe, messages custom                         | Joi, Yup             | Pas de type inference TypeScript        |
| **bcrypt**          | Standard industrie, cost factor configurable                       | argon2, scrypt       | Moins répandu, setup complexe           |
| **Redis**           | Backend BullMQ, cache applicatif, rate limiting                    | In-memory, Memcached | Pas persistant, moins de features       |
| **Helmet (Shield)** | Headers de sécurité standard (CSP, HSTS, X-Frame)                  | Custom middleware    | Réinventer la roue, risque d'oubli      |
| **Limiter**         | Rate limiting natif AdonisJS, Redis backend                        | express-rate-limit   | Pas de Redis, moins configurable        |

## RBAC (Role-Based Access Control)

### Rôles et Permissions

Le système implémente un contrôle d'accès granulaire basé sur 4 rôles :

| Rôle    | Description                                            | Permissions                                                               |
| ------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Owner   | Propriétaire de l'organisation                         | Toutes les permissions, y compris gestion utilisateurs et suppression org |
| Admin   | Administrateur avec accès complet aux fournisseurs     | CRUD fournisseurs, configuration risk policies, lecture audit log         |
| Analyst | Analyste avec focus sur l'évaluation des risques       | Lecture fournisseurs, modification risk level, ajout notes                |
| Auditor | Auditeur en lecture seule avec accès complet à l'audit | Lecture seule sur tout, accès complet à l'audit trail                     |

### Permissions Disponibles

```typescript
type Permission =
  | 'supplier:create' // Créer un nouveau fournisseur
  | 'supplier:read' // Lire les fournisseurs
  | 'supplier:update' // Modifier les informations d'un fournisseur
  | 'supplier:delete' // Supprimer un fournisseur
  | 'supplier:update_risk' // Modifier le niveau de risque uniquement
  | 'supplier:add_notes' // Ajouter/modifier des notes uniquement
  | 'audit:read' // Lire l'audit trail
  | 'user:manage' // Gérer les utilisateurs (CRUD)
  | 'org:delete' // Supprimer l'organisation
  | 'risk_policy:configure' // Configurer les policies de risque
```

### Matrice des Permissions

| Permission            | Owner | Admin | Analyst | Auditor |
| --------------------- | ----- | ----- | ------- | ------- |
| supplier:create       | ✅    | ✅    | ❌      | ❌      |
| supplier:read         | ✅    | ✅    | ✅      | ✅      |
| supplier:update       | ✅    | ✅    | ❌      | ❌      |
| supplier:delete       | ✅    | ✅    | ❌      | ❌      |
| supplier:update_risk  | ✅    | ✅    | ✅      | ❌      |
| supplier:add_notes    | ✅    | ✅    | ✅      | ❌      |
| audit:read            | ✅    | ✅    | ❌      | ✅      |
| user:manage           | ✅    | ❌    | ❌      | ❌      |
| org:delete            | ✅    | ❌    | ❌      | ❌      |
| risk_policy:configure | ✅    | ✅    | ❌      | ❌      |

### Implémentation Frontend

#### Hook `usePermissions`

Le hook `usePermissions` fournit une API simple pour vérifier les permissions :

```typescript
const { can, canAll, canAny, role } = usePermissions()

// Vérifier une permission unique
if (can('supplier:create')) {
  // Afficher le bouton de création
}

// Vérifier plusieurs permissions (toutes requises)
if (canAll(['supplier:update', 'supplier:delete'])) {
  // L'utilisateur peut modifier ET supprimer
}

// Vérifier plusieurs permissions (au moins une requise)
if (canAny(['supplier:update', 'supplier:update_risk'])) {
  // L'utilisateur peut modifier OU modifier le risque
}
```

#### Utilisation dans les Composants

**Exemple 1 : Affichage conditionnel d'un bouton**

```typescript
function SuppliersPage() {
  const { can } = usePermissions()

  return (
    <div>
      {can('supplier:create') && <CreateSupplierDialog />}
    </div>
  )
}
```

**Exemple 2 : Édition granulaire de champs**

```typescript
<EditableField
  label="Risk Level"
  field="riskLevel"
  value={supplier.riskLevel}
  supplierId={supplier.id}
  type="select"
  options="riskLevel"
  requiredPermission="supplier:update_risk"  // Permission spécifique
/>
```

**Exemple 3 : Actions conditionnelles**

```typescript
function SupplierActions({ supplier }) {
  const { can } = usePermissions()
  const canDelete = can('supplier:delete')

  return (
    <div>
      <ViewButton />
      {canDelete && <DeleteButton />}
    </div>
  )
}
```

### Implémentation Backend

#### Routes Granulaires

Le backend expose des endpoints spécifiques pour les permissions granulaires :

**Routes API** :

```typescript
// Route générale (nécessite supplier:update)
PUT /api/v1/suppliers/:id
  Permissions: supplier:update (Admin, Owner)

// Routes granulaires (permissions spécifiques)
PATCH /api/v1/suppliers/:id/risk-level
  Permissions: supplier:update_risk (Analyst, Admin, Owner)

PATCH /api/v1/suppliers/:id/notes
  Permissions: supplier:add_notes (Analyst, Admin, Owner)
```

**Avantages** :

- ✅ Un Analyst peut modifier le risk level et les notes via les routes PATCH
- ✅ Un Analyst ne peut PAS modifier les autres champs (pas d'accès à PUT)
- ✅ Audit trail séparé pour chaque type de modification
- ✅ Principe du moindre privilège respecté

**Middleware RBAC** :

```typescript
// start/routes.ts
router
  .patch('/:id/risk-level', [SuppliersController, 'updateRiskLevel'])
  .use(middleware.rbac({ permission: 'supplier:update_risk' }))
  .use(middleware.audit())
```

**Frontend** :

Le composant `EditableField` détecte automatiquement le champ et utilise la bonne route

### Isolation Multi-Tenant

Chaque requête est automatiquement scopée par `organization_id` :

- Un utilisateur ne peut accéder qu'aux données de son organisation
- Vérification double : applicatif + base de données

### Règles de Sécurité

1. **Jamais de permission par défaut** : Si aucune permission n'est spécifiée, l'accès est refusé
2. **Vérification côté serveur obligatoire** : Les permissions frontend sont pour l'UX, la vraie sécurité est au backend
3. **Audit systématique** : Toute action sensible est loggée dans `audit_logs`
4. **Principe du moindre privilège** : Chaque rôle a le minimum de permissions nécessaires
5. **Routes granulaires** : Préférer des routes spécifiques (PATCH) aux routes générales (PUT) pour un contrôle fin

### Tests de Permissions

Les tests doivent vérifier :

- ✅ Un utilisateur avec permission peut effectuer l'action
- ✅ Un utilisateur sans permission ne peut PAS effectuer l'action
- ✅ Un utilisateur d'une autre organisation ne peut PAS accéder aux ressources
- ✅ Les boutons/champs sont cachés selon les permissions
- ✅ Les routes granulaires (PATCH) respectent leurs permissions spécifiques

---

## Architecture Asynchrone IA

### Choix : BullMQ (Job Queue)

**Pourquoi BullMQ plutôt que polling, SSE ou WebSocket ?**

| Approche      | Avantages                                                                     | Inconvénients                             |
| ------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| **BullMQ** ✅ | Retry automatique, dead letter queue, backoff exponentiel, découplage complet | Nécessite Redis                           |
| Polling       | Simple à implémenter                                                          | Gaspillage de requêtes, latence           |
| SSE           | Push temps réel                                                               | Connexion persistante, complexité serveur |
| WebSocket     | Bidirectionnel                                                                | Overkill pour du one-way, complexité      |

### Pipeline

```
[Backend] → création/modification supplier
    ↓
[BullMQ Queue] → job
    ↓
[AI Worker] → sanitise inputs → appel LLM (mock dans notre cas)
    ↓
[DB Update] → ai_risk_score + ai_analysis (jsonb)
```

### Gestion des erreurs

- **Retry** : backoff exponentiel (3 tentatives)
- **Dead Letter Queue** : jobs en échec permanent isolés pour investigation
- **Timeout** : limite de temps par job pour éviter les blocages
- **Mock service** : architecture identique, seul le provider LLM change

### Gestion de la latence côté Frontend

Le frontend gère 3 états pour l'analyse IA :

- **Pending** : `ai_risk_score === null` après création → affiche un spinner/badge "Analyse en cours"
- **Complete** : `ai_risk_score !== null` → affiche le score et l'analyse
- **Error** : le job a échoué → affiche "Analyse indisponible"

---

## Audit Trail

### Choix d'implémentation : Middleware AdonisJS

**Pourquoi middleware plutôt que triggers PostgreSQL ou event sourcing ?**

| Approche                   | Avantages                                                           | Inconvénients                                |
| -------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| **Middleware AdonisJS** ✅ | Accès au contexte HTTP (user, IP), testable, cohérent avec le stack | Couplage applicatif                          |
| Triggers PostgreSQL        | Indépendant de l'app                                                | Pas d'accès au user/IP, complexe à maintenir |
| Event Sourcing             | Historique complet, rejouable                                       | Complexité excessive pour ce scope           |

### Fonctionnement

1. Le middleware `audit` intercepte les requêtes de mutation (POST, PUT, PATCH, DELETE)
2. Il capture l'état **avant** modification (SELECT avant l'action)
3. Il laisse l'action s'exécuter
4. Il capture l'état **après** modification
5. Il insère un log dans `audit_logs` avec : userId, action, entityType, entityId, before, after, ipAddress

### Table append-only

- Aucun UPDATE ni DELETE autorisé sur `audit_logs`
- FK avec `ON DELETE RESTRICT` → impossible de supprimer un user ayant des logs
- Les logs persistent même après suppression de l'entité d'origine

### Accès

- Route : `GET /api/v1/suppliers/:supplierId/audit-logs`
- Permission requise : `audit:read` (Owner, Admin, Auditor)
