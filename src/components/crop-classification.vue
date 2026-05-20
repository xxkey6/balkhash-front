<template>
  <div id="bottom_right">
   <crops-type/>
  </div>
</template>

<script setup>
import {View} from "ol";
import cropsType from "@/components/part/crops-type";
import useMapStore from "@/stores/map";
import {storeToRefs} from "pinia";
import {onMounted} from "vue";
const  store = useMapStore()
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

  store.clearMap(0);

  store.addBasicLayer('World_Imagery'); // 卫星底图
  store.addBasinBoundaryLayer();
  // 农作物图层
  // 具体作物图层添加方法的调用在 components/part/crops-type.vue 组件中

  // store.addBasinLabelLayer();
}

onMounted(setMapView)
</script>

<style scoped>

</style>
