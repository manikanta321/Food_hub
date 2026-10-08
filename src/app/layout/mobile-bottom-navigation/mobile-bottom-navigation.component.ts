import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-mobile-bottom-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './mobile-bottom-navigation.component.html',
  styleUrl: './mobile-bottom-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBottomNavigationComponent {
  protected readonly cart = inject(CartService);
}
