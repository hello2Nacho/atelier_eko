import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { bundlePrice, lookTotal, pad2, type Item, type Look } from "../content/looks";

export interface BagPart {
  itemId: string;
  name: string;
  colour: string;
  size: string;
  thumb: string;
  price: number;
}
export interface BagLine {
  key: string;
  kind: "item" | "look";
  title: string;
  parts: BagPart[];
  /** unit price paid */
  price: number;
  /** unit price before bundle discount */
  original: number;
  qty: number;
}

interface Toast {
  id: number;
  text: string;
}

interface BagApi {
  lines: BagLine[];
  count: number;
  subtotal: number;
  savings: number;
  addItem: (item: Item, size: string) => void;
  addLook: (look: Look, sizes: string[]) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  toast: Toast | null;
  dismissToast: () => void;
  /** element that opened the drawer, for focus return */
  openerRef: React.MutableRefObject<HTMLElement | null>;
  bump: number;
}

const BagCtx = createContext<BagApi | null>(null);
const STORAGE_KEY = "atelier-eko-bag-v1";

const part = (i: Item, size: string): BagPart => ({
  itemId: i.id, name: i.name, colour: i.colour, size, thumb: i.thumb, price: i.price,
});

function load(): BagLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BagLine[]) : [];
  } catch {
    return [];
  }
}

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>(load);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [bump, setBump] = useState(0);
  const openerRef = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* private mode: bag just won't persist */
    }
  }, [lines]);

  const notify = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    setBump((b) => b + 1);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const upsert = (line: BagLine) =>
    setLines((ls) => {
      const hit = ls.find((l) => l.key === line.key);
      return hit ? ls.map((l) => (l.key === line.key ? { ...l, qty: l.qty + 1 } : l)) : [...ls, line];
    });

  const addItem = useCallback((item: Item, size: string) => {
    upsert({ key: `${item.id}:${size}`, kind: "item", title: item.name, parts: [part(item, size)], price: item.price, original: item.price, qty: 1 });
    notify(`${item.name} (${size}) added to your bag`);
  }, [notify]);

  const addLook = useCallback((look: Look, sizes: string[]) => {
    upsert({
      key: `look-${look.id}:${sizes.join("/")}`,
      kind: "look",
      title: `${look.label} · Full look`,
      parts: look.items.map((i, n) => part(i, sizes[n])),
      price: bundlePrice(look),
      original: lookTotal(look),
      qty: 1,
    });
    notify(`Look ${pad2(look.id)} added to your bag`);
  }, [notify]);

  const setQty = useCallback((key: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty } : l)))), []);
  const remove = useCallback((key: string) => setLines((ls) => ls.filter((l) => l.key !== key)), []);

  const value = useMemo<BagApi>(() => {
    const count = lines.reduce((s, l) => s + l.qty * l.parts.length, 0);
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const savings = lines.reduce((s, l) => s + l.qty * (l.original - l.price), 0);
    return {
      lines, count, subtotal, savings, addItem, addLook, setQty, remove, open, setOpen,
      toast, dismissToast: () => setToast(null), openerRef, bump,
    };
  }, [lines, addItem, addLook, setQty, remove, open, toast, bump]);

  return <BagCtx.Provider value={value}>{children}</BagCtx.Provider>;
}

export function useBag() {
  const ctx = useContext(BagCtx);
  if (!ctx) throw new Error("useBag outside BagProvider");
  return ctx;
}

