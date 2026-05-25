import { Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { db } from '../../db';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: 'SUPABASE_ADMIN',
      useFactory: () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridos');
        return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
      },
    },
    {
      provide: AuthService,
      useFactory: (supabaseAdmin: ReturnType<typeof createClient>) =>
        new AuthService(supabaseAdmin, db),
      inject: ['SUPABASE_ADMIN'],
    },
  ],
  exports: ['SUPABASE_ADMIN'],
})
export class AuthModule {}
