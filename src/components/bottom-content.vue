<template>
  <div id="bottom" :class="{ 'crop-water-mode': isCropWaterRequirement }">
    <div id="bottom_left" ref="controlBottom" v-if="!isCropWaterRequirement">
      <div class="bottom-nav">
<!--      <button class="button" :class ="clickItem===0?'active':''" id="button1" @click="changeClass(0)">Land Cover</button>-->
      <!-- <button class="button" :class ="clickItem===1||clickItem===0?'active':''" id="button2" @click="changeClass(1)">Time Series Data</button> -->
      <button class="button" :class ="clickItem===2?'active':''" id="button3" @click="changeClass(2)">Agri Parcel</button>
      <button class="button" :class ="clickItem===3?'active':''" id="button4" @click="changeClass(3)">Crop Classification</button>
      <!-- <button class="button" :class ="clickItem===4?'active':''" id="button5" @click="changeClass(4)">Topographic Map</button> -->
      <button class="button" :class ="clickItem===5?'active':''" id="button6" @click="changeClass(5)">Crop Water Requirement</button>
      </div>
    </div>
    <router-view/>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import useMapStore from "@/stores/map";
import { useRoute, useRouter } from 'vue-router'
import { computed } from "vue";

const store = useMapStore()
const router = useRouter()
const route = useRoute()

// 确保 store 中的 clickItem 可以接受 -1 或 null
let { clickItem } = storeToRefs(store)
const isCropWaterRequirement = computed(() => route.name === 'cropWaterRequirement')

const changeClass = function (i) {
  // 判断当前点击的按钮是否已经是选中状态
  if (clickItem.value === i) {
    // 取消选中状态（赋值为 -1，这样没有任何按钮的索引能匹配上）
    clickItem.value = -1;
    // 加载无按钮被点击时的特定路由（请将下方路径替换为你实际的路由）
    router.push('/');
    return; // 提前退出函数，阻止后续逻辑
  }

  // 如果点击的是未选中的按钮，正常更新状态并进行路由跳转
  clickItem.value = i;
  if (i === 0) {
    // router.push('/')
  } else if (i === 1) {
    router.push('/timeSeriesData')
  } else if (i === 2) {
    router.push('/agriParcel')
  } else if (i === 3) {
    router.push('/cropClassification')
  } else if (i === 4) {
    router.push('/topographicMap')
  } else if (i === 5) {
    router.push('/cropWaterRequirement')
  }
}
</script>

<style scoped>
.bottom-nav {
  position: absolute;
  top: 50%;
  height: 38%;
  width: 100%;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.button {
  width: 15.5%;
  min-width: 0;
  padding: 0 4px;
  font-size: 1rem;
  line-height: 1.08;
  white-space: normal;
  overflow-wrap: break-word;
}

.crop-water-mode {
  height: 36% !important;
}
</style>
