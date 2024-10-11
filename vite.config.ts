import {resolve} from 'path';
import {defineConfig} from 'vite';
import Icons from 'unplugin-icons/vite'

export default defineConfig({
    root: resolve(__dirname, "src"),
    publicDir: "assets",
    build: {
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                imprint: resolve(__dirname, 'src/imprint/index.html'),
                privacy: resolve(__dirname, 'src/privacy/index.html')
            },
        },
    },
    plugins: [
        Icons({
            compiler: 'raw',
        }),
    ],
});