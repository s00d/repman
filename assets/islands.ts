import type { Component } from 'vue';

// <div data-vue="InstallsChart" data-props='{"name": ...}'>…server-rendered fallback…</div>
// everything a component needs comes in data-props; it loads lazily, so pages without islands
// download neither Vue nor apexcharts
const components: Record<string, () => Promise<{ default: Component }>> = {
    SearchSelect: () => import('./components/SearchSelect.vue'),
    InstallsChart: () => import('./components/InstallsChart.vue'),
    VersionInstallsChart: () => import('./components/VersionInstallsChart.vue'),
};

export async function mountVueIslands(root: ParentNode = document): Promise<void> {
    const islands = [...root.querySelectorAll<HTMLElement>('[data-vue]')];
    if (islands.length === 0) {
        return;
    }
    const { createApp } = await import('vue');

    await Promise.all(islands.map(async (el) => {
        const load = components[el.dataset.vue ?? ''];
        if (!load) {
            throw new Error(`Unknown Vue component "${el.dataset.vue}"`);
        }
        const { default: component } = await load();
        createApp(component, JSON.parse(el.dataset.props ?? '{}') as Record<string, unknown>).mount(el);
    }));
}
