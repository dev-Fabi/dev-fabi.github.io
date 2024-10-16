import Path from "path";
import crypto from "crypto";
import Url from "url";
import fs from "fs/promises";
import {parseHTML} from "linkedom";
import type {Plugin, ResolvedConfig, ViteDevServer} from 'vite'
import sharp from "sharp";

export function optimiseImages(config: {
    elements: { selector: string, attribute: string }[],
    imageDir?: string,
    optOptions?: any
}): Plugin {
    let viteConfig: ResolvedConfig;
    const imageMap: Map<string, OptimizedImage> = new Map();

    return {
        name: 'optimise-images',
        enforce: 'pre',
        configResolved(resolvedConfig) {
            viteConfig = resolvedConfig
        },

        transformIndexHtml: {
            order: "pre",
            handler: async (html) => {
                const dom = parseHTML(html).document;

                for (const {selector, attribute} of config.elements) {
                    for (const element of dom.querySelectorAll<HTMLElement>(selector)) {
                        const src = element.getAttribute(attribute);
                        if (!!src) {
                            const optimizedImage = await processImage(src);
                            if (!optimizedImage) continue;
                            imageMap.set(optimizedImage.filePath, optimizedImage);
                            element.setAttribute(attribute, `/${optimizedImage.filePath}`);
                        }
                    }
                }

                return dom.toString();
            }
        },

        async closeBundle() {
            for (let [_, oi] of imageMap) {
                const outPath = Path.resolve(viteConfig.build.outDir, oi.filePath);
                await fs.mkdir(Path.dirname(outPath), {recursive: true});
                await oi.image.toFile(outPath);
            }
        },

        configureServer(server: ViteDevServer) {
            server.middlewares.use((req, res, next) => {
                const oi = imageMap.get(req.originalUrl!.slice(1));
                if (!!oi) {
                    oi.image.pipe(res);
                } else {
                    next();
                }
            })
        }
    }

    async function processImage(src: string): Promise<OptimizedImage | null> {
        const imageUrl = Url.parse(src, true);
        if (!imageUrl.pathname) return null;
        if (Object.keys(imageUrl.query).length <= 0) return null;

        const filePath = Path.resolve(viteConfig.root, decodeURI(imageUrl.pathname));
        const params = imageUrl.query;
        const sharpImage = sharp(filePath);

        let outName = Path.parse(filePath).name;
        let outExt = Path.parse(filePath).ext;

        if (params['width'] || params['height']) {
            outName += await handleResizeWidth(sharpImage, params['width'] as string, params['height'] as string)
        }
        if (params['format']) {
            outExt = await handleFormat(params['format'] as string, sharpImage, params['quality'])
        } else if (params['quality']) {
            outExt = await handleFormat(outExt, sharpImage, params.quality)
        }

        const hash = await calculateHashForBuffer(await sharpImage.toBuffer());

        return {
            filePath: Path.normalize(`${Path.dirname(src)}/${outName}-${hash.slice(0, 8)}${outExt}`),
            image: sharpImage
        }
    }

    async function calculateHashForBuffer(data: Buffer) {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }

    /** Resizing images by width */
    async function handleResizeWidth(sharpImage: sharp.Sharp, width?: string, height?: string): Promise<string> {
        const _width = width ? parseInt(width) : undefined;
        const _height = height ? parseInt(height) : undefined;
        if (_width && isNaN(_width))
            console.error(`Parameter width with value ${width} is not parsable to integer.`)
        if (_height && isNaN(_height))
            console.error(`Parameter width with value ${height} is not parsable to integer.`)
        sharpImage.resize({width: _width, height: _height});
        return (_width ? `.w${_width}` : '') + (_height ? `.h${_height}` : '');
    }

    /** Handles format conversion and quality optimization */
    async function handleFormat(format: string, sharpImage: sharp.Sharp, quality?: unknown): Promise<string> {
        const resolvedFormat = format === 'jpg' ? 'jpeg' : format;
        const parsedQuality = quality && typeof quality === 'string' ? parseInt(quality) : null;
        if (!Object.keys(sharp.format).includes(resolvedFormat))
            console.error(`Image format ${resolvedFormat} is not supported.`);
        if (parsedQuality && isNaN(parsedQuality))
            console.error(`Image quality ${quality} is not valid integer.`);
        const baseOptions = config.optOptions?.get(resolvedFormat) || {};
        const options = parsedQuality ? {...baseOptions, quality: parsedQuality} : baseOptions;
        // @ts-ignore
        sharpImage.toFormat(resolvedFormat, options);
        return (parsedQuality ? `.q${parsedQuality}` : '') + `.${resolvedFormat}`;
    }
}

interface OptimizedImage {
    filePath: string,
    image: sharp.Sharp
}