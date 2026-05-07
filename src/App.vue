<template>
    <crop-water-page v-if="isCropWaterRequirement"/>
    <template v-else>
        <map-view/>
        <bottom-content/>
    </template>
</template>
<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import mapView from "@/components/map-view";
import cropWaterPage from "@/components/crop-water-page.vue";
import bottomContent from '@/components/bottom-content.vue'

const route = useRoute();
const isCropWaterRequirement = computed(() => route.name === "cropWaterRequirement");
</script>
<style>
</style>

