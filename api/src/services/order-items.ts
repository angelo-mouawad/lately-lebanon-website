import { effectiveCommissionPct, variantPrice } from "./pricing";
import { mergeLines, type StockLine } from "./stock";

export interface PurchasableVariant {
  id: number;
  label: string;
  priceCents: number | null;
  product: {
    id: number;
    name: string;
    priceCents: number;
    commissionPct: number | null;
    brandId: number;
    brand: { commissionPct: number };
  };
}

export interface OrderItemDraft {
  productId: number;
  variantId: number;
  brandId: number;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
  commissionPct: number;
  lineTotalCents: number;
}

/**
 * Turns cart lines into order items, copying the current price and commission.
 * Once saved these values are frozen: later price or commission changes never touch old orders.
 */
export function buildOrderItems(lines: StockLine[], variants: Map<number, PurchasableVariant>): OrderItemDraft[] {
  return mergeLines(lines).map(({ variantId, quantity }) => {
    const v = variants.get(variantId);
    if (!v) throw new Error(`Variant ${variantId} was not loaded`);
    const unitPriceCents = variantPrice(v.product.priceCents, v.priceCents);
    return {
      productId: v.product.id,
      variantId: v.id,
      brandId: v.product.brandId,
      productName: v.product.name,
      variantLabel: v.label,
      quantity,
      unitPriceCents,
      commissionPct: effectiveCommissionPct(v.product.commissionPct, v.product.brand.commissionPct),
      lineTotalCents: unitPriceCents * quantity,
    };
  });
}
