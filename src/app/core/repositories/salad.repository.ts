import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { EntityId, Salad } from '../models/salad.model';

export interface SaladRepository {
  listCustomerCatalog(): Observable<readonly Salad[]>;
  getById(id: EntityId): Observable<Salad | null>;
}

export const SALAD_REPOSITORY = new InjectionToken<SaladRepository>(
  'SALAD_REPOSITORY',
);
