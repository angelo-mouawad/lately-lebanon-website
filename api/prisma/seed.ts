/**
 * Fills a fresh database with sample brands, categories and products so the site looks
 * complete straight away, and creates the first owner account from env vars.
 *
 * Run with: npm run db:seed -w api
 * The catalog is only seeded when there are no brands yet, so running it again is safe.
 */
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { normalizeLebanesePhone, slugify, type UploadKind } from "@latelylebanon/shared";
import { hashPassword } from "../src/services/auth.service";
import { processAndStoreImage } from "../src/storage/images";
import { coverArt, detailArt, logoArt, productArt, type Colour, type Motif } from "./seed-art";

const prisma = new PrismaClient();

async function render(svg: string, kind: UploadKind) {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return processAndStoreImage(png, kind);
}

/* ---------- Data ---------- */

const categories = [
  { name: "Ceramics", sort: 0, art: ["cup", "sand", "terracotta", "clay"] },
  { name: "Home and Textiles", sort: 1, art: ["textile", "cream", "sea", "sand"] },
  { name: "Bath and Body", sort: 2, art: ["soap", "sand", "olive", "sage"] },
  { name: "Pantry", sort: 3, art: ["jar", "cream", "ochre", "terracotta"] },
  { name: "Gifts", sort: 4, art: ["box", "sand", "terracotta", "ochre"] },
] as const;

const brands = [
  {
    name: "Dar Zeitoun",
    story:
      "Nadia and Karim run the soap workshop their grandfather opened in Tripoli's old souk. Every bar starts with olive oil pressed in Koura, is cooked slowly, poured, cut by hand and left to cure for nine months. No palm oil and no shortcuts.",
    instagramUrl: "https://instagram.com/",
    contactName: "Nadia",
    phone: "70 111 222",
    commissionPct: 20,
    colours: ["sand", "olive", "sage"] as Colour[],
  },
  {
    name: "Qamar Ceramics",
    story:
      "Rana throws every piece on a kick wheel in Rashaya al Fukhar, a village in the south that has been making pottery for centuries. The clay is local and the glazes are mixed in small batches, so no two cups come out quite the same.",
    instagramUrl: "https://instagram.com/",
    contactName: "Rana",
    phone: "71 333 444",
    commissionPct: 25,
    colours: ["cream", "terracotta", "clay"] as Colour[],
  },
  {
    name: "Nawl Studio",
    story:
      "Nawl means loom in Arabic. Maya and four weavers in Zouk Mikael work on wooden looms, mixing cotton and linen into throws, towels and table runners in colours taken from the Lebanese coast in late summer.",
    instagramUrl: "https://instagram.com/",
    contactName: "Maya",
    phone: "76 555 666",
    commissionPct: 22,
    colours: ["sand", "sea", "rose"] as Colour[],
  },
  {
    name: "Mouneh House",
    story:
      "Mouneh is the Lebanese pantry: what you dry, press and preserve in summer to eat all winter. Siham's kitchen in the Chouf makes za'atar from wild thyme, pomegranate molasses, apricot jam and kishk the slow way, a few jars at a time.",
    instagramUrl: "https://instagram.com/",
    contactName: "Siham",
    phone: "03 777 888",
    commissionPct: 18,
    colours: ["cream", "ochre", "terracotta"] as Colour[],
  },
];

interface SeedProduct {
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAt?: number;
  description: string;
  tags: string[];
  featured?: boolean;
  option?: { name: string; values: { value: string; price?: number; stock: number }[] };
  stock?: number;
  art: [Motif, Colour, Colour, Colour];
}

