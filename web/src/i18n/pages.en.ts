/**
 * Long form copy for the information pages. Kept apart from en.ts because it's longer,
 * but it follows the same rule: one file per language.
 */
export interface PageSection {
  heading?: string;
  paragraphs: string[];
}

export interface InfoPage {
  title: string;
  description: string;
  intro?: string;
  sections: PageSection[];
}

export const pagesEn = {
  about: {
    title: "About Lately Lebanon",
    description:
      "Lately Lebanon is a curated marketplace bringing Lebanese brands, independent businesses and the people behind them together in one place.",
    intro: "A little more local.",
    sections: [
      {
        paragraphs: [
          "Lebanon is full of people with ideas, passion and something special to offer.",
          "From emerging labels to independent businesses, there are so many local brands worth discovering. Yet finding them often means searching through pages, scrolling through social media and stumbling upon them by chance.",
          "We thought there should be an easier way.",
        ],
      },
      {
        paragraphs: [
          "Lately Lebanon was created to bring these discoveries together in one place: a curated marketplace celebrating Lebanese brands, independent businesses and the people behind them.",
          "A place where customers can discover something new, find their next favourite brand and shop local with ease.",
          "And a place where businesses can introduce their products to a wider audience, connect with new customers and become part of a community that believes in what they do.",
        ],
      },
      {
        paragraphs: [
          "Because shopping local should feel exciting, effortless and full of discovery.",
          "Discover local. Shop Lebanese.",
        ],
      },
    ],
  },
  faq: {
    title: "Questions",
    description: "Delivery, payment, returns and everything else people ask us.",
    sections: [
      {
        heading: "Where do you deliver?",
        paragraphs: ["Anywhere in Lebanon. The delivery fee depends on your area and is shown at checkout. Orders over the free delivery amount ship free."],
      },
      {
        heading: "How long does delivery take?",
        paragraphs: [
          "Usually 2 to 4 working days. Some products are made to order, so if something takes longer we'll call or message you before we confirm.",
        ],
      },
      {
        heading: "How do I pay?",
        paragraphs: [
          "Cash on delivery works everywhere. Card and Whish payments are shown at checkout when they're available. Card payments happen on the bank's secure page, so we never see your card details.",
        ],
      },
      {
        heading: "Do I need an account?",
        paragraphs: ["No. Checkout only asks for your name, phone number and address. You can track your order with your order number and phone."],
      },
      {
        heading: "Why might an item look a little different from the photos?",
        paragraphs: [
          "Product photos are provided by each brand, and colours can look different from one screen to another. Some products are also handmade or made in small batches, so small variations are normal. If something arrives damaged or not as described, see our returns page.",
        ],
      },
      {
        heading: "Can I order something custom or in a larger quantity?",
        paragraphs: ["Often, yes. Email us with what you have in mind and we'll ask the brand."],
      },
      {
        heading: "I run a Lebanese brand. Can I sell on Lately Lebanon?",
        paragraphs: [
          "We'd love to hear from you. Partner brands get another place to showcase their products, reach new customers and sell alongside other Lebanese brands. Send us a few words about your brand and a link to your page by email.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns",
    description: "What to do if something arrives damaged or isn't right.",
    sections: [
      {
        heading: "Damaged or wrong item",
        paragraphs: [
          "If something arrives broken, damaged or isn't what you ordered, message us within 48 hours of delivery with your order number and a photo. We'll arrange a replacement or a full refund, including delivery.",
        ],
      },
      {
        heading: "Changed your mind",
        paragraphs: [
          "Unused items in their original condition can be returned within 7 days of delivery. Message us first so we can arrange pickup. The delivery cost of the return is on you, and we refund the item price once the brand receives it.",
        ],
      },
      {
        heading: "What can't be returned",
        paragraphs: [
          "Food from the pantry, opened body care products and anything made to order. For hygiene and freshness reasons we can't take these back unless they arrived damaged.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Cash orders are refunded in cash or by Whish. Card payments are refunded to the same card, which can take a few working days to appear depending on your bank.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms",
    description: "The terms that apply when you shop on Lately Lebanon.",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "Lately Lebanon is an online shop based in Lebanon. We sell products from Lebanese brands and independent businesses (our partner brands) on their behalf. When you place an order, you're buying from us, and the brand prepares the order.",
        ],
      },
      {
        heading: "Prices and payment",
        paragraphs: [
          "Prices are in US dollars and include everything except delivery, which is shown at checkout. We check every price and promo code when you place your order. If a price on the site is clearly wrong, we'll contact you before going ahead.",
        ],
      },
      {
        heading: "Orders and stock",
        paragraphs: [
          "Your order is confirmed when we call or message you, or when your online payment goes through. Some items are available in limited quantities. If something sells out before we can prepare it, we'll tell you and refund anything you've paid.",
          "Card and Whish orders that aren't paid within 30 minutes are cancelled automatically.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "We deliver across Lebanon. Delivery times are estimates. Please make sure someone can receive the parcel and answer the phone number you gave us.",
        ],
      },
      {
        heading: "Returns",
        paragraphs: ["Our returns page explains what can be returned and how. It forms part of these terms."],
      },
      {
        heading: "Product photos and variations",
        paragraphs: [
          "Product photos are supplied by our partner brands and show a typical piece. Some products are handmade or made in small batches, so small variations in colour, size and finish are normal and aren't defects.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: ["Questions about these terms? Write to info@latelylebanon.com."],
      },
    ],
  },
  privacy: {
    title: "Privacy",
    description: "What we collect when you shop with us, and what we do with it.",
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "When you order, we collect your name, phone number, delivery address, any notes you add and, if you give it, your email address. We don't ask you to create an account.",
          "Your bag, saved items and recently viewed products are stored in your own browser, not on our servers.",
        ],
      },
      {
        heading: "Why we use it",
        paragraphs: [
          "To prepare and deliver your order, contact you about it and send you an order confirmation. We share your name, phone and address with the brand and the delivery partner only so they can get your order to you.",
          "We don't sell your details, and we don't send marketing messages unless you've asked us to.",
        ],
      },
      {
        heading: "Payments",
        paragraphs: [
          "Card payments are handled on the bank's secure payment page. Your card details never reach our servers. Whish payments are handled by Whish.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: ["We keep order records for as long as we need them for accounting and to handle returns, and no longer than the law requires."],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can ask us what we hold about you, or ask us to correct or delete it, by writing to info@latelylebanon.com. You can clear your bag and saved items at any time by clearing your browser data.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    description: "Get in touch with Lately Lebanon by email. We usually reply the same day.",
    intro: "Email us any time. We usually reply the same day, Monday to Saturday.",
    sections: [
      {
        heading: "About an order",
        paragraphs: ["Have your order number ready, it starts with LL. You can also check its status on the Track your order page."],
      },
      {
        heading: "Partner with us",
        paragraphs: [
          "Run a Lebanese brand and want to reach new customers? Become a partner brand. Send us a few words about your brand and a link to your page.",
        ],
      },
    ],
  },
} satisfies Record<string, InfoPage>;

export type InfoPageKey = keyof typeof pagesEn;
