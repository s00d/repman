import { afterEach, describe, expect, it } from 'vitest';
import { initRevealToken } from './revealToken';

let dispose = () => {};

afterEach(() => dispose());

describe('revealToken', () => {
    it('shows the tokens of its own group only and drops the button', () => {
        document.body.innerHTML = `
            <div data-token-group id="one"><span data-token hidden>secret-1</span><button data-reveal-token>Show</button></div>
            <div data-token-group id="two"><span data-token hidden>secret-2</span><button data-reveal-token>Show</button></div>`;
        dispose = initRevealToken(document);

        document.querySelector<HTMLButtonElement>('#one button')!.click();

        expect(document.querySelector<HTMLElement>('#one [data-token]')!.hidden).toBe(false);
        expect(document.querySelector('#one button')).toBeNull();
        expect(document.querySelector<HTMLElement>('#two [data-token]')!.hidden).toBe(true);
    });
});
