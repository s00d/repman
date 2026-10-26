// <select data-navigate-url="/path/{value}"> goes to the URL of the chosen option
export function initNavigate(root: Document = document, go: (url: string) => void = (url) => window.location.assign(url)): () => void {
    const listeners = new AbortController();
    const { signal } = listeners;
    root.addEventListener('change', (event) => {
        const select = event.target;
        if (!(select instanceof HTMLSelectElement) || select.dataset.navigateUrl === undefined || select.value === '') {
            return;
        }
        go(select.dataset.navigateUrl.replace('{value}', encodeURIComponent(select.value)));
    }, { signal });

    return () => listeners.abort();
}
