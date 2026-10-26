<script setup lang="ts">
import type { Chart } from 'chart.js';
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { dataset, installsChart, type Point } from './chart';

export interface VersionStats {
    version: string;
    url: string;
}

const props = defineProps<{ versions: VersionStats[] }>();

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const current = ref<string>();
const loading = ref(false);
const error = ref(false);
let chart: Chart<'line', Point[]> | undefined;

async function select(version: VersionStats): Promise<void> {
    current.value = version.version;
    loading.value = true;
    error.value = false;
    try {
        const response = await fetch(version.url, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const points = (await response.json()) as Point[];
        // an answer for a version the user already left must not overwrite the chart
        if (current.value !== version.version || !chart) {
            return;
        }
        chart.data.datasets = [dataset(version.version, points)];
        chart.update();
    } catch {
        error.value = true;
    } finally {
        if (current.value === version.version) {
            loading.value = false;
        }
    }
}

onMounted(() => {
    if (canvas.value) {
        chart = installsChart(canvas.value, '', []);
    }
    if (props.versions[0]) {
        void select(props.versions[0]);
    }
});

onBeforeUnmount(() => chart?.destroy());
</script>

<template>
    <div class="grid gap-4 md:grid-cols-[12rem_1fr]">
        <div>
            <p class="font-medium">Versions</p>
            <ul class="max-h-96 space-y-1 overflow-y-auto">
                <li v-for="version in versions" :key="version.version">
                    <button
                        type="button"
                        class="cursor-pointer text-left text-brand-600 hover:underline"
                        :class="{ 'font-semibold underline': version.version === current }"
                        :aria-pressed="version.version === current"
                        @click="select(version)"
                    >
                        {{ version.version }}
                    </button>
                </li>
            </ul>
        </div>
        <div>
            <p v-if="error" class="alert alert-danger">Could not load the statistics of {{ current }}.</p>
            <div class="relative h-72 sm:h-96" :class="{ 'opacity-50': loading }" :aria-busy="loading">
                <canvas ref="canvas" role="img" :aria-label="`Daily installs of ${current ?? 'a version'}`"></canvas>
            </div>
        </div>
    </div>
</template>
