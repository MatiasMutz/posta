/**
 * Smoke test de conectividad Redis para jobs BullMQ.
 * Corre con: pnpm test:integration (requiere REDIS_URL).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL;
const skip = !REDIS_URL;

describe.skipIf(skip)('BullMQ connectivity', () => {
  const queues: Queue[] = [];

  afterEach(async () => {
    await Promise.all(queues.map(async (q) => {
      await q.obliterate({ force: true });
      await q.close();
    }));
    queues.length = 0;
  });

  it('encola un job en Redis', async () => {
    const queue = new Queue(`posta-test-${Date.now()}`, {
      connection: { url: REDIS_URL! },
    });
    queues.push(queue);

    await queue.add('ping', { ts: Date.now() });
    const counts = await queue.getJobCounts('waiting', 'active', 'delayed');
    const total = counts.waiting + counts.active + counts.delayed;
    expect(total).toBeGreaterThan(0);
  });
});
