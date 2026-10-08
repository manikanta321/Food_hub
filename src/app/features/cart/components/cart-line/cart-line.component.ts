import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartItem } from '../../../../core/models/cart.model';
import { QuantitySelectorComponent } from '../../../../shared/components/quantity-selector/quantity-selector.component';

@Component({
  selector: 'app-cart-line',
  imports: [
    CurrencyPipe,
    NgOptimizedImage,
    QuantitySelectorComponent,
    RouterLink,
  ],
  templateUrl: './cart-line.component.html',
  styleUrl: './cart-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartLineComponent {
  readonly item = input.required<CartItem>();
  readonly increase = output<void>();
  readonly decrease = output<void>();
  readonly remove = output<void>();

  protected readonly lineTotalPaise = computed(
    () => this.item().salad.pricePaise * this.item().quantity,
  );
}
