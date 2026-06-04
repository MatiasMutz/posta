---
name: add-endpoint
description: Agrega endpoints REST en NestJS siguiendo convenciones Posta (Zod en @posta/validation, JwtGuard/RolesGuard, withTenant, respuestaPaginada, OpenAPI, tests). Usar al crear o modificar controllers, services o schemas de API REST.
---

# Add Endpoint

Convención para endpoints en `apps/api`. Seguir en orden; composar con skills `rls-policy`, `money`, `paginacion` cuando aplique.

## Estructura por módulo

```
apps/api/src/modules/<modulo>/
├── CLAUDE.md
├── <modulo>.module.ts
├── <modulo>.controller.ts
├── <modulo>.service.ts
├── <modulo>.controller.spec.ts
├── <modulo>.service.spec.ts
└── *.isolation.spec.ts          # si hay tabla nueva con RLS
```

Schemas Zod en `packages/validation/src/` — reutilizables en front (React Hook Form). Referencia: `productos.controller.ts`.

## Checklist

- [ ] Schema Zod en `@posta/validation` (+ `pnpm build:packages` si cambió)
- [ ] `@Controller('recurso')` plural, bajo `/api/v1` (global prefix)
- [ ] `@UseGuards(JwtGuard, RolesGuard)` + `@Roles(...)` en **cada** handler (sin decorador = cualquier autenticado; evitar omisiones)
- [ ] `ZodValidationPipe` en body/query
- [ ] `tenantId` de `@CurrentUser()` — **nunca** del body o params
- [ ] Service: queries con `withTenant(tenantId, ...)` — no reimplementar `set_config`
- [ ] GET colección: `respuestaPaginada()` (skill `paginacion`)
- [ ] Errores con mensajes claros en español; validación Zod → `{ mensaje, errores: [{ campo, motivo }] }`
- [ ] OpenAPI: `@ApiTags`, `@ApiBearerAuth`; errores con `apps/api/src/common/swagger/error-responses.ts` (`campo`/`motivo`)
- [ ] Tests unit service + controller spec mínimo
- [ ] Si tabla nueva: migración RLS + `*.isolation.spec.ts`

## Controller (patrón)

```typescript
@Controller('inventario/productos')
@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
export class ProductosController {
  @Get()
  @Roles('dueno', 'vendedor', 'contador')
  async findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListProductosQuerySchema)) query: ListProductosQuery,
  ) {
    const { items, total } = await this.service.findAll(user.tenantId, query, user.rol);
    return respuestaPaginada(items, query.pagina, query.limite, total);
  }

  @Post()
  @Roles('dueno')
  async create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateProductoSchema)) dto: CreateProductoDto,
  ) {
    const data = await this.service.create(user.tenantId, user.userId, dto);
    return { data };
  }
}
```

## Service (patrón)

```typescript
async create(tenantId: string, userId: string, dto: CreateProductoDto) {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx.insert(productos).values({ tenant_id: tenantId, ...dto }).returning();
    return row;
  });
}
```

## Roles

Validar en **backend** qué campos devuelve cada rol (ej. vendedor sin `costo`/`ganancia`). No confiar solo en la UI.
