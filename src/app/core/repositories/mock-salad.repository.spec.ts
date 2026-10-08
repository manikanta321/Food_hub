import { fakeAsync, tick } from '@angular/core/testing';

import { Salad } from '../models/salad.model';
import { MockSaladRepository } from './mock-salad.repository';

describe('MockSaladRepository', () => {
  const repository = new MockSaladRepository();

  it('should asynchronously return the two initial salads', fakeAsync(() => {
    let result: readonly Salad[] = [];

    repository.listCustomerCatalog().subscribe((salads) => {
      result = salads;
    });

    expect(result).toEqual([]);
    tick(300);
    expect(result.map((salad) => salad.id)).toEqual([
      'protein-power-salad',
      'fresh-veggie-bowl',
    ]);
  }));

  it('should return null for an unknown salad ID', fakeAsync(() => {
    let found = true;

    repository.getById('unknown').subscribe((salad) => {
      found = salad !== null;
    });

    tick(300);
    expect(found).toBeFalse();
  }));
});
