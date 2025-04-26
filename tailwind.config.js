module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-bg",
    "text-white",
    "font-oswald",
    "antialiased",
    "bg-card",
    "bg-cardAlt",
    "bg-header",
    "text-accent",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e1a",
        card: "#111827",
        cardAlt: "#0f1724",
        header: "#1a2332",
        accent: "#32a9ff",
        selected: "#3ba8ff",
        success: "#30d158",
        danger: "#ff453a",
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],  // これで十分です
        sans: ['Oswald', 'sans-serif'],  // カスタムフォントが必要であれば適宜変更
      },
      fontSize: {
        base: '0.875rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      borderRadius: {
        'default': '0.25rem',
        'lg': '0.2rem',  // より大きな丸みを設定する場合
      },
      spacing: {
        'card-gap': '0.5rem',  // カード間の隙間
      },
    },
  },
  plugins: [],
};
