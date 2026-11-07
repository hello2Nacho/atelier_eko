export const site = {
  brand: "Atelier Eko",
  nav: [
    { label: "Shop", href: "#pieces" },
    { label: "Lookbook", href: "#lookbook" },
    { label: "About", href: "#lagos" },
  ],
  hero: {
    title: ["Try the", "Look."],
    subline: "SS27 Lookbook · 06 looks",
  },
  lookbook: {
    eyebrow: "SS27 Lookbook",
    title: ["Six ways to", "wear the city."],
    emphasis: "the city.",
  },
  pieces: {
    eyebrow: "The pieces",
    title: ["Eighteen pieces,", "one wardrobe."],
    filters: ["All", "Tops", "Bottoms", "Footwear"] as const,
  },
  lagos: {
    eyebrow: "Our studio",
    title: ["Made in", "Lagos."],
    body: "Cut and sewn in a small Yaba studio. Heavy cottons and soft wools, built for heat, traffic and long nights out.",
    values: [
      { title: "Cut in Yaba", text: "Every pattern drafted and graded in-house." },
      { title: "Small runs, no waste", text: "Made in batches of 120. Offcuts become trims." },
      { title: "Built for heat", text: "Breathable weights, roomy cuts, colours that hold." },
    ],
  },
  newsletter: {
    title: ["First look at", "SS28."],
    body: "One letter a season. New looks before anyone else.",
    cta: "Join",
    thanks: "You're on the list. See you next season.",
  },
  footer: {
    columns: [
      { title: "Shop", links: ["New in", "Tops", "Bottoms", "Footwear"] },
      { title: "Help", links: ["Shipping", "Returns", "Size guide", "Contact"] },
      { title: "Studio", links: ["About", "Lookbook", "Stockists", "Careers"] },
      { title: "Social", links: ["Instagram", "TikTok", "Pinterest"] },
    ],
    credit: "© 2026 Atelier Eko · Concept project by HiNacho",
  },
  checkoutMessage: {
    title: "Concept project by HiNacho — no real orders.",
    body: "Atelier Eko is a fictional brand. Thanks for walking the line.",
  },
};
