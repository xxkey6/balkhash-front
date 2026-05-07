<template>
  <div id="bottom_right">
    <!-- 地形图组件 -->
    <topographic-view />
  </div>
</template>

<script setup>
import { View } from "ol";
import TopographicView from "@/components/part/topographic-view.vue";
import useMapStore from "@/stores/map";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const store = useMapStore();
let { map } = storeToRefs(store);

// 设置地图视图中心和缩放级别
const view = new View({
  center: [(72 + 82) / 2, (42 + 50) / 2],
  zoom: 7.8,
  projection: "EPSG:4326",
});
const setMapView = () => {
  if (!map.value || !map.value.setView) {
    setTimeout(setMapView, 50);
    return;
  }

  map.value.setView(view);
  store.addBasicLayer();
  store.addBasinLayer();
};

// 初始化地形图视图的图层堆栈
// 第一层：ArcGIS 世界底图
// store.addBasicLayer();
// 第二层：流域底图（从 GeoServer 加载）
// store.addBasinLayer();

onMounted(setMapView);
</script>

<style scoped>
</style>
