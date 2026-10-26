// <div data-dropdown><button data-dropdown-toggle>..</button><div data-dropdown-menu>..links..</div></div>
// data-dropdown-align="end" lines the menu up with the right edge of the toggle
const OPEN = 'is-open';
const GAP = 4;

function menuOf(dropdown: Element): HTMLElement | null {
    return dropdown.querySelector<HTMLElement>(':scope > [data-dropdown-menu]');
}

function toggleOf(dropdown: Element): HTMLElement | null {
    return dropdown.querySelector<HTMLElement>(':scope > [data-dropdown-toggle]');
}

function items(menu: HTMLElement): HTMLElement[] {
    return [...menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
}

// the open menu is fixed to the viewport, so a scrolling table around it cannot clip it
function place(menu: HTMLElement, toggle: HTMLElement, alignEnd: boolean): void {
    const rect = toggle.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + GAP}px`;
    if (alignEnd) {
        menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
        menu.style.left = 'auto';
    } else {
        menu.style.left = `${rect.left}px`;
        menu.style.right = 'auto';
    }
}

function setOpen(dropdown: HTMLElement, open: boolean): void {
    const menu = menuOf(dropdown);
    const toggle = toggleOf(dropdown);
    if (!menu || !toggle) {
        return;
    }
    if (open) {
        place(menu, toggle, dropdown.dataset.dropdownAlign === 'end');
    }
    menu.classList.toggle(OPEN, open);
    toggle.setAttribute('aria-expanded', String(open));
}

function closeAll(root: Document, except?: Element): void {
    root.querySelectorAll<HTMLElement>(`[data-dropdown]:has(> [data-dropdown-menu].${OPEN})`).forEach((dropdown) => {
        if (dropdown !== except) {
            setOpen(dropdown, false);
        }
    });
}

export function initDropdowns(root: Document = document): () => void {
    const listeners = new AbortController();
    const { signal } = listeners;
    root.querySelectorAll('[data-dropdown-toggle]').forEach((toggle) => {
        toggle.setAttribute('aria-haspopup', 'menu');
        toggle.setAttribute('aria-expanded', 'false');
    });

    root.addEventListener('click', (event) => {
        const target = event.target as Element | null;
        const toggle = target?.closest('[data-dropdown-toggle]');
        const dropdown = toggle?.closest<HTMLElement>('[data-dropdown]');
        if (toggle && dropdown) {
            event.preventDefault();
            const open = !menuOf(dropdown)?.classList.contains(OPEN);
            closeAll(root, dropdown);
            setOpen(dropdown, open);

            return;
        }
        // a click on a menu item still navigates, the menu just closes behind it
        closeAll(root);
    }, { signal });

    // a fixed menu would float away from its toggle
    root.defaultView?.addEventListener('scroll', () => closeAll(root), { signal, capture: true, passive: true });
    root.defaultView?.addEventListener('resize', () => closeAll(root), { signal });

    root.addEventListener('keydown', (event) => {
        const dropdown = (event.target as Element | null)?.closest<HTMLElement>('[data-dropdown]');
        const menu = dropdown ? menuOf(dropdown) : null;
        if (!dropdown || !menu) {
            return;
        }
        if (event.key === 'Escape' && menu.classList.contains(OPEN)) {
            setOpen(dropdown, false);
            toggleOf(dropdown)?.focus();

            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }
        event.preventDefault();
        if (!menu.classList.contains(OPEN)) {
            closeAll(root, dropdown);
            setOpen(dropdown, true);
        }
        const list = items(menu);
        const current = list.indexOf(root.activeElement as HTMLElement);
        const next = event.key === 'ArrowDown'
            ? (current + 1) % list.length
            : (current <= 0 ? list.length : current) - 1;
        list[next]?.focus();
    }, { signal });

    return () => listeners.abort();
}
