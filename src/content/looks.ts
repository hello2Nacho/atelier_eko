export type Category = "TOP" | "BOTTOM" | "FOOTWEAR";

export interface Item {
  id: string;
  category: Category;
  name: string;
  colour: string;
  /** short lower-case phrase for screen-reader labels */
  spoken: string;
  price: number;
  sizes: string[];
  image: string;
  thumb: string;
  /** hotspot position, % of the 800×1600 model canvas */
  hotspot: { x: number; y: number };
}

export interface Look {
  id: number;
  label: string;
  front: string;
  back: string;
  frontSm: string;
  backSm: string;
  caption: string;
  items: [Item, Item, Item];
}

export const BUNDLE_DISCOUNT = 0.15;
export const DEFAULT_SIZES: Record<Category, string> = { TOP: "M", BOTTOM: "32", FOOTWEAR: "EU 43" };

const TOPS = ["XS", "S", "M", "L", "XL", "XXL"];
const WAIST = ["28", "30", "32", "34", "36"];
const EU = ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"];

const m = (n: number) => ({
  front: `/media/models/look-${n}-front.webp`,
  back: `/media/models/look-${n}-back.webp`,
  frontSm: `/media/models/look-${n}-front-sm.webp`,
  backSm: `/media/models/look-${n}-back-sm.webp`,
});
const p = (n: number, part: "top" | "bottom" | "shoes") => ({
  image: `/media/products/look-${n}-${part}.webp`,
  thumb: `/media/products/look-${n}-${part}-sm.webp`,
});

type Def = [name: string, colour: string, spoken: string, price: number, hx: number, hy: number];
function look(n: number, caption: string, top: Def, bottom: Def, shoes: Def): Look {
  const mk = (cat: Category, part: "top" | "bottom" | "shoes", d: Def, sizes: string[]): Item => ({
    id: `l${n}-${part}`,
    category: cat,
    name: d[0],
    colour: d[1],
    spoken: d[2],
    price: d[3],
    sizes,
    hotspot: { x: d[4], y: d[5] },
    ...p(n, part),
  });
  return {
    id: n,
    label: `Look ${String(n).padStart(2, "0")}`,
    caption,
    ...m(n),
    items: [mk("TOP", "top", top, TOPS), mk("BOTTOM", "bottom", bottom, WAIST), mk("FOOTWEAR", "shoes", shoes, EU)],
  };
}

export const looks: Look[] = [
  look(1, "Onyx boxy tee, bleach barrel jean, smoke court low",
    ["Heavyweight Boxy Tee", "Onyx Black", "black boxy tee", 58, 54, 29.5],
    ["Barrel Leg Jean", "Bleach Wash", "bleach-wash barrel jeans", 128, 41, 62.5],
    ["Court Low Sneaker", "Smoke / White", "grey court sneakers", 165, 31, 95.8]),
  look(2, "Burnt sienna knit, graphite pleat, Ikoyi loafer",
    ["Lambswool Crew Knit", "Burnt Sienna", "rust lambswool knit", 135, 55, 29.5],
    ["Pleated Wide Trouser", "Graphite", "grey pleated trousers", 145, 43, 62.5],
    ["Ikoyi Penny Loafer", "Black Leather", "black leather loafers", 210, 38, 95.8]),
  look(3, "Ecru zip hoodie, charcoal cargo, bone runner",
    ["Heavyweight Zip Hoodie", "Ecru", "cream zip hoodie", 125, 54.5, 29.5],
    ["Wide Cargo Pant", "Charcoal", "charcoal cargo pants", 138, 38, 62.5],
    ["Chunky Runner", "Bone White", "white sneakers", 185, 36.5, 95.8]),
  look(4, "Moss wool crew, cocoa chino, tan suede court",
    ["Brushed Wool Crew", "Moss", "moss green wool sweater", 130, 54.5, 29.5],
    ["Pleated Wide Chino", "Cocoa", "brown pleated chinos", 118, 39.5, 62.5],
    ["Suede Court Sneaker", "Tan", "tan suede sneakers", 175, 36.5, 95.8]),
  look(5, "Ìrọ̀lẹ́ sunset tee, light vintage barrel, canvas high-top",
    ["Ìrọ̀lẹ́ Sunset Graphic Tee", "Washed Black", "washed black graphic tee", 62, 54, 29.5],
    ["Barrel Leg Jean", "Light Vintage", "light-wash barrel jeans", 128, 38, 62.5],
    ["Canvas High-Top", "Black / Ecru", "black canvas high-tops", 140, 39, 95.8]),
  look(6, "Heather fleece hoodie, mid indigo straight, heritage runner",
    ["Fleece Pullover Hoodie", "Heather Grey", "grey pullover hoodie", 115, 54.5, 29.5],
    ["Straight Leg Jean", "Mid Indigo", "mid-blue straight jeans", 122, 39, 62.5],
    ["Heritage Runner", "Grey Suede", "grey suede runners", 195, 38, 95.8]),
];

export const lookTotal = (l: Look) => l.items.reduce((s, i) => s + i.price, 0);
export const bundlePrice = (l: Look) => Math.round(lookTotal(l) * (1 - BUNDLE_DISCOUNT));
export const lookA11yLabel = (l: Look) =>
  `Look ${l.id} of ${looks.length}: ${l.items.map((i) => i.spoken).join(", ")}`;
export const allItems = looks.flatMap((l) => l.items.map((item) => ({ item, look: l })));
export const pad2 = (n: number) => String(n).padStart(2, "0");
export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
