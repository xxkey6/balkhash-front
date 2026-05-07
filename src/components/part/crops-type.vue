<template>
  <div id="landType">
    <div class="landUse_p1">
      <span class="span">LAND USE/CROP CLASSIFICATION CLASSES</span>
      <span class="span" style="color: rgb(75, 112, 125)"
        >CLICK TOTOGGLE VISIBILITY</span
      >
    </div>
    <div class="landUse_p2" id="landUse_p2">
      <div id="legend-container" class="legend-container" ref="landContent">
        <div
          class="legend-item clicked"
          v-for="item in cropInfo"
          v-bind:key="item.index"
          @click="clickItem(item.index)"
        >
          <div
            class="crop-color"
          >
            <img
              :src="item.src"
              style="width: 100%; height: 100%; border-radius: 0"
            />
          </div>
          <span style="font-size: 20px;padding:10px">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import useMapStore from "@/stores/map";
import {ref, getCurrentInstance, onMounted} from "vue";
import {storeToRefs} from "pinia";
    let pageInstance = getCurrentInstance();
    let store = useMapStore()
    const {cropInfo} = storeToRefs(store)
    const initCropLayers = () => {
      if (!store.map || !store.map.addLayer) {
        setTimeout(initCropLayers, 50)
        return
      }

      store.removeCropLayerLine()
      store.removeAdministrativeLayer()
      store.removeCropImageryLayers()
      store.addCropImageryLayers()
      store.addAdministrativeLayer();
      store.getCropInfo();
    }
    onMounted(initCropLayers)
    let clickedItem = ref(-1);
    const clickItem = (index) =>{
      if (clickedItem.value === index) {
        for (let i = 0; i < cropInfo.value.length; i++) {
          pageInstance.refs.landContent.children[i].classList.add("clicked");
        }
        clickedItem.value = -1;
        store.loadCrop(cropInfo.value);
      } else {
        for (let i = 0; i < cropInfo.value.length; i++) {
          pageInstance.refs.landContent.children[i].classList.remove("clicked");
        }
        pageInstance.refs.landContent.children[index].classList.add("clicked");
        clickedItem.value = index;
        if(index===5){
          store.removeCropLayer()
        }else{
          store.loadCrop([cropInfo.value[index]]);
        }

      }
    }
</script>

<style scoped>
.crop-color {
    width: 40px;
    height: 40px;
    margin-right: 5px;
    transition: opacity 0.3s ease; /* 添加渐变过渡效果 */
  
}

.legend-item.clicked .crop-color {
    opacity: 1; /* 点击后的按钮颜色保持不变 */
    
}

.legend-item:not(.clicked) .crop-color {
    opacity: 0.3; /* 未点击的按钮颜色变淡 */
}

/* 添加选中特效 */
.legend-item:active .crop-color {
    /*transform: scale(1.2);*/
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}
</style>
