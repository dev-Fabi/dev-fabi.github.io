import './main.scss';
import '@picocss/pico';
// @ts-ignore
import MaterialSymbolsLightLightMode from '~icons/material-symbols-light/light-mode';
// @ts-ignore
import MaterialSymbolsLightDarkModeOutline from '~icons/material-symbols-light/dark-mode-outline';

document.addEventListener('DOMContentLoaded', ready, false);

interface Theme {
    id: string;
    toggleIcon: any;
    toggleText: string;
}

const THEMES: { [key: string]: Theme } = {
    dark: {
        id: 'dark',
        toggleIcon: MaterialSymbolsLightDarkModeOutline,
        toggleText: 'Switch to light mode'
    },
    light: {
        id: 'light',
        toggleIcon: MaterialSymbolsLightLightMode,
        toggleText: 'Switch to dark mode'
    },
}
const THEME_PREF_STORAGE_KEY = "theme";

const themeToggles = document.querySelectorAll<HTMLElement>('.theme-toggle');

function ready() {
    setThemeByUserPref();
}

function setThemeByUserPref() {
    const savedTheme: string | null = localStorage.getItem(THEME_PREF_STORAGE_KEY);
    if (!!savedTheme) {
        setTheme(THEMES[savedTheme]);
    } else if (!!window.matchMedia) {
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.dark : THEMES.light)
    } else {
        setTheme(THEMES.dark);
    }

    themeToggles.forEach((toggle) => {
        toggle.addEventListener('click', toggleTheme, {capture: true});
    });
}

function toggleTheme(event: any) {
    const toggle = event.currentTarget
    if (toggle.dataset[THEME_PREF_STORAGE_KEY] === THEMES.dark.id) {
        setThemeAndStore(THEMES.light);
    } else if (toggle.dataset[THEME_PREF_STORAGE_KEY] === THEMES.light.id) {
        setThemeAndStore(THEMES.dark);
    }
}

function setTheme(themeToSet: Theme) {
    document.querySelector("html")!.dataset['theme'] = themeToSet.id; // Switch pico theme
    themeToggles.forEach((toggle) => {
        toggle.dataset[THEME_PREF_STORAGE_KEY] = themeToSet.id;
        toggle.querySelector("a")!!.innerHTML = themeToSet.toggleIcon;
        toggle.querySelector("span")!!.textContent = themeToSet.toggleText;
    });
}

function setThemeAndStore(themeToSet: Theme) {
    setTheme(themeToSet);
    localStorage.setItem(THEME_PREF_STORAGE_KEY, themeToSet.id);
}
