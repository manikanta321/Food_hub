import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

import { Order } from '../../../../core/models/checkout.model';
import { OrderService } from '../../../../core/services/order.service';

type ConfirmationState = 'loading' | 'loaded' | 'not-found' | 'error';
type LoadResult =
  | { readonly kind: 'success'; readonly order: Order | null }
  | { readonly kind: 'error' };

@Component({
  selector: 'app-order-confirmation',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();

  protected readonly state = signal<ConfirmationState>('loading');
  protected readonly order = signal<Order | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('orderId')?.trim() ?? ''),
        distinctUntilChanged(),
        switchMap((orderId) =>
          this.reload.pipe(
            startWith(undefined),
            tap(() => {
              this.state.set('loading');
              this.order.set(null);
            }),
            switchMap(() =>
              orderId
                ? this.orderService.getOrder(orderId).pipe(
                    map(
                      (order): LoadResult => ({
                        kind: 'success',
                        order,
                      }),
                    ),
                    catchError(() => of<LoadResult>({ kind: 'error' })),
                  )
                : of<LoadResult>({ kind: 'success', order: null }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.kind === 'error') {
          this.state.set('error');
          return;
        }

        if (result.order === null) {
          this.state.set('not-found');
          this.title.setTitle('Order Not Found · HealthyBowl');
          return;
        }

        this.order.set(result.order);
        this.state.set('loaded');
        this.title.setTitle(`Order ${result.order.id} · HealthyBowl`);
      });
  }

  protected tryAgain(): void {
    this.reload.next();
  }
}
