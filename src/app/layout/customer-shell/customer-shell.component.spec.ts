import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { CustomerShellComponent } from './customer-shell.component';

describe('CustomerShellComponent', () => {
  let component: CustomerShellComponent;
  let fixture: ComponentFixture<CustomerShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerShellComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { itemCount: signal(0) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should provide a skip link and focusable main region', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe(
      '#main-content',
    );
    expect(element.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });
});
