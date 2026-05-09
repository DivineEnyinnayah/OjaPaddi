const { heroui } = require('heroui-native');
const { uniwind } = require('uniwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            accent: '#F5A623',
            'accent-foreground': '#FFFFFF',
            primary: '#1A6B3C',
            'primary-foreground': '#FFFFFF',
            default: '#E5E7EB',
            'default-foreground': '#1A1A1A',
            danger: '#E53935',
            'danger-foreground': '#FFFFFF',
            success: '#2E7D32',
            'success-foreground': '#FFFFFF',
            warning: '#F5A623',
            'warning-foreground': '#FFFFFF',
          },
        },
      },
    }),
    uniwind(),
  ],
  corePlugins: {
    preflight: false,
  },
};