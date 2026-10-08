import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { MOCK_SALADS } from '../../../../core/repositories/mock-salad.repository';
import {
  SALAD_REPOSITORY,
  SaladRepository,
} from '../../../../core/repositories/salad.repository';
import { SaladService } from '../../../../core/services/salad.service';
import { CartService } from '../../../../core/services/cart.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let catalog$: Subject<typeof MOCK_SALADS>;
  let repository: jasmine.SpyObj<SaladRepository>;
  let cart: { addItem: jasmine.Spy; announcement: ReturnType<typeof signal<string>> };

  beforeEach(async () => {
    catalog$ = new Subject<typeof MOCK_SALADS>();
    repository = jasmine.createSpyObj<SaladRepository>('SaladRepository', [
      'listCustomerCatalog',
      'getById',
    ]);
    repository.listCustomerCatalog.and.returnValue(catalog$);
    repository.getById.and.returnValue(of(null));
    cart = {
      addItem: jasmine.createSpy('addItem').and.returnValue(true),
      announcement: signal(''),
    };

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        SaladService,
        { provide: SALAD_REPOSITORY, useValue: repository },
        { provide: CartService, useValue: cart },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render one page heading with the product promise', () => {
    const headings = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('Fresh & Healthy');
  });

  it('should show a loading state while the catalog is pending', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="status"]')).not.toBeNull();
    expect(element.textContent).toContain("Loading today's salads");
  });

  it('should render repository-provided salads', () => {
    catalog$.next(MOCK_SALADS);
    catalog$.complete();
    fixture.detectChanges();

    const cards = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('app-salad-card');

    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Protein Power Salad');
    expect(cards[1].textContent).toContain('Fresh Veggie Bowl');
  });

  it('should add a salad from its catalog card', () => {
    catalog$.next(MOCK_SALADS);
    fixture.detectChanges();

    const addButton = (fixture.nativeElement as HTMLElement).querySelector(
      'app-salad-card button',
    ) as HTMLButtonElement;
    addButton.click();

    expect(cart.addItem).toHaveBeenCalledOnceWith(MOCK_SALADS[0]);
  });

  it('should render the empty catalog state', () => {
    catalog$.next([]);
    catalog$.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No salads available today.',
    );
  });

  it('should retry after a catalog error', () => {
    catalog$.error(new Error('catalog failed'));
    fixture.detectChanges();

    const retryCatalog$ = new Subject<typeof MOCK_SALADS>();
    repository.listCustomerCatalog.and.returnValue(retryCatalog$);

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.catalog-message button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(repository.listCustomerCatalog).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "Loading today's salads",
    );
  });
});
