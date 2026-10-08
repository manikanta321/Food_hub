import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import {
  Apartment,
  CheckoutDetails,
  DeliverySlot,
  PaymentMethod,
} from '../../../../core/models/checkout.model';
import {
  ApartmentService,
  currentBusinessDate,
} from '../../../../core/services/apartment.service';
import { CartService } from '../../../../core/services/cart.service';
import { CheckoutService } from '../../../../core/services/checkout.service';

type LoadState = 'loading' | 'loaded' | 'empty' | 'error';
type SlotLoadResult =
  | { readonly kind: 'success'; readonly slots: readonly DeliverySlot[] }
  | { readonly kind: 'error' };

@Component({
  selector: 'app-checkout-page',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly apartmentService = inject(ApartmentService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly slotRequests = new Subject<string>();
  private readonly errorSummary =
    viewChild<ElementRef<HTMLElement>>('errorSummary');

  protected readonly cart = inject(CartService);
  protected readonly businessDate = currentBusinessDate();
  protected readonly apartments = signal<readonly Apartment[]>([]);
  protected readonly selectedApartment = signal<Apartment | null>(null);
  protected readonly slots = signal<readonly DeliverySlot[]>([]);
  protected readonly apartmentState = signal<LoadState>('loading');
  protected readonly slotState = signal<LoadState>('empty');
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submissionError = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    apartmentId: ['', Validators.required],
    block: ['', Validators.required],
    flatNumber: [
      '',
      [
        Validators.required,
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9 /_-]{0,19}$/),
      ],
    ],
    deliverySlotId: ['', Validators.required],
    paymentMethod: this.formBuilder.control<PaymentMethod | ''>('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  constructor() {
    this.form.controls.apartmentId.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((apartmentId) => this.changeApartment(apartmentId));

    this.slotRequests
      .pipe(
        tap(() => {
          this.slotState.set('loading');
          this.slots.set([]);
        }),
        switchMap((apartmentId) =>
          this.apartmentService
            .getDeliverySlots(apartmentId, this.businessDate)
            .pipe(
              map(
                (slots): SlotLoadResult => ({
                  kind: 'success',
                  slots: slots.filter((slot) => slot.available),
                }),
              ),
              catchError(() => of<SlotLoadResult>({ kind: 'error' })),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.kind === 'error') {
          this.slotState.set('error');
          return;
        }

        this.slots.set(result.slots);
        this.slotState.set(result.slots.length > 0 ? 'loaded' : 'empty');
      });

    this.loadApartments();
  }

  protected loadApartments(): void {
    this.apartmentState.set('loading');

    this.apartmentService
      .getActiveApartments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (apartments) => {
          this.apartments.set(apartments);
          if (apartments.length === 0) {
            this.apartmentState.set('empty');
            return;
          }

          this.apartmentState.set('loaded');
          const savedId = this.apartmentService.selectedApartmentId();
          const initial =
            apartments.find((apartment) => apartment.id === savedId) ??
            apartments[0];
          this.form.controls.apartmentId.setValue(initial.id);
        },
        error: () => this.apartmentState.set('error'),
      });
  }

  protected retrySlots(): void {
    const apartmentId = this.form.controls.apartmentId.value;
    if (apartmentId) {
      this.slotRequests.next(apartmentId);
    }
  }

  protected placeOrder(): void {
    if (this.submitting()) {
      return;
    }

    this.submitted.set(true);
    this.submissionError.set(false);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    const details: CheckoutDetails = {
      apartmentId: value.apartmentId,
      block: value.block,
      flatNumber: value.flatNumber.trim(),
      deliverySlotId: value.deliverySlotId,
      paymentMethod: value.paymentMethod as PaymentMethod,
    };

    this.submitting.set(true);
    this.checkoutService
      .placeOrder(details)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          void this.router.navigate([
            '/checkout',
            'confirmation',
            order.id,
          ]);
        },
        error: () => {
          this.submitting.set(false);
          this.submissionError.set(true);
        },
      });
  }

  private changeApartment(apartmentId: string): void {
    const apartment =
      this.apartments().find((candidate) => candidate.id === apartmentId) ??
      null;
    this.selectedApartment.set(apartment);
    this.form.controls.block.reset('');
    this.form.controls.deliverySlotId.reset('');
    this.slots.set([]);

    if (apartment) {
      this.apartmentService.selectApartment(apartment.id);
      this.slotRequests.next(apartment.id);
    } else {
      this.slotState.set('empty');
    }
  }
}
