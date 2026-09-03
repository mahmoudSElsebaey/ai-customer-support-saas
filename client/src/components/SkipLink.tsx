import { useTranslation } from "react-i18next";

/** Keyboard-accessible skip link to main content */
export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a href="#main-content" className="skip-link">
      {t("a11y.skipToContent", { defaultValue: "Skip to content" })}
    </a>
  );
}
