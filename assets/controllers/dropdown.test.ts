import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initDropdowns } from './dropdown';

const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

let dispose = () => {};

afterEach(() => dispose());

describe('dropdown', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div data-dropdown id="a"><button data-dropdown-toggle>A</button>
                <div data-dropdown-menu><a href="#1">one</a><a href="#2">two</a></div></div>
            <div data-dropdown id="b"><button data-dropdown-toggle>B</button>
                <div data-dropdown-menu><a href="#3">three</a></div></div>
            <p id="outside">outside</p>`;
        dispose = initDropdowns(document);
    });

    const menu = (id: string) => document.querySelector(`#${id} [data-dropdown-menu]`)!;
    const toggle = (id: string) => document.querySelector<HTMLButtonElement>(`#${id} [data-dropdown-toggle]`)!;

    it('toggles and reports the state to assistive technology', () => {
        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
        toggle('a').click();
        expect(menu('a').classList.contains('is-open')).toBe(true);
        expect(toggle('a').getAttribute('aria-expanded')).toBe('true');
        toggle('a').click();
        expect(menu('a').classList.contains('is-open')).toBe(false);
    });

    it('keeps one menu open at a time and closes on an outside click', () => {
        toggle('a').click();
        toggle('b').click();
        expect(menu('a').classList.contains('is-open')).toBe(false);
        expect(menu('b').classList.contains('is-open')).toBe(true);
        document.getElementById('outside')!.click();
        expect(menu('b').classList.contains('is-open')).toBe(false);
    });

    it('moves focus with the arrow keys and closes on Escape', () => {
        toggle('a').focus();
        key(toggle('a'), 'ArrowDown');
        expect(menu('a').classList.contains('is-open')).toBe(true);
        expect(document.activeElement?.getAttribute('href')).toBe('#1');
        key(document.activeElement!, 'ArrowDown');
        expect(document.activeElement?.getAttribute('href')).toBe('#2');
        key(document.activeElement!, 'ArrowDown');
        expect(document.activeElement?.getAttribute('href')).toBe('#1');
        key(document.activeElement!, 'ArrowUp');
        expect(document.activeElement?.getAttribute('href')).toBe('#2');
        key(document.activeElement!, 'Escape');
        expect(menu('a').classList.contains('is-open')).toBe(false);
        expect(document.activeElement).toBe(toggle('a'));
    });
});

describe('dropdown placement', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div data-dropdown id="start"><button data-dropdown-toggle>A</button><div data-dropdown-menu><a href="#">a</a></div></div>
            <div data-dropdown id="end" data-dropdown-align="end"><button data-dropdown-toggle>B</button><div data-dropdown-menu><a href="#">b</a></div></div>`;
        dispose = initDropdowns(document);
    });

    const at = (id: string, rect: Partial<DOMRect>) => {
        document.querySelector(`#${id} [data-dropdown-toggle]`)!.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, ...rect }) as DOMRect;
    };

    it('fixes the menu under its toggle, aligned to the start or the end', () => {
        at('start', { left: 40, bottom: 100 });
        at('end', { right: 300, bottom: 50 });
        Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 });

        document.querySelector<HTMLElement>('#start [data-dropdown-toggle]')!.click();
        const start = document.querySelector<HTMLElement>('#start [data-dropdown-menu]')!.style;
        expect([start.position, start.top, start.left]).toEqual(['fixed', '104px', '40px']);

        document.querySelector<HTMLElement>('#end [data-dropdown-toggle]')!.click();
        const end = document.querySelector<HTMLElement>('#end [data-dropdown-menu]')!.style;
        expect([end.top, end.right, end.left]).toEqual(['54px', '700px', 'auto']);
    });

    it('opens upwards when the menu does not fit below its toggle', () => {
        Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 800 });
        const menu = document.querySelector<HTMLElement>('#start [data-dropdown-menu]')!;
        Object.defineProperty(menu, 'offsetHeight', { configurable: true, value: 120 });

        at('start', { left: 40, top: 760, bottom: 790 });
        document.querySelector<HTMLElement>('#start [data-dropdown-toggle]')!.click();
        expect(menu.style.top).toBe('636px');

        document.querySelector<HTMLElement>('#start [data-dropdown-toggle]')!.click();
        at('start', { left: 40, top: 100, bottom: 130 });
        document.querySelector<HTMLElement>('#start [data-dropdown-toggle]')!.click();
        expect(menu.style.top).toBe('134px');
    });

    it('closes when the page scrolls', () => {
        document.querySelector<HTMLElement>('#start [data-dropdown-toggle]')!.click();
        window.dispatchEvent(new Event('scroll'));

        expect(document.querySelector('#start [data-dropdown-menu]')!.classList.contains('is-open')).toBe(false);
    });
});
