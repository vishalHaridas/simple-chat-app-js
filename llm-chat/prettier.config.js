/** @type {import('prettier').Config} */
export default {
  semi: false, // no semicolons for cleaner diffs
  singleQuote: true, // consistency with JS ecosystem
  trailingComma: 'all', // better diffs and easier edits
  printWidth: 100,
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'], // auto-sort Tailwind classes
  tailwindConfig: './tailwind.config.js',
}
