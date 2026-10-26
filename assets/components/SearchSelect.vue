<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';

export interface SelectOption {
    value: string;
    label: string;
    disabled: boolean;
}

// rendered by the form theme (form/tailwind_layout.html.twig, block choice_widget) for choices
// marked with the data-search-select attribute
const props = withDefaults(defineProps<{
    id: string;
    name: string;
    options: SelectOption[];
    value?: string[];
    multiple?: boolean;
    required?: boolean;
    placeholder?: string;
    invalid?: boolean;
}>(), { value: () => [], multiple: false, required: false, placeholder: 'Select...', invalid: false });

const selected = ref<string[]>([...props.value]);
// v-model of a single <select> is a string, of a multiple one an array
const fieldValue = computed({
    get: () => (props.multiple ? selected.value : (selected.value[0] ?? '')),
    set: (value: string | string[]) => {
        selected.value = Array.isArray(value) ? value : [value].filter((item) => item !== '');
    },
});

const open = ref(false);
const query = ref('');
const active = ref(0);
const root = ref<HTMLElement>();
const search = ref<HTMLInputElement>();
const list = ref<HTMLElement>();
const listId = useId();

const filtered = computed(() => {
    const needle = query.value.trim().toLowerCase();

    return needle === '' ? props.options : props.options.filter((option) => option.label.toLowerCase().includes(needle));
});

const summary = computed(() => {
    const labels = props.options.filter((option) => selected.value.includes(option.value)).map((option) => option.label);

    return labels.length > 0 ? labels.join(', ') : props.placeholder;
});

async function show(): Promise<void> {
    open.value = true;
    query.value = '';
    active.value = Math.max(0, filtered.value.findIndex((option) => selected.value.includes(option.value)));
    await nextTick();
    search.value?.focus();
    scrollToActive();
}

function hide(): void {
    open.value = false;
}

function choose(option: SelectOption | undefined): void {
    if (!option || option.disabled) {
        return;
    }
    if (!props.multiple) {
        selected.value = [option.value];
        hide();

        return;
    }
    selected.value = selected.value.includes(option.value)
        ? selected.value.filter((value) => value !== option.value)
        : [...selected.value, option.value];
}

function scrollToActive(): void {
    void nextTick(() => list.value?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' }));
}

function move(step: number): void {
    const count = filtered.value.length;
    if (count === 0) {
        return;
    }
    active.value = (active.value + step + count) % count;
    scrollToActive();
}

function onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            move(1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            move(-1);
            break;
        case 'Enter':
            event.preventDefault();
            choose(filtered.value[active.value]);
            break;
        case 'Escape':
            event.preventDefault();
            hide();
            root.value?.querySelector<HTMLElement>('[data-select-trigger]')?.focus();
            break;
        case 'Tab':
            hide();
            break;
    }
}

function onDocumentClick(event: MouseEvent): void {
    if (!root.value?.contains(event.target as Node)) {
        hide();
    }
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
    <div ref="root" class="relative" @keydown="onKeydown">
        <!-- the real form field: submitted with the form and validated by the browser -->
        <select v-model="fieldValue" :name="name" :multiple="multiple" :required="required" class="sr-only" tabindex="-1" aria-hidden="true">
            <option v-if="!multiple" value=""></option>
            <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">{{ option.label }}</option>
        </select>
        <button
            :id="id"
            type="button"
            data-select-trigger
            class="form-control flex items-center justify-between gap-2 text-left"
            :class="{ 'border-red-500': invalid }"
            role="combobox"
            :aria-expanded="open"
            :aria-controls="listId"
            @click="open ? hide() : show()"
            @keydown.down.prevent="open || show()"
        >
            <span class="truncate" :class="{ 'text-slate-400': selected.length === 0 }">{{ summary }}</span>
            <svg class="size-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
            </svg>
        </button>
        <div v-if="open" class="absolute z-40 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            <div class="border-b border-slate-100 p-2">
                <input
                    ref="search"
                    v-model="query"
                    type="search"
                    class="form-control"
                    placeholder="Search..."
                    aria-label="Search options"
                    :aria-controls="listId"
                    @input="active = 0"
                />
            </div>
            <ul :id="listId" ref="list" role="listbox" :aria-multiselectable="multiple" class="max-h-64 overflow-y-auto py-1">
                <li
                    v-for="(option, index) in filtered"
                    :key="option.value"
                    role="option"
                    :aria-selected="selected.includes(option.value)"
                    :aria-disabled="option.disabled"
                    :data-active="index === active ? '' : undefined"
                    class="flex cursor-pointer items-center gap-2 px-3 py-1.5"
                    :class="{
                        'bg-brand-50': index === active,
                        'font-semibold text-brand-700': selected.includes(option.value),
                        'cursor-not-allowed opacity-50': option.disabled,
                    }"
                    @mousemove="active = index"
                    @click="choose(option)"
                >
                    <input v-if="multiple" type="checkbox" tabindex="-1" class="pointer-events-none" :checked="selected.includes(option.value)" />
                    {{ option.label }}
                </li>
                <li v-if="filtered.length === 0" class="px-3 py-1.5 text-slate-500">No results</li>
            </ul>
        </div>
    </div>
</template>
