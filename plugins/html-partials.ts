import fs from "fs/promises";
import {resolve} from 'path';
import {parseHTML} from "linkedom";
import type {Plugin, ResolvedConfig} from 'vite'

export function htmlPartials(): Plugin {
    let viteConfig: ResolvedConfig

    return {
        name: 'html-partials',
        enforce: 'pre',

        configResolved(resolvedConfig) {
            viteConfig = resolvedConfig
        },

        transformIndexHtml: {
            order: "pre",
            handler: async (html) => {
                const dom = parseHTML(html);
                // Get all partials
                const partialFileNames = await fs.readdir(resolve(viteConfig.root, "partials"));
                // process each partial
                for (const fileName of partialFileNames) {
                    const partialName = fileName.split(".").at(0);
                    const content = await fs.readFile(resolve(viteConfig.root, "partials", fileName), "utf-8");
                    if (partialName && content) {
                        const partialDom = parseHTML(content);
                        const scriptsAndStyles = partialDom.document.querySelectorAll("script, style");
                        // Copy the scripts and styles to the main dom
                        for (const el of scriptsAndStyles) {
                            dom.document.head.append(el.cloneNode(true));
                            // Remove from the partial
                            el.remove();
                        }
                        const elements = dom.document.querySelectorAll(`partial-${partialName}`);
                        for (const el of elements) {
                            el.outerHTML = partialDom.document.toString();
                        }
                    }
                }
                return dom.document.toString();
            }
        }
    }
}