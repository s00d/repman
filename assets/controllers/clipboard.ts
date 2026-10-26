// <button data-clipboard-target="#input-id"> copies the value of that input
async function copy(input: HTMLInputElement): Promise<void> {
    // navigator.clipboard only exists in secure contexts; repman often runs on plain http in a LAN
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(input.value);

            return;
        } catch {
            // denied (no permission or no user activation), the old way still works
        }
    }
    input.select();
    document.execCommand('copy');
}

export function initClipboard(root: Document = document): () => void {
    const listeners = new AbortController();
    const { signal } = listeners;
    root.addEventListener('click', (event) => {
        const button = (event.target as Element | null)?.closest<HTMLElement>('[data-clipboard-target]');
        const input = button ? root.querySelector(button.dataset.clipboardTarget ?? '') : null;
        if (!button || !(input instanceof HTMLInputElement)) {
            return;
        }
        void copy(input).then(() => {
            const title = button.title;
            button.title = 'Copied!';
            button.dataset.copied = '';
            setTimeout(() => {
                button.title = title;
                delete button.dataset.copied;
            }, 1500);
        });
    }, { signal });

    return () => listeners.abort();
}
