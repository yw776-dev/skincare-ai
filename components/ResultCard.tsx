type ResultCardProps = {
  title: string;
  items: string[];
  variant?: "products" | "pros" | "cons";
};

const variantStyles = {
  products: "border-stone-200 bg-white",
  pros: "border-emerald-200 bg-emerald-50/50",
  cons: "border-amber-200 bg-amber-50/50",
};

export default function ResultCard({
  title,
  items = [],
  variant = "products",
}: ResultCardProps) {
  const style = variantStyles[variant];
  const list = Array.isArray(items) ? items : [];

  return (
    <div
      className={`rounded-xl border p-6 ${style} shadow-sm`}
    >
      <h3 className="text-lg font-semibold text-stone-800 mb-4">{title}</h3>
      {list.length === 0 ? (
        <p className="text-stone-500 text-sm">No items found.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, i) => (
            <li key={i} className="text-stone-700 text-sm leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
