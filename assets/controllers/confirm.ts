// <button data-confirm-action="/url" data-confirm-method="DELETE" data-confirm-title="...">
// submits the URL through the shared #confirmation-modal <dialog> after the user agrees
export function initConfirm(root: Document = document): () => void {
    const listeners = new AbortController();
    const { signal } = listeners;
    root.addEventListener('click', (event) => {
        const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-confirm-action]');
        const dialog = root.getElementById('confirmation-modal');
        if (!trigger || !(dialog instanceof HTMLDialogElement)) {
            return;
        }
        event.preventDefault();

        const form = dialog.querySelector<HTMLFormElement>('form[data-confirm-form]');
        const method = form?.querySelector<HTMLInputElement>('input[name="_method"]');
        const title = dialog.querySelector('[data-confirm-title]');
        if (!form || !method || !title) {
            return;
        }

        form.action = trigger.dataset.confirmAction ?? '';
        method.value = trigger.dataset.confirmMethod ?? 'POST';
        title.textContent = trigger.dataset.confirmTitle ?? 'Confirm action';
        dialog.showModal();
    }, { signal });

    return () => listeners.abort();
}
