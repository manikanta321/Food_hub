import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Salad } from '../../../../core/models/salad.model';
import { CartService } from '../../../../core/services/cart.service';
import { SaladService } from '../../../../core/services/salad.service';
import { SaladCardComponent } from '../../components/salad-card/salad-card.component';

type CatalogState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-home-page',
  imports: [NgOptimizedImage, SaladCardComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly saladService = inject(SaladService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cart = inject(CartService);

  protected readonly catalogState = signal<CatalogState>('loading');
  protected readonly salads = signal<readonly Salad[]>([]);

  constructor() {
    this.loadCatalog();
  }

  protected loadCatalog(): void {
    this.catalogState.set('loading');

    this.saladService
      .getCustomerCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (salads) => {
          this.salads.set(salads);
          this.catalogState.set('loaded');
        },
        error: () => {
          this.salads.set([]);
          this.catalogState.set('error');
        },
      });
  }

  protected addToCart(salad: Salad): void {
    this.cart.addItem(salad);
  }
}
