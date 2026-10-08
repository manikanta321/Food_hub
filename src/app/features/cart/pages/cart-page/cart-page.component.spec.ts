import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Salad } from '../../../../core/models/salad.model';
import { CartService } from '../../../../core/services/cart.service';
import { SaladService } from '../../../../core/services/salad.service';
import { CartStorage, CART_STORAGE } from '../../../../core/storage/cart-storage';
import { CartPageComponent } from './cart-page.component';

describe('CartPageComponent', () => {
  const salad: Salad = {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description: 'A fresh test salad.',
    pricePaise: 14900,
    image: {
      url: '/images/protein-power-salad.jpg',
      alt: 'Protein Power Salad',
    },
    ingredients: ['Paneer', 'Lettuce'],
    available: true,
  };

  let fixture: ComponentFixture<CartPageComponent>;
  let cart: CartService;

  beforeEach(async () => {
    const storage = jasmine.createSpyObj<CartStorage>('CartStorage', [
      'read',
      'write',
      'clear',
    ]);
    storage.read.and.returnValue({ kind: 'success', cart: null });
    storage.write.and.returnValue(true);
    storage.clear.and.returnValue(true);

    const saladService = jasmine.createSpyObj<SaladService>('SaladService', [
      'getCustomerCatalog',
    ]);
    saladService.getCustomerCatalog.and.returnValue(of([salad]));

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        provideRouter([]),
        CartService,
        { provide: SaladService, useValue: saladService },
        { provide: CART_STORAGE, useValue: storage },
      ],
    }).compileComponents();

    cart = TestBed.inject(CartService);
    fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
  });

  it('should render a useful empty state', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Your Cart');
    expect(element.textContent).toContain('Your cart is empty');
    expect(element.querySelector('.empty-cart a')?.getAttribute('href')).toBe(
      '/home#todays-salads',
    );
  });

  it('should render lines and consistent price totals', () => {
    cart.addItem(salad, 2);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('app-cart-line').length).toBe(1);
    expect(element.textContent).toContain('2 items');
    expect(element.querySelector('.price-summary')?.textContent).toContain(
      '₹298',
    );
    expect(
      element.querySelector('.price-summary__checkout')?.getAttribute('href'),
    ).toBe('/checkout');
  });

  it('should remove the final line and return to empty state', () => {
    cart.addItem(salad);
    fixture.detectChanges();

    const remove = (fixture.nativeElement as HTMLElement).querySelector(
      '.cart-line__remove',
    ) as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Your cart is empty',
    );
  });
});
