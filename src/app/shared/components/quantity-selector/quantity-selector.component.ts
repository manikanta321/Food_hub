import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-quantity-selector',
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantitySelectorComponent {
  readonly productName = input.required<string>();
  readonly quantity = input.required<number>();
  readonly min = input(1);
  readonly max = input(20);
  readonly disabled = input(false);

  readonly decrease = output<void>();
  readonly increase = output<void>();
}
