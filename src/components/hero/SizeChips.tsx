import type { Item } from "../../content/looks";

interface Props {
  item: Item;
  value?: string;
  onChange: (size: string) => void;
  error?: boolean;
  idPrefix?: string;
}

export function SizeChips({ item, value, onChange, error, idPrefix = "" }: Props) {
  const errId = `${idPrefix}${item.id}-err`;
  return (
    <>
      <div className="chips" role="group" aria-label={`Size for ${item.name}`} aria-describedby={error ? errId : undefined}>
        {item.sizes.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={value === s}
            onClick={() => onChange(s)}
            data-chip
          >
            {s.replace("EU ", "")}
          </button>
        ))}
      </div>
      <p id={errId} className="size-error mono" aria-live="polite">
        {error ? "Select a size" : ""}
      </p>
    </>
  );
}
