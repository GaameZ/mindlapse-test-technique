import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { loginThrottle } from '#start/limiter'

const AuthController = () => import('#controllers/auth_controller')
const SuppliersController = () => import('#controllers/suppliers_controller')
const UsersController = () => import('#controllers/users_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')

router
  .group(() => {
    router
      .group(() => {
        router.post('/login', [AuthController, 'login']).use(loginThrottle)
        router.post('/refresh', [AuthController, 'refresh'])
      })
      .prefix('/auth')

    router
      .group(() => {
        router.get('/auth/me', [AuthController, 'me'])
      })
      .use(middleware.jwtAuth())

    router
      .group(() => {
        router
          .get('/', [SuppliersController, 'index'])
          .use(middleware.rbac({ permission: 'supplier:read' }))

        router
          .get('/:id', [SuppliersController, 'show'])
          .use(middleware.rbac({ permission: 'supplier:read' }))

        router
          .post('/', [SuppliersController, 'store'])
          .use(middleware.rbac({ permission: 'supplier:create' }))
          .use(middleware.audit())

        router
          .put('/:id', [SuppliersController, 'update'])
          .use(middleware.rbac({ permission: 'supplier:update' }))
          .use(middleware.audit())

        router
          .patch('/:id/risk-level', [SuppliersController, 'updateRiskLevel'])
          .use(middleware.rbac({ permission: 'supplier:update_risk' }))
          .use(middleware.audit())

        router
          .patch('/:id/notes', [SuppliersController, 'updateNotes'])
          .use(middleware.rbac({ permission: 'supplier:add_notes' }))
          .use(middleware.audit())

        router
          .delete('/:id', [SuppliersController, 'destroy'])
          .use(middleware.rbac({ permission: 'supplier:delete' }))
          .use(middleware.audit())

        router
          .get('/:supplierId/audit-logs', [SuppliersController, 'auditLogs'])
          .use(middleware.rbac({ permission: 'audit:read' }))
      })
      .prefix('/suppliers')
      .use(middleware.jwtAuth())

    router
      .group(() => {
        router.get('/', [UsersController, 'index'])
        router.get('/:id', [UsersController, 'show'])
        router.post('/', [UsersController, 'store'])
        router.put('/:id', [UsersController, 'update'])
        router.delete('/:id', [UsersController, 'destroy'])
      })
      .prefix('/users')
      .use(middleware.jwtAuth())
      .use(middleware.rbac({ permission: 'user:manage' }))

    router
      .group(() => {
        router
          .delete('/current', [OrganizationsController, 'destroyCurrent'])
          .use(middleware.rbac({ permission: 'org:delete' }))
      })
      .prefix('/organizations')
      .use(middleware.jwtAuth())
  })
  .prefix('/api/v1')
