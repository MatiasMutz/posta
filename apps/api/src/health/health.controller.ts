import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
@SkipThrottle()
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'posta-api' };
  }
}
