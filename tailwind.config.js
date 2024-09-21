module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        'dark': '#1a202c', // 添加一个深色背景色
      },
    },
  },
  plugins: [],
}