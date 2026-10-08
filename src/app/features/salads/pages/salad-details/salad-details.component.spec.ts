import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { of, Subject } from 'rxjs';

import { Salad } from '../../../../core/models/salad.model';
import {
  SALAD_REPOSITORY,
  SaladRepository,
} from '../../../../core/repositories/salad.repository';
import { CartService } from '../../../../core/services/cart.service';
import { SaladService } from '../../../../core/services/salad.service';
import { SaladDetailsComponent } from './salad-details.component';

describe('SaladDetailsComponent', () => {
  let fixture: ComponentFixture<SaladDetailsComponent>;
  let salad$: Subject<Salad | null>;
  let repository: jasmine.SpyObj<SaladRepository>;
  let cart: jasmine.SpyObj<CartService>;

  const salad: Salad = {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description: 'A satisfying fresh paneer salad.',
    pricePaise: 14900,
    image: {
      url: '/images/protein-power-salad.jpg',
      alt: 'Protein Power Salad',
    },
    ingredients: ['Paneer', 'Lettuce', 'Cucumber', 'Carrot', 'Sweet corn'],
    available: true,
  };

  beforeEach(async () => {
    salad$ = new Subject<Salad | null>();
    repository = jasmine.createSpyObj<SaladRepository>('SaladRepository', [
      'listCustomerCatalog',
      'getById',
    ]);
    repository.listCustomerCatalog.and.returnValue(of([]));
    repository.getById.and.returnValue(salad$);
    cart = jasmine.createSpyObj<CartService>('CartService', ['addItem']);
    cart.addItem.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [SaladDetailsComponent],
      providers: [
        provideRouter([]),
        SaladService,
        { provide: SALAD_REPOSITORY, useValue: repository },
        { provide: CartService, useValue: cart },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({ saladId: 'protein-power-salad' }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaladDetailsComponent);
    fixture.detectChanges();
  });

  it('should request the opaque salad route ID and show loading', () => {
    expect(repository.getById).toHaveBeenCalledOnceWith(
      'protein-power-salad',
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]'),
    ).not.toBeNull();
  });

  it('should render repository data and update the document title', () => {
    salad$.next(salad);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain(
      'Protein Power Salad',
    );
    expect(element.textContent).toContain('Sweet corn');
    expect(TestBed.inject(Title).getTitle()).toBe(
      'Protein Power Salad · HealthyBowl',
    );
  });

  it('should update quantity and selected total', () => {
    salad$.next(salad);
    fixture.detectChanges();

    const plus = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Increase quantity"]',
    ) as HTMLButtonElement;
    plus.click();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('output')
        ?.textContent,
    ).toContain('2');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.order-choice__summary strong',
      )?.textContent,
    ).toContain('₹298');
  });

  it('should add the selected quantity to the cart', () => {
    const navigate = spyOn(
      TestBed.inject(Router),
      'navigateByUrl',
    ).and.resolveTo(true);
    salad$.next(salad);
    fixture.detectChanges();

    const plus = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Increase quantity"]',
    ) as HTMLButtonElement;
    plus.click();
    fixture.detectChanges();

    const add = (fixture.nativeElement as HTMLElement).querySelector(
      '.add-button',
    ) as HTMLButtonElement;
    add.click();

    expect(cart.addItem).toHaveBeenCalledOnceWith(salad, 2);
    expect(navigate).toHaveBeenCalledOnceWith('/cart');
  });

  it('should render a product-specific not-found state', () => {
    salad$.next(null);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Salad not found',
    );
  });

  it('should disable quantity and cart controls when unavailable', () => {
    salad$.next({ ...salad, available: false });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const quantityButtons = element.querySelectorAll(
      'app-quantity-selector button',
    );
    const addButton = element.querySelector('.add-button') as HTMLButtonElement;

    expect((quantityButtons[0] as HTMLButtonElement).disabled).toBeTrue();
    expect((quantityButtons[1] as HTMLButtonElement).disabled).toBeTrue();
    expect(addButton.disabled).toBeTrue();
    expect(element.textContent).toContain('Unavailable today');
  });

  it('should retry the current salad after an error', () => {
    salad$.error(new Error('failed'));
    fixture.detectChanges();

    const retry$ = new Subject<Salad | null>();
    repository.getById.and.returnValue(retry$);

    const retryButton = (fixture.nativeElement as HTMLElement).querySelector(
      '.details-message button',
    ) as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(repository.getById).toHaveBeenCalledTimes(2);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]'),
    ).not.toBeNull();
  });
});
