import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, Language, normalizeLanguage, translateText } from '../i18n/translate';

export type { Language };

const STORAGE_KEY = 'integritas360-language';

// Elemen yang isinya BUKAN teks antarmuka (kode, atau input pengguna).
const SKIP_TEXT_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'];
// Atribut yang aman diterjemahkan. `value` hanya untuk tombol, bukan isian pengguna.
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const TRANSLATABLE_INPUT_TYPES = ['submit', 'button', 'reset'];

const originals = new WeakMap<Node, string>();

type AttrStore = Record<string, string>;

function getAttrStore(node: Element): AttrStore {
  const existing = (node as unknown as { __i360OriginalAttrs?: AttrStore }).__i360OriginalAttrs;
  if (existing) return existing;
  const store: AttrStore = {};
  (node as unknown as { __i360OriginalAttrs?: AttrStore }).__i360OriginalAttrs = store;
  return store;
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  toggleLanguage: () => {}
});

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      // Default Bahasa Indonesia; hanya 'en' yang memindah ke English.
      return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  const setLanguage = useCallback((next: Language) => {
    const value = normalizeLanguage(next);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* abaikan */ }
    setLanguageState(value);
  }, []);

  const toggleLanguage = useCallback(
    () => setLanguage(language === 'id' ? 'en' : 'id'),
    [language, setLanguage]
  );

  useEffect(() => {
    document.documentElement.lang = language;

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!originals.has(node)) originals.set(node, node.textContent || '');
        const original = originals.get(node) || '';
        const parent = node.parentElement;
        // Catatan: OPTION sengaja TIDAK dikecualikan supaya label dropdown ikut terjemahan.
        if (parent && !SKIP_TEXT_TAGS.includes(parent.tagName) && !parent.closest('[data-no-translate]')) {
          const translated = translateText(original, language);
          if (node.textContent !== translated) node.textContent = translated;
        }
        return;
      }

      if (!(node instanceof Element)) return;
      // Jangan menerjemahkan isi textarea karena dapat berisi input pengguna,
      // tetapi placeholder/title/aria-label-nya tetap bagian dari UI dan perlu diterjemahkan.
      if (node.matches('script,style,noscript,[data-no-translate]')) return;

      for (const attr of TRANSLATABLE_ATTRS) {
        const value = node.getAttribute(attr);
        if (!value) continue;
        const store = getAttrStore(node);
        if (!(attr in store)) store[attr] = value;
        const translated = translateText(store[attr], language);
        if (node.getAttribute(attr) !== translated) node.setAttribute(attr, translated);
      }

      // Tombol <input type="submit" value="Kirim"> berisi label, jadi perlu diterjemahkan.
      // Isian <input type="text"> TIDAK pernah disentuh karena berisi data pengguna.
      if (node.tagName === 'INPUT' && TRANSLATABLE_INPUT_TYPES.includes((node.getAttribute('type') || '').toLowerCase())) {
        const value = node.getAttribute('value');
        if (value) {
          const store = getAttrStore(node);
          if (!('value' in store)) store.value = value;
          const translated = translateText(store.value, language);
          if (node.getAttribute('value') !== translated) node.setAttribute('value', translated);
        }
      }

      if (node.tagName !== 'TEXTAREA') node.childNodes.forEach(translateNode);
    };

    const run = () => {
      if (document.body) document.body.childNodes.forEach(translateNode);
    };
    run();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target);
        record.addedNodes.forEach(translateNode);
      }
    });
    if (document.body) {
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    }

    // Dialog bawaan browser juga perlu mengikuti bahasa yang dipilih.
    const oldAlert = window.alert.bind(window);
    const oldConfirm = window.confirm.bind(window);
    const oldPrompt = window.prompt.bind(window);
    window.alert = (message?: any) => oldAlert(translateText(String(message ?? ''), language));
    window.confirm = (message?: string) => oldConfirm(translateText(String(message ?? ''), language));
    window.prompt = (message?: string, defaultValue?: string) =>
      oldPrompt(translateText(String(message ?? ''), language), defaultValue);

    return () => {
      observer.disconnect();
      window.alert = oldAlert;
      window.confirm = oldConfirm;
      window.prompt = oldPrompt;
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language, setLanguage, toggleLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
