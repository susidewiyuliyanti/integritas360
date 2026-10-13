import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, Language, normalizeLanguage, translateText } from '../i18n/translate';

export type { Language };

const STORAGE_KEY = 'integritas360-language';

// Elemen yang isinya BUKAN teks antarmuka (kode, atau input pengguna).
const SKIP_TEXT_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'];
// Atribut yang aman diterjemahkan. `value` hanya untuk tombol, bukan isian pengguna.
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const TRANSLATABLE_INPUT_TYPES = ['submit', 'button', 'reset'];

type TextTranslationState = { original: string; translated: string };
const originals = new WeakMap<Node, TextTranslationState>();
const originalHeadValues = new WeakMap<Element, string>();
const originalDocumentTitle = typeof document === 'undefined' ? '' : document.title;

type AttrStore = Record<string, TextTranslationState>;

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

    // Head metadata lives outside document.body, so the DOM text walker cannot translate it.
    if (originalDocumentTitle) document.title = translateText(originalDocumentTitle, language);
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach((element) => {
      const meta = element as HTMLMetaElement;
      if (!originalHeadValues.has(meta)) originalHeadValues.set(meta, meta.content || '');
      meta.content = translateText(originalHeadValues.get(meta) || '', language);
    });

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const currentText = node.textContent || '';
        let state = originals.get(node);
        // React can reuse a text node for new API/D1 data. If its current value is
        // not the value we last translated, treat it as new source text.
        if (!state) {
          state = { original: currentText, translated: currentText };
          originals.set(node, state);
        } else if (currentText !== state.translated) {
          state.original = currentText;
        }
        const original = state.original;
        const parent = node.parentElement;
        // Catatan: OPTION sengaja TIDAK dikecualikan supaya label dropdown ikut terjemahan.
        if (parent && !SKIP_TEXT_TAGS.includes(parent.tagName) && !parent.closest('[data-no-translate]')) {
          const translated = translateText(original, language);
          if (node.textContent !== translated) node.textContent = translated;
          state.translated = translated;
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
        if (!(attr in store)) store[attr] = { original: value, translated: value };
        else if (value !== store[attr].translated) store[attr].original = value;
        const translated = translateText(store[attr].original, language);
        if (value !== translated) node.setAttribute(attr, translated);
        store[attr].translated = translated;
      }

      // Tombol <input type="submit" value="Kirim"> berisi label, jadi perlu diterjemahkan.
      // Isian <input type="text"> TIDAK pernah disentuh karena berisi data pengguna.
      if (node.tagName === 'INPUT' && TRANSLATABLE_INPUT_TYPES.includes((node.getAttribute('type') || '').toLowerCase())) {
        const value = node.getAttribute('value');
        if (value) {
          const store = getAttrStore(node);
          if (!('value' in store)) store.value = { original: value, translated: value };
          else if (value !== store.value.translated) store.value.original = value;
          const translated = translateText(store.value.original, language);
          if (value !== translated) node.setAttribute('value', translated);
          store.value.translated = translated;
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
        if (record.type === 'characterData' || record.type === 'attributes') translateNode(record.target);
        record.addedNodes.forEach(translateNode);
      }
    });
    if (document.body) {
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATABLE_ATTRS, 'value'] });
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
