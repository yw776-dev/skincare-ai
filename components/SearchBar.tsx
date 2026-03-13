"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading?: boolean;
};

export default function SearchBar({
  value,
  onChange,
  onAnalyze,
  isLoading = false,
}: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a skincare product or ingredient (example: vitamin c serum)"
        className="flex-1 px-4 py-3 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
        disabled={isLoading}
        onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
      />
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading || !value.trim()}
        className="px-6 py-3 rounded-lg bg-stone-800 text-white font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center gap-2 min-w-[200px]"
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5 text-white shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoading ? "Analyzing skincare discussions..." : "Analyze"}
      </button>
    </div>
  );
}
