// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pebblejunkies.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
