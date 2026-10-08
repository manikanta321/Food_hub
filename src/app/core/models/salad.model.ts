export type EntityId = string;
export type IsoDateTime = string;
export type LocalDate = string;
export type MoneyPaise = number;

export interface ProductImage {
  readonly url: string;
  readonly alt: string;
}

export interface Salad {
  readonly id: EntityId;
  readonly name: string;
  readonly description: string;
  readonly pricePaise: MoneyPaise;
  readonly image: ProductImage;
  readonly ingredients: readonly string[];
  readonly available: boolean;
}
