import { afterEach, describe, expect, it, vi } from 'vitest';
import { initNavigate } from './navigate';

let dispose = () => {};

afterEach(() => dispose());

describe('navigate', () => {
    it('goes to the URL of the chosen option, encoded', () => {
        document.body.innerHTML = `
            <select data-navigate-url="/organization/acme/package/new/{value}">
                <option value="">select</option><option value="git">Git</option><option value="a b">odd</option>
            </select>
            <select id="plain"><option value="x">x</option></select>`;
        const go = vi.fn();
        dispose = initNavigate(document, go);
        const select = document.querySelector('select')!;

        select.value = 'a b';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        document.getElementById('plain')!.dispatchEvent(new Event('change', { bubbles: true }));

        expect(go.mock.calls).toEqual([['/organization/acme/package/new/a%20b']]);
    });
});
