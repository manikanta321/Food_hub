import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { Salad } from '../models/salad.model';
import { SaladRepository } from './salad.repository';

export const MOCK_SALADS: readonly Salad[] = [
  {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description:
      'A satisfying paneer salad packed with crisp vegetables and a light, flavourful dressing.',
    pricePaise: 14900,
    image: {
      url: '/images/protein-power-salad.jpg',
      alt: 'Protein Power Salad with paneer, lettuce, cucumber, carrot and sweet corn',
    },
    ingredients: [
      'Paneer',
      'Lettuce',
      'Cucumber',
      'Carrot',
      'Sweet corn',
      'Healthy dressing',
    ],
    available: true,
  },
  {
    id: 'fresh-veggie-bowl',
    name: 'Fresh Veggie Bowl',
    description:
      'A bright, crunchy mix of garden vegetables finished with our healthy house dressing.',
    pricePaise: 9900,
    image: {
      url: '/images/fresh-veggie-bowl.jpg',
      alt: 'Fresh Veggie Bowl with lettuce, cucumber, carrot and sweet corn',
    },
    ingredients: [
      'Lettuce',
      'Cucumber',
      'Carrot',
      'Sweet corn',
      'Healthy dressing',
    ],
    available: true,
  },
] as const;

@Injectable()
export class MockSaladRepository implements SaladRepository {
  private readonly responseDelayMs = 300;

  listCustomerCatalog(): Observable<readonly Salad[]> {
    return of(MOCK_SALADS).pipe(delay(this.responseDelayMs));
  }

  getById(id: string): Observable<Salad | null> {
    const salad = MOCK_SALADS.find((item) => item.id === id) ?? null;

    return of(salad).pipe(delay(this.responseDelayMs));
  }
}
