import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../../../core/services/cart.service';
import { CartLineComponent } from '../../components/cart-line/cart-line.component';

@Component({
  selector: 'app-cart-page',
  imports: [CartLineComponent, CurrencyPipe, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {
  protected readonly cart = inject(CartService);
}
