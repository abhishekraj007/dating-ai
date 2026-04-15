import { useLanguage } from "@/contexts/language-context";

export const useTranslation = () => {
  const { t, language, setLanguage, supportedLanguages } = useLanguage();

  return {
    t,
    language,
    setLanguage,
    supportedLanguages,
  };
};