const products: SeedProduct[] = [
  {
    name: "Pure Olive Oil Soap",
    brand: "Dar Zeitoun",
    category: "Bath and Body",
    price: 6,
    description:
      "The bar Tripoli is known for. Just olive oil, water and soda, cured for nine months until it turns pale and hard. Gentle enough for the face, good for the whole family.",
    tags: ["soap", "olive oil", "tripoli"],
    featured: true,
    option: { name: "Size", values: [{ value: "Single bar", stock: 40 }, { value: "Pack of 3", price: 16, stock: 15 }] },
    art: ["soap", "sand", "sage", "olive"],
  },
  {
    name: "Laurel and Olive Soap",
    brand: "Dar Zeitoun",
    category: "Bath and Body",
    price: 8,
    description:
      "Olive oil with laurel berry oil from the north. Green inside, with a clean, slightly bitter smell. A favourite for dry skin and for shaving.",
    tags: ["soap", "laurel"],
    stock: 25,
    art: ["soap", "cream", "olive", "sage"],
  },
  {
    name: "Rose Water Soap",
    brand: "Dar Zeitoun",
    category: "Bath and Body",
    price: 7,
    description: "Olive oil soap scented with rose water distilled in Qartaba. Soft pink, lightly floral, never sweet.",
    tags: ["soap", "rose"],
    stock: 2,
    art: ["soap", "sand", "rose", "clay"],
  },
  {
    name: "Olive Oil Body Balm",
    brand: "Dar Zeitoun",
    category: "Bath and Body",
    price: 14,
    description:
      "A rich balm of olive oil and beeswax from mountain hives. Melts on contact. Use it on hands, elbows and heels after the sea.",
    tags: ["balm", "beeswax"],
    option: { name: "Size", values: [{ value: "50 ml", stock: 18 }, { value: "100 ml", price: 22, stock: 9 }] },
    art: ["jar", "sand", "olive", "ochre"],
  },
  {
    name: "The Hammam Set",
    brand: "Dar Zeitoun",
    category: "Gifts",
    price: 35,
    compareAt: 40,
    description: "Three of our soaps, a natural loofah and a cotton pouch to keep them in. Wrapped and ready to give.",
    tags: ["gift", "set"],
    featured: true,
    stock: 12,
    art: ["box", "cream", "olive", "terracotta"],
  },
  {
    name: "Ahweh Cups, Set of Two",
    brand: "Qamar Ceramics",
    category: "Ceramics",
    price: 28,
    description:
      "Small handleless cups for Lebanese coffee, thrown and glazed by hand. Each holds about 60 ml. Sold as a pair.",
    tags: ["coffee", "cups"],
    featured: true,
    option: {
      name: "Colour",
      values: [
        { value: "Sand", stock: 8 },
        { value: "Olive", stock: 6 },
        { value: "Terracotta", stock: 3 },
      ],
    },
    art: ["cup", "cream", "terracotta", "sand"],
  },
  {
    name: "Rashaya Serving Bowl",
    brand: "Qamar Ceramics",
    category: "Ceramics",
    price: 45,
    description:
      "A wide, shallow bowl for fattoush, fruit or anything you put in the middle of the table. Unglazed foot, glossy inside.",
    tags: ["bowl", "serving"],
    option: { name: "Size", values: [{ value: "Small", stock: 7 }, { value: "Large", price: 65, stock: 4 }] },
    art: ["bowl", "sand", "clay", "terracotta"],
  },
  {
    name: "Za'atar and Oil Dish",
    brand: "Qamar Ceramics",
    category: "Ceramics",
    price: 22,
    description: "Two wells side by side, one for olive oil and one for za'atar. Made for breakfast with warm bread.",
    tags: ["dish", "breakfast"],
    stock: 14,
    art: ["bowl", "cream", "olive", "sage"],
  },
  {
    name: "Speckled Mug",
    brand: "Qamar Ceramics",
    category: "Ceramics",
    price: 20,
    description: "A heavy everyday mug with flecks of iron in the clay. Holds a proper amount of tea. Dishwasher safe.",
    tags: ["mug"],
    option: { name: "Colour", values: [{ value: "Cream", stock: 10 }, { value: "Charcoal", stock: 0 }] },
    art: ["cup", "sand", "charcoal", "cream"],
  },
  {
    name: "Clay Water Jug",
    brand: "Qamar Ceramics",
    category: "Ceramics",
    price: 55,
    compareAt: 65,
    description:
      "The ibrik that kept water cool in village houses. Unglazed outside so it breathes, glazed inside so it stays clean.",
    tags: ["jug", "ibrik"],
    featured: true,
    stock: 5,
    art: ["jug", "cream", "terracotta", "ink"],
  },
  {
    name: "Coastal Linen Throw",
    brand: "Nawl Studio",
    category: "Home and Textiles",
    price: 85,
    description:
      "Woven on a wooden loom from cotton and Lebanese linen. Light enough for summer nights in the mountains, big enough for two.",
    tags: ["throw", "linen"],
    featured: true,
    option: { name: "Colour", values: [{ value: "Sea", stock: 5 }, { value: "Sand", stock: 6 }] },
    art: ["textile", "sand", "sea", "cream"],
  },
  {
    name: "Hammam Towel",
    brand: "Nawl Studio",
    category: "Home and Textiles",
    price: 32,
    description: "A flat woven fouta that dries fast and folds small. Beach, bath or a light scarf on the way back.",
    tags: ["towel", "beach"],
    option: {
      name: "Colour",
      values: [
        { value: "Olive", stock: 9 },
        { value: "Terracotta", stock: 11 },
        { value: "Ink", stock: 2 },
      ],
    },
    art: ["textile", "cream", "terracotta", "sand"],
  },
  {
    name: "Woven Table Runner",
    brand: "Nawl Studio",
    category: "Home and Textiles",
    price: 48,
    description: "Two metres of hand woven cotton with a thin olive stripe. Fits a table for eight.",
    tags: ["table", "runner"],
    stock: 8,
    art: ["textile", "sand", "olive", "cream"],
  },
  {
    name: "Cotton Cushion Cover",
    brand: "Nawl Studio",
    category: "Home and Textiles",
    price: 38,
    description: "A 50 by 50 cm cover with a hidden zip. Woven in the same yarns as our throws so they sit well together.",
    tags: ["cushion"],
    option: { name: "Colour", values: [{ value: "Rose", stock: 6 }, { value: "Sea", stock: 7 }] },
    art: ["textile", "cream", "rose", "sand"],
  },
  {
    name: "Linen Napkins, Set of Four",
    brand: "Nawl Studio",
    category: "Home and Textiles",
    price: 36,
    description: "Soft washed linen with a hand rolled hem. They get better every time they go through the machine.",
    tags: ["napkins", "linen"],
    stock: 10,
    art: ["textile", "sand", "sage", "cream"],
  },
  {
    name: "Wild Za'atar Mix",
    brand: "Mouneh House",
    category: "Pantry",
    price: 9,
    description:
      "Wild thyme picked on the Chouf hills, dried in the shade and mixed with sumac and toasted sesame. Strong, green and sour.",
    tags: ["zaatar", "thyme"],
    featured: true,
    option: { name: "Size", values: [{ value: "200 g", stock: 30 }, { value: "500 g", price: 19, stock: 12 }] },
    art: ["jar", "cream", "olive", "ochre"],
  },
  {
    name: "Pomegranate Molasses",
    brand: "Mouneh House",
    category: "Pantry",
    price: 11,
    description: "Just pomegranates, cooked down for a full day until thick and dark. No added sugar. For fattoush, muhammara and marinades.",
    tags: ["molasses", "pomegranate"],
    stock: 20,
    art: ["jar", "sand", "terracotta", "ink"],
  },
  {
    name: "Apricot Jam",
    brand: "Mouneh House",
    category: "Pantry",
    price: 8,
    description: "Apricots from the Bekaa in June, cooked in small pots with a little lemon. Chunky, not too sweet.",
    tags: ["jam", "apricot"],
    stock: 16,
    art: ["jar", "cream", "ochre", "terracotta"],
  },
  {
    name: "Mountain Kishk",
    brand: "Mouneh House",
    category: "Pantry",
    price: 10,
    description:
      "Bulgur fermented with yoghurt, dried on the roof and ground fine. Cook it into a winter soup or spread it on man'oushe.",
    tags: ["kishk"],
    stock: 1,
    art: ["jar", "sand", "clay", "olive"],
  },
  {
    name: "The Mouneh Box",
    brand: "Mouneh House",
    category: "Gifts",
    price: 42,
    description: "Za'atar, pomegranate molasses, apricot jam and kishk in one box. A Lebanese pantry for anyone who misses home.",
    tags: ["gift", "box"],
    featured: true,
    stock: 9,
    art: ["box", "cream", "ochre", "olive"],
  },
];

