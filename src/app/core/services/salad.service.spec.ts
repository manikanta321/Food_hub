import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Salad } from '../models/salad.model';
import {
  SALAD_REPOSITORY,
  SaladRepository,
} from '../repositories/salad.repository';
import { SaladService } from './salad.service';

describe('SaladService', () => {
  let service: SaladService;
  let repository: jasmine.SpyObj<SaladRepository>;

  const salad: Salad = {
    id: 'salad-1',
    name: 'Salad',
    description: 'Fresh salad',
    pricePaise: 9900,
    image: { url: '/images/salad.jpg', alt: 'Fresh salad' },
    ingredients: ['Lettuce'],
    available: true,
  };

  beforeEach(() => {
    repository = jasmine.createSpyObj<SaladRepository>('SaladRepository', [
      'listCustomerCatalog',
      'getById',
    ]);
    repository.listCustomerCatalog.and.returnValue(of([salad]));
    repository.getById.and.returnValue(of(salad));

    TestBed.configureTestingModule({
      providers: [
        SaladService,
        { provide: SALAD_REPOSITORY, useValue: repository },
      ],
    });

    service = TestBed.inject(SaladService);
  });

  it('should request the customer catalog through the repository', (done) => {
    service.getCustomerCatalog().subscribe((salads) => {
      expect(salads).toEqual([salad]);
      expect(repository.listCustomerCatalog).toHaveBeenCalledOnceWith();
      done();
    });
  });

  it('should request a salad by opaque ID', (done) => {
    service.getSalad('salad-1').subscribe((result) => {
      expect(result).toEqual(salad);
      expect(repository.getById).toHaveBeenCalledOnceWith('salad-1');
      done();
    });
  });
});
