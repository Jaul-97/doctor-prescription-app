// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths'; // <-- Make sure this is imported
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(), // <-- Make sure this is included here
        tailwindcss(),
    ],
});