/* ---------- Seed ---------- */

async function seedOwner() {
  const email = process.env.SEED_OWNER_EMAIL?.toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD;
  const name = process.env.SEED_OWNER_NAME ?? "Owner";
  if (!email || !password) throw new Error("Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in api/.env");
  if (password.length < 10) throw new Error("SEED_OWNER_PASSWORD must be at least 10 characters");

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Owner ${email} already exists, leaving the password unchanged`);
    return;
  }
  await prisma.adminUser.create({ data: { email, name, role: "OWNER", passwordHash: await hashPassword(password) } });
  console.log(`Created owner account ${email}`);
}

async function seedZonesAndPromo() {
  if ((await prisma.deliveryZone.count()) === 0) {
    await prisma.deliveryZone.createMany({
      data: [
        { name: "Beirut", feeCents: 300, sortOrder: 0 },
        { name: "Mount Lebanon", feeCents: 400, sortOrder: 1 },
        { name: "North", feeCents: 500, sortOrder: 2 },
        { name: "South", feeCents: 500, sortOrder: 3 },
        { name: "Bekaa", feeCents: 500, sortOrder: 4 },
      ],
    });
  }
  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 10, minOrderCents: 3000 },
  });
}

async function seedCatalog() {
  if (process.env.SEED_SAMPLE_CATALOG === "false") {
    console.log("SEED_SAMPLE_CATALOG=false, skipping the sample catalog");
    await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        whatsappNumber: "+96170000000",
        contactEmail: "info@latelylebanon.com",
        heroHeading: "Lebanese brands, all in one place.",
        heroText: "",
        featuredBrandIds: [],
        featuredProductIds: [],
      },
    });
    return;
  }
  if ((await prisma.brand.count()) > 0) {
    console.log("Brands already exist, skipping the sample catalog");
    return;
  }

  console.log("Rendering sample images, this takes a moment...");
  const categoryIds = new Map<string, number>();
  for (const c of categories) {
    const [motif, bg, main, detail] = c.art;
    const image = await render(productArt(motif, bg, main, detail), "category");
    const row = await prisma.category.create({
      data: { name: c.name, slug: slugify(c.name), sortOrder: c.sort, imageKey: image.key },
    });
    categoryIds.set(c.name, row.id);
  }

  const brandIds = new Map<string, number>();
  for (const b of brands) {
    const [bg, a, c] = b.colours as [Colour, Colour, Colour];
    const [logo, cover] = await Promise.all([render(logoArt(bg, a), "brand-logo"), render(coverArt(bg, a, c), "brand-cover")]);
    const row = await prisma.brand.create({
      data: {
        name: b.name,
        slug: slugify(b.name),
        story: b.story,
        instagramUrl: b.instagramUrl,
        contactName: b.contactName,
        phone: normalizeLebanesePhone(b.phone),
        commissionPct: b.commissionPct,
        logoKey: logo.key,
        coverKey: cover.key,
        internalNotes: "Sample brand created by the seed script.",
      },
    });
    brandIds.set(b.name, row.id);
  }

  const featured: number[] = [];
  for (const [index, p] of products.entries()) {
    const [motif, bg, main, detail] = p.art;
    const [shot, closeUp] = await Promise.all([
      render(productArt(motif, bg, main, detail), "product"),
      render(detailArt(bg, main, detail, index), "product"),
    ]);
    // Stagger publish dates so "newest" sorting has something to sort.
    const publishedAt = new Date(Date.now() - (products.length - index) * 36 * 60 * 60 * 1000);
    const optionValues = p.option?.values ?? [];
    const row = await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        brandId: brandIds.get(p.brand)!,
        categoryId: categoryIds.get(p.category)!,
        description: p.description,
        priceCents: Math.round(p.price * 100),
        compareAtCents: p.compareAt ? Math.round(p.compareAt * 100) : null,
        status: "PUBLISHED",
        featured: Boolean(p.featured),
        tags: p.tags,
        options: p.option ? [{ name: p.option.name, values: optionValues.map((v) => v.value) }] : [],
        publishedAt,
        createdAt: publishedAt,
        variants: {
          create: p.option
            ? optionValues.map((v, i) => ({
                options: { [p.option!.name]: v.value },
                label: v.value,
                priceCents: v.price ? Math.round(v.price * 100) : null,
                stock: v.stock,
                sortOrder: i,
              }))
            : [{ options: {}, label: "", stock: p.stock ?? 10 }],
        },
        images: {
          create: [shot, closeUp].map((img, i) => ({
            key: img.key,
            alt: i === 0 ? p.name : `${p.name}, detail`,
            width: img.width,
            height: img.height,
            sortOrder: i,
          })),
        },
      },
    });
    if (p.featured) featured.push(row.id);
    console.log(`  ${p.name}`);
  }

  const hero = await render(coverArt("sand", "terracotta", "olive"), "hero");
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      storeName: "Lately Lebanon",
      whatsappNumber: "+96170000000",
      contactEmail: "info@latelylebanon.com",
      instagramUrl: "https://instagram.com/",
      freeDeliveryThresholdCents: 7500,
      announcementText: "Free delivery anywhere in Lebanon on orders over $75",
      announcementActive: true,
      heroHeading: "Lebanese brands, all in one place.",
      heroText:
        "Lately Lebanon brings together a curated selection of Lebanese brands and small businesses, making it easier to discover and shop local.",
      heroImageKey: hero.key,
      featuredBrandIds: [...brandIds.values()],
      featuredProductIds: featured.slice(0, 8),
    },
  });
}

async function main() {
  await seedOwner();
  await seedZonesAndPromo();
  await seedCatalog();
  console.log("Seed finished");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
