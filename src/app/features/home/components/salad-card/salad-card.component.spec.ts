import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Salad } from '../../../../core/models/salad.model';
import { SaladCardComponent } from './salad-card.component';

describe('SaladCardComponent', () => {
  let fixture: ComponentFixture<SaladCardComponent>;

  const salad: Salad = {
    id: 'test-salad',
    name: 'Test Salad',
    description: 'A fresh test salad.',
    pricePaise: 14900,
    image: {
      url: '/images/protein-power-salad.jpg',
      alt: 'A test salad',
    },
    ingredients: ['Paneer', 'Lettuce', 'Cucumber', 'Carrot', 'Sweet corn'],
    available: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaladCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SaladCardComponent);
    fixture.componentRef.setInput('salad', salad);
    fixture.detectChanges();
  });

  it('should render typed salad data and formatted price', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h3')?.textContent).toContain('Test Salad');
    expect(element.querySelector('.salad-card__price')?.textContent).toContain(
      '₹149',
    );
    expect(element.querySelector('img')?.getAttribute('alt')).toBe(
      'A test salad',
    );
  });

  it('should provide a product-specific Add control', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.disabled).toBeFalse();
    expect(button.getAttribute('aria-label')).toBe('Add Test Salad to cart');
  });

  it('should emit the salad when Add is activated', () => {
    const add = jasmine.createSpy('add');
    fixture.componentInstance.add.subscribe(add);

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();

    expect(add).toHaveBeenCalledOnceWith(salad);
  });

  it('should link to the product details route', () => {
    const detailsLink = (fixture.nativeElement as HTMLElement).querySelector(
      '.salad-card__details-link',
    ) as HTMLAnchorElement;

    expect(detailsLink.getAttribute('href')).toBe('/salads/test-salad');
  });

  it('should communicate unavailable status with text', () => {
    fixture.componentRef.setInput('salad', { ...salad, available: false });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Unavailable today',
    );
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });
});
