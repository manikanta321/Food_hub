import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { Salad } from '../../../../core/models/salad.model';
import { CartService } from '../../../../core/services/cart.service';
import { SaladService } from '../../../../core/services/salad.service';
import { QuantitySelectorComponent } from '../../../../shared/components/quantity-selector/quantity-selector.component';

type DetailsState = 'loading' | 'loaded' | 'not-found' | 'error';
type LoadResult =
  | { readonly kind: 'success'; readonly salad: Salad | null }
  | { readonly kind: 'error' };

@Component({
  selector: 'app-salad-details',
  imports: [CurrencyPipe, NgOptimizedImage, QuantitySelectorComponent, RouterLink],
  templateUrl: './salad-details.component.html',
  styleUrl: './salad-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaladDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly saladService = inject(SaladService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();

  protected readonly detailsState = signal<DetailsState>('loading');
  protected readonly salad = signal<Salad | null>(null);
  protected readonly quantity = signal(1);
  protected readonly maximumQuantity = 20;

  protected readonly selectedTotalPaise = computed(
    () => (this.salad()?.pricePaise ?? 0) * this.quantity(),
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('saladId')?.trim() ?? ''),
        distinctUntilChanged(),
        switchMap((saladId) =>
          this.reload.pipe(
            startWith(undefined),
            tap(() => {
              this.detailsState.set('loading');
              this.salad.set(null);
            }),
            switchMap(() =>
              saladId
                ? this.saladService.getSalad(saladId).pipe(
                    map(
                      (salad): LoadResult => ({
                        kind: 'success',
                        salad,
                      }),
                    ),
                    catchError(() => of<LoadResult>({ kind: 'error' })),
                  )
                : of<LoadResult>({ kind: 'success', salad: null }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.kind === 'error') {
          this.detailsState.set('error');
          return;
        }

        if (result.salad === null) {
          this.detailsState.set('not-found');
          this.title.setTitle('Salad Not Found · HealthyBowl');
          return;
        }

        this.salad.set(result.salad);
        this.quantity.set(1);
        this.detailsState.set('loaded');
        this.title.setTitle(`${result.salad.name} · HealthyBowl`);
      });
  }

  protected tryAgain(): void {
    this.reload.next();
  }

  protected decreaseQuantity(): void {
    this.quantity.update((quantity) => Math.max(1, quantity - 1));
  }

  protected increaseQuantity(): void {
    this.quantity.update((quantity) =>
      Math.min(this.maximumQuantity, quantity + 1),
    );
  }

  protected addToCart(salad: Salad): void {
    if (this.cart.addItem(salad, this.quantity())) {
      void this.router.navigateByUrl('/cart');
    }
  }
}
