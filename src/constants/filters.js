export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
  { code: "fa", label: "Persian" },
];

export const RATINGS = [
  { value: "", label: "All" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
];

export const YEAR_RANGES = [
  { label: "All Years",   gte: "",     lte: ""     },
  { label: "2024–2025",   gte: "2024", lte: "2025" },
  { label: "2020–2023",   gte: "2020", lte: "2023" },
  { label: "2010–2019",   gte: "2010", lte: "2019" },
  { label: "2000–2009",   gte: "2000", lte: "2009" },
  { label: "1990–1999",   gte: "1990", lte: "1999" },
  { label: "Before 1990", gte: "1900", lte: "1989" },
];

/* TMDB watch-provider IDs, watch_region "US" — curated set of major streaming services. */
export const PROVIDERS = [
  { id: 8,    name: "Netflix" },
  { id: 9,    name: "Amazon Prime Video" },
  { id: 337,  name: "Disney+" },
  { id: 15,   name: "Hulu" },
  { id: 350,  name: "Apple TV+" },
  { id: 1899, name: "Max" },
  { id: 531,  name: "Paramount+" },
  { id: 386,  name: "Peacock" },
];

export const WATCH_REGION = "US";
