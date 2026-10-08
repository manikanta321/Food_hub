import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { MobileBottomNavigationComponent } from './mobile-bottom-navigation.component';

describe('MobileBottomNavigationComponent', () => {
  let component: MobileBottomNavigationComponent;
  let fixture: ComponentFixture<MobileBottomNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileBottomNavigationComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { itemCount: signal(0) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileBottomNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the implemented Home and Cart destinations', () => {
    const links = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('a');

    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Home');
    expect(links[1].textContent).toContain('Cart');
  });
});
