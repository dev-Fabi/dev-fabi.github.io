import {parseHTML} from "linkedom";
import type {Plugin} from 'vite'

export function replaceVariable(data: { [key: string]: string }): Plugin {

    return {
        name: 'replace-variables',

        transformIndexHtml: {
            order: "pre",
            handler: async (html) => {
                const dom = parseHTML(html).document;
                for (const key in data) {
                    dom.querySelectorAll(`var-${key}`).forEach(el => {
                        el.outerHTML = data[key];
                    })
                }
                return dom.toString();
            }
        }
    }
}