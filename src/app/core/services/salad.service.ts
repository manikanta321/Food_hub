import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EntityId, Salad } from '../models/salad.model';
import { SALAD_REPOSITORY } from '../repositories/salad.repository';

@Injectable()
export class SaladService {
  private readonly repository = inject(SALAD_REPOSITORY);

  getCustomerCatalog(): Observable<readonly Salad[]> {
    return this.repository.listCustomerCatalog();
  }

  getSalad(id: EntityId): Observable<Salad | null> {
    return this.repository.getById(id);
  }
}
