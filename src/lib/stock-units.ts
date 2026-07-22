export const STOCK_UNIT_VALUES = [
  "unit",
  "bottle",
  "can",
  "kilogram",
  "gram",
  "liter",
  "milliliter",
  "package",
  "box",
  "bag",
  "roll",
  "bundle",
  "dozen",
  "tray",
  "sachet",
  "drum",
  "keg",
  "crate",
  "meter",
  "pair",
] as const;

export type StockUnit = (typeof STOCK_UNIT_VALUES)[number];

export interface StockUnitOption {
  value: StockUnit;
  label: string;
  abbreviation: string;
}

export const STOCK_UNITS: readonly StockUnitOption[] = [
  { value: "unit", label: "Unidad", abbreviation: "un." },
  { value: "bottle", label: "Botella", abbreviation: "bot." },
  { value: "can", label: "Lata", abbreviation: "lata" },
  { value: "kilogram", label: "Kilogramo", abbreviation: "kg" },
  { value: "gram", label: "Gramo", abbreviation: "g" },
  { value: "liter", label: "Litro", abbreviation: "L" },
  { value: "milliliter", label: "Mililitro", abbreviation: "ml" },
  { value: "package", label: "Paquete", abbreviation: "paq." },
  { value: "box", label: "Caja", abbreviation: "caja" },
  { value: "bag", label: "Bolsa", abbreviation: "bolsa" },
  { value: "roll", label: "Rollo", abbreviation: "rollo" },
  { value: "bundle", label: "Atado", abbreviation: "at." },
  { value: "dozen", label: "Docena", abbreviation: "doc." },
  { value: "tray", label: "Bandeja", abbreviation: "band." },
  { value: "sachet", label: "Sobre", abbreviation: "sob." },
  { value: "drum", label: "Bidón", abbreviation: "bid." },
  { value: "keg", label: "Barril", abbreviation: "barr." },
  { value: "crate", label: "Cajón", abbreviation: "caj." },
  { value: "meter", label: "Metro", abbreviation: "m" },
  { value: "pair", label: "Par", abbreviation: "par" },
];

const STOCK_UNIT_MAP = new Map(STOCK_UNITS.map((unit) => [unit.value, unit]));

export function getStockUnit(value: string): StockUnitOption {
  return STOCK_UNIT_MAP.get(value as StockUnit) ?? {
    value: "unit",
    label: "Unidad",
    abbreviation: "un.",
  };
}
