import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { itemCount: signal(0) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should provide a labelled brand link and primary navigation', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.brand')?.getAttribute('aria-label')).toBe(
      'HealthyBowl home',
    );
    expect(
      element.querySelector('nav')?.getAttribute('aria-label'),
    ).toBe('Primary navigation');
  });
});
