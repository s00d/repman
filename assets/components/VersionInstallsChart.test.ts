import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VersionInstallsChart from './VersionInstallsChart.vue';

const chart = { data: { datasets: [] as { label: string }[] }, update: vi.fn(), destroy: vi.fn() };
vi.mock('./chart', () => ({
    installsChart: () => chart,
    dataset: (label: string, data: unknown) => ({ label, data }),
}));

const versions = [
    { version: '1.1.0', url: '/stats/1.1.0?days=30' },
    { version: 'dev-feature/x', url: '/stats/dev-feature/x?days=30' },
];

function deferred() {
    let resolve!: (value: Response) => void;
    const promise = new Promise<Response>((done) => { resolve = done; });

    return { promise, resolve };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('VersionInstallsChart', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('loads the first version on mount and another on click', async () => {
        const fetch = vi.fn()
            .mockResolvedValueOnce(json([{ x: '2026-10-26', y: 3 }]))
            .mockResolvedValueOnce(json([{ x: '2026-10-26', y: 1 }]));
        vi.stubGlobal('fetch', fetch);

        const wrapper = mount(VersionInstallsChart, { props: { versions } });
        await flushPromises();
        expect(fetch).toHaveBeenLastCalledWith('/stats/1.1.0?days=30', expect.anything());
        expect(chart.data.datasets[0]!.label).toBe('1.1.0');

        await wrapper.findAll('button')[1]!.trigger('click');
        await flushPromises();
        expect(chart.data.datasets[0]!.label).toBe('dev-feature/x');
        expect(wrapper.get('[aria-pressed=true]').text()).toBe('dev-feature/x');
        wrapper.unmount();
        expect(chart.destroy).toHaveBeenCalled();
    });

    it('drops a late answer for a version the user already left', async () => {
        const slow = deferred();
        const fetch = vi.fn().mockReturnValueOnce(slow.promise).mockResolvedValueOnce(json([]));
        vi.stubGlobal('fetch', fetch);

        const wrapper = mount(VersionInstallsChart, { props: { versions } });
        await wrapper.findAll('button')[1]!.trigger('click');
        await flushPromises();
        slow.resolve(json([{ x: '2026-10-26', y: 9 }]));
        await flushPromises();

        expect(chart.data.datasets[0]!.label).toBe('dev-feature/x');
    });

    it('tells the user when the statistics cannot be loaded', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({}, 500)));

        const wrapper = mount(VersionInstallsChart, { props: { versions } });
        await flushPromises();

        expect(wrapper.get('.alert-danger').text()).toBe('Could not load the statistics of 1.1.0.');
    });
});
