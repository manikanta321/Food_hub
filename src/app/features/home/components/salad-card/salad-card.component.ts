import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Salad } from '../../../../core/models/salad.model';

@Component({
  selector: 'app-salad-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './salad-card.component.html',
  styleUrl: './salad-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaladCardComponent {
  readonly salad = input.required<Salad>();
  readonly add = output<Salad>();

  protected readonly featuredIngredients = computed(() =>
    this.salad().ingredients.slice(0, 4),
  );

  protected readonly remainingIngredientCount = computed(() =>
    Math.max(this.salad().ingredients.length - 4, 0),
  );

  protected readonly availabilityDescriptionId = computed(
    () => `salad-availability-${this.salad().id}`,
  );

  protected addToCart(): void {
    if (this.salad().available) {
      this.add.emit(this.salad());
    }
  }
}
