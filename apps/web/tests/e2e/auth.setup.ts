import { test as setup } from '@playwright/test';
import { prepareE2EAuthStates } from './global-setup';

setup('preparar estados de auth multi-rol', async () => {
  await prepareE2EAuthStates();
});
