<script setup lang="ts">
import type { Chart } from 'chart.js';
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { installsChart, type Point } from './chart';

const props = defineProps<{ name: string; points: Point[] }>();

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
let chart: Chart<'line', Point[]> | undefined;

onMounted(() => {
    if (canvas.value) {
        chart = installsChart(canvas.value, props.name, props.points);
    }
});

onBeforeUnmount(() => chart?.destroy());
</script>

<template>
    <div class="relative h-96">
        <canvas ref="canvas" role="img" :aria-label="`Daily installs of ${name}`"></canvas>
    </div>
</template>
