'use strict';

// English is the single supported UI resource, regardless of the application locale.
window.StreamDeckLocalization = (() => {
  let resource;
  return {
    async load() {
      if (!resource) {
        resource = fetch('../en.json').then(async (response) => {
          if (!response.ok) throw new Error('English resource unavailable');
          const locale = await response.json();
          if (!locale.Localization || !locale.Localization.inspector) throw new Error('Invalid English resource');
          return { language: 'en', strings: locale.Localization.inspector };
        });
        resource.catch(() => { resource = null; });
      }
      return resource;
    },
  };
})();
