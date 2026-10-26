import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SearchSelect from './SearchSelect.vue';

const options = [
    { value: 'Europe/Warsaw', label: 'Central European Time (Warsaw)', disabled: false },
    { value: 'Europe/London', label: 'Greenwich Mean Time (London)', disabled: false },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)', disabled: true },
    { value: 'UTC', label: 'Coordinated Universal Time', disabled: false },
];

const field = (wrapper: ReturnType<typeof mount>) => wrapper.find('select').element as HTMLSelectElement;
const selectedValues = (wrapper: ReturnType<typeof mount>) => [...field(wrapper).selectedOptions].map((option) => option.value);

describe('SearchSelect', () => {
    it('renders the form field with the initial value', () => {
        const wrapper = mount(SearchSelect, { props: { id: 'tz', name: 'timezone', options, value: ['UTC'], required: true } });

        expect(field(wrapper).name).toBe('timezone');
        expect(field(wrapper).required).toBe(true);
        expect(field(wrapper).value).toBe('UTC');
        expect(wrapper.get('#tz').text()).toBe('Coordinated Universal Time');
    });

    it('filters options and picks one with the keyboard', async () => {
        const wrapper = mount(SearchSelect, { props: { id: 'tz', name: 'timezone', options }, attachTo: document.body });
        expect(wrapper.get('#tz').text()).toBe('Select...');

        await wrapper.get('#tz').trigger('click');
        await wrapper.get('input[type=search]').setValue('N TIME');
        expect(wrapper.findAll('[role=option]').map((option) => option.text())).toEqual([
            'Central European Time (Warsaw)',
            'Greenwich Mean Time (London)',
        ]);
        await wrapper.get('input[type=search]').setValue('');

        await wrapper.get('input[type=search]').trigger('keydown', { key: 'ArrowUp' });
        await wrapper.get('input[type=search]').trigger('keydown', { key: 'Enter' });

        expect(field(wrapper).value).toBe('UTC');
        expect(wrapper.find('[role=listbox]').exists()).toBe(false);
        wrapper.unmount();
    });

    it('ignores disabled options and shows when nothing matches', async () => {
        const wrapper = mount(SearchSelect, { props: { id: 'tz', name: 'timezone', options } });
        await wrapper.get('#tz').trigger('click');

        await wrapper.get('[aria-disabled=true]').trigger('click');
        expect(field(wrapper).value).toBe('');

        await wrapper.get('input[type=search]').setValue('mars');
        expect(wrapper.get('[role=listbox]').text()).toBe('No results');
    });

    it('toggles several values and stays open in multiple mode', async () => {
        const wrapper = mount(SearchSelect, { props: { id: 'repos', name: 'repositories[]', options, multiple: true, value: ['UTC'] } });
        await wrapper.get('#repos').trigger('click');

        await wrapper.findAll('[role=option]')[0]!.trigger('click');
        await wrapper.findAll('[role=option]')[3]!.trigger('click');

        expect(selectedValues(wrapper)).toEqual(['Europe/Warsaw']);
        expect(wrapper.find('[role=listbox]').exists()).toBe(true);
        expect(wrapper.get('[role=listbox]').attributes('aria-multiselectable')).toBe('true');
    });

    it('closes on Escape and on a click outside', async () => {
        const wrapper = mount(SearchSelect, { props: { id: 'tz', name: 'timezone', options }, attachTo: document.body });
        await wrapper.get('#tz').trigger('click');
        await wrapper.get('input[type=search]').trigger('keydown', { key: 'Escape' });
        expect(wrapper.find('[role=listbox]').exists()).toBe(false);
        expect(document.activeElement?.id).toBe('tz');

        await wrapper.get('#tz').trigger('click');
        document.body.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role=listbox]').exists()).toBe(false);
        wrapper.unmount();
    });
});
