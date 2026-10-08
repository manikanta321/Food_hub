import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeaderComponent } from '../app-header/app-header.component';
import { MobileBottomNavigationComponent } from '../mobile-bottom-navigation/mobile-bottom-navigation.component';

@Component({
  selector: 'app-customer-shell',
  imports: [AppHeaderComponent, MobileBottomNavigationComponent, RouterOutlet],
  templateUrl: './customer-shell.component.html',
  styleUrl: './customer-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerShellComponent {
  private readonly mainContent =
    viewChild.required<ElementRef<HTMLElement>>('mainContent');

  protected focusMainContent(): void {
    this.mainContent().nativeElement.focus({ preventScroll: true });
  }
}
