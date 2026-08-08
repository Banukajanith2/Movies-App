import { createPortal } from "react-dom";
import { LANGUAGES, RATINGS, YEAR_RANGES, PROVIDERS } from "../constants/filters";

const SidebarSection = ({ title, children }) => (
  <div className="py-4 border-b border-brand-text/10 last:border-b-0">
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
      {title}
    </h3>
    {children}
  </div>
);

const CheckboxRow = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none group">
    <span
      className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
        checked
          ? "bg-accent border-accent"
          : "border-brand-text/25 group-hover:border-accent"
      }`}
    >
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      )}
    </span>
    <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    <span className="text-sm text-brand-text truncate">{label}</span>
  </label>
);

const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-brand-bg text-brand-text text-sm rounded-lg px-3 py-2 border border-brand-text/10
               focus:outline-none focus:border-accent cursor-pointer transition3s"
  >
    {children}
  </select>
);

/**
 * Reusable movie/TV discovery filter panel.
 * `categories` is caller-defined so movie and TV pages can offer different presets
 * (e.g. "Upcoming" doesn't map cleanly to a TV concept).
 */
const FilterSidebar = ({
  categories,
  category,
  onCategoryChange,
  genres,
  selectedGenres,
  onToggleGenre,
  selectedProviders,
  onToggleProvider,
  language,
  onLanguageChange,
  rating,
  onRatingChange,
  yearRange,
  onYearRangeChange,
  onReset,
  isOpen,
  onClose,
}) => {
  const panel = (
    <div className="bg-surface border border-brand-text/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-brand-text">Filters</h2>
        <button
          onClick={onReset}
          className="text-xs text-accent hover:underline cursor-pointer"
        >
          Clear All Filters
        </button>
      </div>

      <SidebarSection title="Category">
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                category === cat.value
                  ? "bg-accent text-white shadow-md"
                  : "text-brand-text hover:bg-brand-text/5"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Genres">
        <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {genres.length === 0 ? (
            <p className="text-xs text-muted">Loading genres…</p>
          ) : (
            genres.map((g) => (
              <CheckboxRow
                key={g.id}
                label={g.name}
                checked={selectedGenres.includes(g.id)}
                onChange={() => onToggleGenre(g.id)}
              />
            ))
          )}
        </div>
      </SidebarSection>

      <SidebarSection title="Streaming On">
        <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {PROVIDERS.map((p) => (
            <CheckboxRow
              key={p.id}
              label={p.name}
              checked={selectedProviders.includes(p.id)}
              onChange={() => onToggleProvider(p.id)}
            />
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Language">
        <Select value={language} onChange={onLanguageChange}>
          <option value="">All</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </Select>
      </SidebarSection>

      <SidebarSection title="Min Rating">
        <Select value={rating} onChange={onRatingChange}>
          {RATINGS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </SidebarSection>

      <SidebarSection title="Release Year">
        <Select value={yearRange} onChange={(v) => onYearRangeChange(Number(v))}>
          {YEAR_RANGES.map((yr, i) => (
            <option key={i} value={i}>{yr.label}</option>
          ))}
        </Select>
      </SidebarSection>
    </div>
  );

  return (
    <>
      {/* Desktop — sticky column, flush to the left edge of the page */}
      <aside className="hidden lg:block lg:w-64 shrink-0 sticky top-24 left-0 self-start max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
        {panel}
      </aside>

      {/* Mobile / tablet — slide-in drawer */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs p-3 animate-slide-up">
            <div className="relative h-full overflow-y-auto custom-scrollbar">
              <button
                onClick={onClose}
                className="absolute -top-1 right-1 z-10 w-8 h-8 rounded-full bg-zinc-900/80 text-white flex items-center justify-center cursor-pointer"
                aria-label="Close filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              {panel}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FilterSidebar;
