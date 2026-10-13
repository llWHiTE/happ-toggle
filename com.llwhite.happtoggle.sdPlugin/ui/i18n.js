'use strict';

// Use the same root locale resources as the manifest and the official Node SDK.
window.StreamDeckLocalization = (() => {
  const resources = new Map();
  function read(language) {
    if (!resources.has(language)) {
      resources.set(language, fetch('../' + language + '.json').then(async (response) => {
        if (!response.ok) {
          if (language !== 'en' && response.status === 404) return null;
          throw new Error('Locale resource unavailable: ' + language);
        }
        const locale = await response.json();
        if (!locale.Localization || !locale.Localization.inspector) throw new Error('Invalid locale resource: ' + language);
        return locale.Localization.inspector;
      }));
    }
    return resources.get(language);
  }
  return {
    async load(language) {
      const requested = typeof language === 'string' && /^[a-z]{2}(?:[-_][A-Za-z]{2})?$/.test(language) ? language : 'en';
      const fallback = await read('en');
      for (const candidate of new Set([requested, requested.split(/[-_]/)[0], 'en'])) {
        const strings = await read(candidate);
        if (strings) return { language: candidate.replaceAll('_', '-'), strings: { ...fallback, ...strings } };
      }
      return { language: 'en', strings: fallback };
    },
  };
})();
