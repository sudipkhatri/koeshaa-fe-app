/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Colours, radii, font sizes and families come from @keoshaa/tokens (replace, never extend).
  theme: require("./tailwind.theme.generated.js"),
  plugins: [],
};
