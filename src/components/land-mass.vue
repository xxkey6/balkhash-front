<template>
  <div id="bottom_right">
  <!-- <land-color/> -->
    <!-- <land-imagery/> -->
  </div>
</template>

<script setup>
import {View} from "ol";
import LandImagery from "@/components/part/land-imagery.vue";
import useMapStore from "@/stores/map";
import {storeToRefs} from "pinia";
import {onMounted} from "vue";

const store = useMapStore()
let {map} = storeToRefs(store)
const setMapView = () => {
  if (!map.value || !map.value.setView) {
    setTimeout(setMapView, 50)
    return
  }

  const view = new View({
    center: [78.25, 45.72],
    zoom: 7.15,
    projection: "EPSG:4326",
  });
  map.value.setView(view);

  store.clearMap(0)

  store.addBasicLayer('World_Imagery') // 底图改为卫星图
  store.addBasinBoundaryLayer();
  store.addAgriParcelLayer() // 农田地块

  // store.addBasinLabelLayer();
}

onMounted(setMapView);
</script>

<style scoped>

</style>
