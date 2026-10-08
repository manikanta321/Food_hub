import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantitySelectorComponent } from './quantity-selector.component';

describe('QuantitySelectorComponent', () => {
  let fixture: ComponentFixture<QuantitySelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuantitySelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuantitySelectorComponent);
    fixture.componentRef.setInput('productName', 'Protein Power Salad');
    fixture.componentRef.setInput('quantity', 1);
    fixture.detectChanges();
  });

  it('should disable decrease at the lower boundary', () => {
    const buttons = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('button');

    expect((buttons[0] as HTMLButtonElement).disabled).toBeTrue();
    expect((buttons[1] as HTMLButtonElement).disabled).toBeFalse();
  });

  it('should emit increase when Plus is activated', () => {
    const increase = jasmine.createSpy('increase');
    fixture.componentInstance.increase.subscribe(increase);

    const buttons = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();

    expect(increase).toHaveBeenCalledTimes(1);
  });

  it('should disable increase at the upper boundary', () => {
    fixture.componentRef.setInput('quantity', 20);
    fixture.detectChanges();

    const buttons = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('button');

    expect((buttons[1] as HTMLButtonElement).disabled).toBeTrue();
  });
});
