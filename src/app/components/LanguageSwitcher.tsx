import { useI18n } from "../lib/i18n";
import { Languages } from "lucide-react";
import { useState } from "react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "zarma", label: "Zarma", flag: "🇳🇪" },
    { code: "ha", label: "Hausa", flag: "🇳🇪" },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="Changer de langue"
      >
        <Languages className="size-5" />
        <span className="text-sm font-medium">{currentLang.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg z-[100]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as typeof language);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  language === lang.code ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
                {language === lang.code && (
                  <span className="ml-auto text-indigo-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
