import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initConfirm } from './confirm';

let dispose = () => {};

afterEach(() => dispose());

describe('confirm', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="remove" data-confirm-action="/package/1" data-confirm-method="DELETE" data-confirm-title="Remove <b>it</b>?">x</button>
            <a id="sync" href="#" data-confirm-action="/package/1/sync">sync</a>
            <dialog id="confirmation-modal">
                <h3 data-confirm-title></h3>
                <form data-confirm-form method="post" action=""><input type="hidden" name="_method" value=""></form>
            </dialog>`;
        HTMLDialogElement.prototype.showModal = vi.fn();
    });

    it('fills the dialog form from the trigger and opens it', () => {
        dispose = initConfirm(document);
        document.getElementById('remove')!.click();

        const form = document.querySelector<HTMLFormElement>('form')!;
        expect(form.getAttribute('action')).toBe('/package/1');
        expect(form.querySelector<HTMLInputElement>('[name=_method]')!.value).toBe('DELETE');
        expect(document.querySelector('h3')!.innerHTML).toBe('Remove &lt;b&gt;it&lt;/b&gt;?');
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    });

    it('defaults to POST and a generic title, and does not follow the link', () => {
        dispose = initConfirm(document);
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        document.getElementById('sync')!.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.querySelector<HTMLInputElement>('[name=_method]')!.value).toBe('POST');
        expect(document.querySelector('h3')!.textContent).toBe('Confirm action');
    });
});
