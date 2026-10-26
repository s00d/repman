import { describe, expect, it, vi } from 'vitest';
import { mountVueIslands } from './islands';

vi.mock('./components/InstallsChart.vue', async () => {
    const { defineComponent, h } = await import('vue');

    return { default: defineComponent({ props: { name: String }, setup: (props) => () => h('p', `chart of ${props.name}`) }) };
});

describe('mountVueIslands', () => {
    it('replaces the fallback with the component, props from data-props', async () => {
        document.body.innerHTML = `<div data-vue="InstallsChart" data-props='{"name":"acme/utils"}'><noscript>fallback</noscript></div>`;

        await mountVueIslands(document);

        expect(document.querySelector('[data-vue]')!.innerHTML).toBe('<p>chart of acme/utils</p>');
    });

    it('fails loudly on an unknown component', async () => {
        document.body.innerHTML = '<div data-vue="Nope"></div>';

        await expect(mountVueIslands(document)).rejects.toThrow('Unknown Vue component "Nope"');
    });
});
