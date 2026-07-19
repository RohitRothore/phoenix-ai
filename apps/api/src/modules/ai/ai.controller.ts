import { Controller } from '@nestjs/common';

// AI-level endpoints are handled at the project level via /projects/:slug routes.
// This controller is reserved for future AI utility or diagnostics endpoints.
@Controller('ai')
export class AiController {}
