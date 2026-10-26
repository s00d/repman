// <span data-token-group><span data-token hidden>secret</span><button data-reveal-token>Show</button></span>
export function initRevealToken(root: Document = document): () => void {
    const listeners = new AbortController();
    const { signal } = listeners;
    root.addEventListener('click', (event) => {
        const button = (event.target as Element | null)?.closest<HTMLElement>('[data-reveal-token]');
        const group = button?.closest('[data-token-group]');
        if (!button || !group) {
            return;
        }
        event.preventDefault();
        group.querySelectorAll<HTMLElement>('[data-token]').forEach((token) => {
            token.hidden = false;
        });
        button.remove();
    }, { signal });

    return () => listeners.abort();
}
