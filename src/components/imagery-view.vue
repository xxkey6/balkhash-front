<template>
  <div id="bottom_right">
    <time-slider/>
  </div>
</template>

<script setup>
import TimeSlider from "@/components/part/time-slider";
import {View} from 'ol'
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
    center:[(85.759192+90.764236)/2, (44.044693+44.438904)/2],
    zoom:9,
    projection: 'EPSG:4326'
  })
  map.value.setView(view)
}

onMounted(setMapView)
</script>

<style scoped>

</style>
