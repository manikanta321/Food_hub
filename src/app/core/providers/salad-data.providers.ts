import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { MockSaladRepository } from '../repositories/mock-salad.repository';
import { SALAD_REPOSITORY } from '../repositories/salad.repository';
import { SaladService } from '../services/salad.service';

export function provideSaladData(): EnvironmentProviders {
  return makeEnvironmentProviders([
    SaladService,
    {
      provide: SALAD_REPOSITORY,
      useClass: MockSaladRepository,
    },
  ]);
}
