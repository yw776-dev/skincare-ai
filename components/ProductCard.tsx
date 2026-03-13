export type ProductRecommendation = {
  name: string;
  skin_type: string[];
  pros: string[];
  cons: string[];
};

type ProductCardProps = {
  product: ProductRecommendation;
};

export default function ProductCard({ product }: ProductCardProps) {
  const name = product?.name?.trim() || "Unknown product";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-stone-900 mb-2">
        {name}
      </h3>
      {product.skin_type?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(product.skin_type ?? []).map((st) => (
            <span
              key={st}
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700"
            >
              {st}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-3 text-sm">
        {(product.pros?.length ?? 0) > 0 && (
          <div>
            <p className="font-medium text-emerald-800 mb-1">Pros</p>
            <ul className="text-stone-600 space-y-0.5">
              {(product.pros ?? []).map((p, i) => (
                <li key={i}>• {p}</li>
              ))}
            </ul>
          </div>
        )}
        {(product.cons?.length ?? 0) > 0 && (
          <div>
            <p className="font-medium text-amber-800 mb-1">Cons</p>
            <ul className="text-stone-600 space-y-0.5">
              {(product.cons ?? []).map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        )}
        {(product.pros?.length ?? 0) === 0 && (product.cons?.length ?? 0) === 0 && (
          <p className="text-stone-500 italic">No pros/cons extracted for this product.</p>
        )}
      </div>
    </div>
  );
}
