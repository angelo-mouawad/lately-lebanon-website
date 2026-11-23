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
    description: "Why we started a shop for small Lebanese makers, and how it works.",
    intro:
      "Lebanon has always made beautiful things in small rooms: soap in Tripoli, pots in the south, weaving in Zouk, jars of mouneh in every village kitchen. Lately Lebanon is one place to find them.",
    sections: [
      {
        heading: "Why we started",
        paragraphs: [
          "Most of the makers we work with sell through Instagram messages, word of mouth and the odd weekend market. They're brilliant at their craft and short on time for everything else: photos, delivery, answering the same question forty times.",
          "We started Lately Lebanon to take that part off their hands, so they can keep making and more people can find them.",
        ],
      },
      {
        heading: "How it works",
        paragraphs: [
          "We meet every maker in person, see the workshop, and agree on what goes in the shop. We photograph the products, write the listings and look after customers.",
          "When you order, the maker prepares your parcel and it goes out with our delivery partner, or with the maker directly. We keep a commission on each sale. The rest goes back to the person who made it.",
        ],
      },
      {
        heading: "What we look for",
        paragraphs: [
          "Things made in Lebanon, by hand or in small batches, by people who'd be happy to tell you how. No resellers, no imports with a new label.",
          "If you make something you think belongs here, message us. We'd like to visit.",
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
          "Usually 2 to 4 working days. Some pieces are made in small batches, so if something takes longer we'll call or message you before we confirm.",
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
        heading: "Why do some items look a little different from the photos?",
        paragraphs: [
          "Because they're handmade. Glazes run, weaves shift, a batch of soap cures a shade darker. We think that's the point, but if something arrives damaged or not as described, see our returns page.",
        ],
      },
      {
        heading: "Can I order something custom or in a larger quantity?",
        paragraphs: ["Often, yes. Message us on WhatsApp with what you have in mind and we'll ask the maker."],
      },
      {
        heading: "I make things in Lebanon. Can I sell with you?",
        paragraphs: ["We'd love to hear from you. Send us a few photos and a line about what you make on WhatsApp or by email."],
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
          "Unused items in their original condition can be returned within 7 days of delivery. Message us first so we can arrange pickup. The delivery cost of the return is on you, and we refund the item price once the maker receives it.",
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
          "Lately Lebanon is an online shop based in Lebanon. We sell products made by independent Lebanese makers (our brands) on their behalf. When you place an order, you're buying from us, and the brand prepares the order.",
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
          "Your order is confirmed when we call or message you, or when your online payment goes through. Most items are made in small numbers. If something sells out before we can prepare it, we'll tell you and refund anything you've paid.",
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
        heading: "Handmade goods",
        paragraphs: [
          "Small variations in colour, size and finish are part of handmade work and aren't defects. Product photos show a typical piece.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: ["Questions about these terms? Write to hello@latelylebanon.com."],
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
          "To prepare and deliver your order, contact you about it and send you an order confirmation. We share your name, phone and address with the maker and the delivery partner only so they can get your order to you.",
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
          "You can ask us what we hold about you, or ask us to correct or delete it, by writing to hello@latelylebanon.com. You can clear your bag and saved items at any time by clearing your browser data.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    description: "Message us on WhatsApp or email us. We usually reply the same day.",
    intro: "The quickest way to reach us is WhatsApp. We usually reply the same day, Monday to Saturday.",
    sections: [
      {
        heading: "About an order",
        paragraphs: ["Have your order number ready, it starts with LL. You can also check its status on the Track your order page."],
      },
      {
        heading: "Makers",
        paragraphs: ["If you make something in Lebanon and think it belongs here, send us a few photos and a line about your work."],
      },
    ],
  },
} satisfies Record<string, InfoPage>;

export type InfoPageKey = keyof typeof pagesEn;
