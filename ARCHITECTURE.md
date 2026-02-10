# Architecture

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

### Isolation Multi-Tenant

Chaque requête est automatiquement scopée par `organization_id` :

- Un utilisateur ne peut accéder qu'aux données de son organisation
- Vérification double : applicatif + base de données
- Fonction `canAccessResource(userOrgId, resourceOrgId)` pour validation

**Backend (middleware)** :

```typescript
// Vérification systématique de l'appartenance à l'organisation
if (!canAccessResource(user.organizationId, resource.organizationId)) {
  throw new ForbiddenException()
}
```

### Règles de Sécurité

1. **Jamais de permission par défaut** : Si aucune permission n'est spécifiée, l'accès est refusé
2. **Vérification côté serveur obligatoire** : Les permissions frontend sont pour l'UX, la vraie sécurité est au backend
3. **Audit systématique** : Toute action sensible est loggée dans `audit_logs`
4. **Principe du moindre privilège** : Chaque rôle a le minimum de permissions nécessaires

### Tests de Permissions

Les tests doivent vérifier :

- ✅ Un utilisateur avec permission peut effectuer l'action
- ✅ Un utilisateur sans permission ne peut PAS effectuer l'action
- ✅ Un utilisateur d'une autre organisation ne peut PAS accéder aux ressources
- ✅ Les boutons/champs sont cachés selon les permissions

---

## Architecture Asynchrone IA

(À documenter : pipeline BullMQ, worker AI, gestion de la latence)

## Audit Trail

(À documenter : append-only logs, before/after state, IP tracking)
