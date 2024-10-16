import {resolve} from 'path';
import {defineConfig} from 'vite';
import {htmlPartials} from './plugins/html-partials';
import {replaceVariable} from './plugins/replace-variable';
import {optimiseImages} from './plugins/optimise-images';

export default defineConfig({
    root: resolve(__dirname, 'src'),
    publicDir: 'assets',
    build: {
        outDir: resolve(__dirname, 'dist'),
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
        htmlPartials(),
        replaceVariable({
            year: new Date().getFullYear().toString()
        }),
        optimiseImages({
            elements: [
                {selector: 'img', attribute: 'src'},
            ],
        })
    ],
});