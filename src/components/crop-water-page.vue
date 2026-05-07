<template>
  <div class="crop-water-page">
    <crop-water-map
      ref="cropWaterMapRef"
      @select-field="selectedField = $event"
    />
    <crop-water-field-info
      v-if="selectedField"
      :field="selectedField"
      @close="clearSelection"
    />
    <crop-water-requirement />
  </div>
</template>

<script setup>
import { ref } from "vue";
import CropWaterMap from "@/components/crop-water-map.vue";
import CropWaterFieldInfo from "@/components/crop-water-field-info.vue";
import CropWaterRequirement from "@/components/crop-water-requirement.vue";

const selectedField = ref(null);
const cropWaterMapRef = ref(null);

function clearSelection() {
  selectedField.value = null;
  cropWaterMapRef.value?.clearSelectedField();
}
</script>

<style scoped>
.crop-water-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: rgb(12, 44, 54);
}
</style>
