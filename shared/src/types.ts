import type {
  AdminRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  PromoType,
} from "./enums";

/** An uploaded image in its three WebP sizes. */
export interface ImageSet {
  key: string;
  sm: string;
  md: string;
  lg: string;
  width: number;
  height: number;
  alt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

/* ---------- Public (storefront) ---------- */

export interface PublicBrandCard {
  id: number;
  name: string;
  slug: string;
  logo: ImageSet | null;
  cover: ImageSet | null;
  story: string;
  productCount: number;
}

export interface PublicBrand extends PublicBrandCard {
  instagramUrl: string | null;
}

export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  image: ImageSet | null;
  parentId: number | null;
  productCount: number;
  children: PublicCategory[];
}

export interface PublicProductCard {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  /** True when variants have different prices, so the card shows "From $x". */
  priceVaries: boolean;
  inStock: boolean;
  image: ImageSet | null;
  hoverImage: ImageSet | null;
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  createdAt: string;
}

export interface PublicVariant {
  id: number;
  label: string;
  options: Record<string, string>;
  priceCents: number;
  stock: number;
}

export interface PublicProduct extends Omit<PublicProductCard, "image" | "hoverImage"> {
  description: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  options: { name: string; values: string[] }[];
  variants: PublicVariant[];
  images: ImageSet[];
  brand: { name: string; slug: string; story: string; logo: ImageSet | null };
  related: PublicProductCard[];
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  /** Optional second WhatsApp number, shown next to the first. */
  whatsappNumber2: string | null;
  contactEmail: string;
  instagramUrl: string | null;
  freeDeliveryThresholdCents: number | null;
  announcementText: string | null;
  announcementActive: boolean;
  heroHeading: string;
  heroText: string;
  heroImage: ImageSet | null;
  /** Photo on the About page, under the title. */
  aboutImage: ImageSet | null;
}

export interface HomeData {
  featuredBrands: PublicBrandCard[];
  featuredProducts: PublicProductCard[];
  newArrivals: PublicProductCard[];
  categories: PublicCategory[];
  gallery: PublicProductCard[];
}

export interface DeliveryZoneOption {
  id: number;
  name: string;
  feeCents: number;
}

export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  description: string;
}

export interface QuoteLine {
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  brandName: string;
  variantLabel: string;
  image: ImageSet | null;
  unitPriceCents: number;
  requestedQuantity: number;
  quantity: number;
  stock: number;
  lineTotalCents: number;
  available: boolean;
}

export interface QuoteResult {
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  /** Our fee and every brand's fee added together. */
  deliveryFeeCents: number;
  /** Our part of the delivery fee. null when brands deliver everything in the bag themselves. */
  shopDeliveryFeeCents: number | null;
  /** Brands that deliver their own items, with their fee for the chosen area. */
  brandDeliveries: { brandName: string; feeCents: number }[];
  totalCents: number;
  freeDeliveryThresholdCents: number | null;
  promo: { code: string; applied: boolean; message: string | null } | null;
}

export interface CheckoutResult {
  orderNumber: string;
  /** Present when the customer must finish paying on the provider's hosted page. */
  redirectUrl: string | null;
}

export interface TrackedOrder {
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  totalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  items: { productName: string; variantLabel: string; quantity: number; unitPriceCents: number }[];
  history: { status: OrderStatus; at: string }[];
}

export interface SearchSuggestion {
  products: PublicProductCard[];
  brands: { name: string; slug: string }[];
}

/* ---------- Admin ---------- */

export interface AdminMe {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  csrfToken: string;
}

export interface AdminBrandRow {
  id: number;
  name: string;
  slug: string;
  logo: ImageSet | null;
  isActive: boolean;
  commissionPct: number;
  ownDelivery: boolean;
  productCount: number;
}

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  logo: ImageSet | null;
  cover: ImageSet | null;
  story: string;
  instagramUrl: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  commissionPct: number;
  /** The brand delivers its own products, at the prices in deliveryFees. */
  ownDelivery: boolean;
  /** The brand's own price per delivery area. Areas left out are delivered by us. */
  deliveryFees: { zoneId: number; feeCents: number }[];
  internalNotes: string | null;
  isActive: boolean;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  image: ImageSet | null;
  parentId: number | null;
  sortOrder: number;
  productCount: number;
}

export interface AdminProductRow {
  id: number;
  name: string;
  slug: string;
  status: ProductStatus;
  featured: boolean;
  priceCents: number;
  totalStock: number;
  image: ImageSet | null;
  brand: { id: number; name: string };
  category: { id: number; name: string };
  updatedAt: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  brandId: number;
  categoryId: number;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  commissionPct: number | null;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  options: { name: string; values: string[] }[];
  variants: {
    id: number;
    options: Record<string, string>;
    sku: string | null;
    priceCents: number | null;
    stock: number;
  }[];
  images: ImageSet[];
}

export interface AdminOrderRow {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  region: string;
  totalCents: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrder extends AdminOrderRow {
  email: string | null;
  city: string;
  address: string;
  notes: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  promoCode: string | null;
  paidAt: string | null;
  items: {
    id: number;
    productId: number;
    productName: string;
    variantLabel: string;
    brand: { id: number; name: string; phone: string | null };
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    commissionPct: number;
    /** True when the brand delivers this item itself. */
    deliveredByBrand: boolean;
    image: ImageSet | null;
  }[];
  /** Brands delivering their own items on this order. Our part is deliveryFeeCents minus these. */
  brandDeliveries: { brandId: number; brandName: string; phone: string | null; feeCents: number }[];
  history: { status: OrderStatus; note: string | null; by: string | null; at: string }[];
  payments: { provider: PaymentMethod; amountCents: number; status: string; reference: string | null; at: string }[];
  nextStatuses: OrderStatus[];
}

export interface DashboardData {
  ordersToday: number;
  ordersThisMonth: number;
  newOrdersWaiting: number;
  /** Money figures are only sent to owners. */
  money: {
    revenueTodayCents: number;
    revenueThisMonthCents: number;
    commissionThisMonthCents: number;
    commissionAllTimeCents: number;
  } | null;
  lowStock: { productId: number; productName: string; variantLabel: string; stock: number }[];
  latestOrders: AdminOrderRow[];
}

export interface BrandBalance {
  brandId: number;
  brandName: string;
  totalSalesCents: number;
  commissionCents: number;
  /** Delivery fees the brand charged when delivering its own items. Owed to the brand in full. */
  deliveryFeesCents: number;
  owedToBrandCents: number;
  paidOutCents: number;
  balanceCents: number;
}

export interface BrandPayoutRow {
  id: number;
  brandId: number;
  brandName: string;
  amountCents: number;
  paidAt: string;
  method: string;
  note: string | null;
  recordedBy: string | null;
}

export interface AdminPromoCode {
  id: number;
  code: string;
  type: PromoType;
  value: number;
  minOrderCents: number;
  expiresAt: string | null;
  usageLimit: number | null;
  timesUsed: number;
  isActive: boolean;
}

export interface AdminDeliveryZone {
  id: number;
  name: string;
  feeCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminSettings {
  storeName: string;
  whatsappNumber: string;
  /** Optional second WhatsApp number, shown next to the first. */
  whatsappNumber2: string | null;
  contactEmail: string;
  instagramUrl: string | null;
  freeDeliveryThresholdCents: number | null;
  announcementText: string | null;
  announcementActive: boolean;
  heroHeading: string;
  heroText: string;
  heroImage: ImageSet | null;
  aboutImage: ImageSet | null;
  featuredBrandIds: number[];
  featuredProductIds: number[];
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface UploadResult {
  image: ImageSet;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
