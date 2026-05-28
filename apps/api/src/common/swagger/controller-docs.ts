import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiErrorBadRequest,
  ApiErrorForbidden,
  ApiErrorNotFound,
  ApiErrorUnauthorized,
} from './error-responses';

/** Decoradores estándar para un controller autenticado. */
export function ApiAuthController(tag: string) {
  return applyDecorators(ApiTags(tag), ApiBearerAuth());
}

/** GET autenticado con errores comunes. */
export function ApiGetAuth(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiErrorUnauthorized(),
    ApiErrorForbidden(),
  );
}

/** POST autenticado con errores comunes. */
export function ApiPostAuth(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiErrorUnauthorized(),
    ApiErrorForbidden(),
    ApiErrorBadRequest(),
  );
}

/** PATCH autenticado. */
export function ApiPatchAuth(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiErrorUnauthorized(),
    ApiErrorForbidden(),
    ApiErrorBadRequest(),
    ApiErrorNotFound(),
  );
}

/** DELETE autenticado. */
export function ApiDeleteAuth(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiErrorUnauthorized(),
    ApiErrorForbidden(),
    ApiErrorNotFound(),
  );
}

/** Endpoint público (auth). */
export function ApiPublicPost(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiErrorBadRequest(),
  );
}
