import { describe, it, expect } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('devuelve status ok', () => {
    const ctrl = new HealthController();
    expect(ctrl.check()).toEqual({ status: 'ok', service: 'posta-api' });
  });
});
