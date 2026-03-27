import { useState } from "react";

const COUNTRIES = [
  { code: "NE", name: "Niger", dial: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "ML", name: "Mali", dial: "+223", flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫" },
  { code: "SN", name: "Sénégal", dial: "+221", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "CM", name: "Cameroun", dial: "+237", flag: "🇨🇲" },
  { code: "TG", name: "Togo", dial: "+228", flag: "🇹🇬" },
  { code: "BJ", name: "Bénin", dial: "+229", flag: "🇧🇯" },
  { code: "TD", name: "Tchad", dial: "+235", flag: "🇹🇩" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "MA", name: "Maroc", dial: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", dial: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", dial: "+216", flag: "🇹🇳" },
  { code: "US", name: "États-Unis", dial: "+1", flag: "🇺🇸" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, placeholder = "XX XX XX XX" }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setOpen(false);
    onChange(`${country.dial}${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s]/g, "");
    setNumber(num);
    onChange(`${selectedCountry.dial}${num}`);
  };

  return (
    <div className="flex gap-2 relative">
      {/* Sélecteur de pays */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 border rounded-lg px-3 py-2 bg-white hover:bg-gray-50 text-sm whitespace-nowrap"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-gray-700 font-medium">{selectedCountry.dial}</span>
          <span className="text-gray-400 text-xs">▼</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 text-sm ${selectedCountry.code === country.code ? "bg-indigo-50 text-indigo-700" : "text-gray-700"}`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-gray-400">{country.dial}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Champ numéro */}
      <input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
