import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initClipboard } from './clipboard';

let dispose = () => {};

afterEach(() => dispose());

describe('clipboard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = `
            <input id="cmd" value="composer require acme/utils" readonly>
            <button data-clipboard-target="#cmd" title="Copy to clipboard"><svg></svg></button>`;
        dispose = initClipboard(document);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('writes the input value with the Clipboard API and confirms it', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('isSecureContext', true);
        vi.stubGlobal('navigator', { clipboard: { writeText } });
        const button = document.querySelector<HTMLButtonElement>('button')!;

        button.querySelector('svg')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await vi.waitFor(() => expect(button.title).toBe('Copied!'));

        expect(writeText).toHaveBeenCalledWith('composer require acme/utils');
        vi.advanceTimersByTime(1500);
        expect(button.title).toBe('Copy to clipboard');
    });

    it('falls back to execCommand when the Clipboard API refuses', async () => {
        vi.stubGlobal('isSecureContext', true);
        vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) } });
        const execCommand = vi.fn().mockReturnValue(true);
        document.execCommand = execCommand;
        const button = document.querySelector<HTMLButtonElement>('button')!;

        button.click();

        await vi.waitFor(() => expect(button.title).toBe('Copied!'));
        expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('falls back to execCommand on plain http', async () => {
        vi.stubGlobal('isSecureContext', false);
        const execCommand = vi.fn().mockReturnValue(true);
        document.execCommand = execCommand;

        document.querySelector('button')!.click();
        await vi.waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    });
});
