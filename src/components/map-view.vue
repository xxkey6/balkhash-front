<template>
<div id="mapView" @wheel="handleScroll" ref="map">
  <!-- 2D/3D 切换按钮 -->
  <div class="dimension-toggle">
    <button 
      class="toggle-btn"
      :class="{ active: is2D }"
      @click="toggle2D3D"
      :title="is2D ? '切换到3D视图' : '切换到2D视图'"
    >
      {{ is2D ? '2D' : '3D' }}
    </button>
  </div>
  <transition
      leave-active-class="animate__animated animate__zoomOut"
      enter-active-class="animate__animated animate__zoomIn"
  >
  <div class="body" v-show="store.isShowFeautureInfo">
    <table style="border-collapse: collapse">
      <thead>
      <td colspan="2">要素信息</td>
      </thead>
      <tr>
      <td>要素编号</td>
      <td>{{store.featureId}}</td>
      </tr>
      <tr>
        <td>覆盖类型</td>
        <td>{{store.currentCrop}}</td>
      </tr>
      <tr>
        <td>所有者</td>
        <td>***</td>
      </tr>
    </table>
  </div>
  </transition>
</div>
</template>
<script setup>
import {storeToRefs} from "pinia";
import {getCurrentInstance, onMounted, ref} from "vue";
import {Control} from "ol/control";
import useMapStore from "@/stores/map";
import 'animate.css';
const store = useMapStore()
let {map,yearPlayer,monthPlayer,isMonthPlaying,isYearPlaying} = storeToRefs(store)

// 2D/3D 切换状态
const is2D = ref(true);

// 处理滚轮事件，停止播放动画
const handleScroll = function (){
    if (Object.getOwnPropertyNames(yearPlayer.value).length !== 1) {
      clearInterval(yearPlayer.value)
      isYearPlaying.value = false
    }
    if (Object.getOwnPropertyNames(monthPlayer.value).length !== 1) {
      clearInterval(monthPlayer.value)
      isMonthPlaying.value = false
    }
  }

// 2D/3D 切换函数
const toggle2D3D = function() {
  is2D.value = !is2D.value;
  // TODO: 实现真实的2D/3D切换功能
  // 目前仅显示按钮的切换效果
  console.log(is2D.value ? '已切换到2D视图' : '已切换到3D视图');
}

let  pageInstance = getCurrentInstance()
  onMounted(()=>{
    let timer = {}
    store.initMap()
    store.addBasicLayer()
    let tip = document.createElement('div')
    tip.id='tip'
    tip.style='height:25px;width:60px;left:50px;top:25px;position:absolute;display:none;background-color:white;border:1px solid black;line-height:25px;text-align:center'
    tip.innerHTML='hello'
    let fullMap = document.createElement('div')
    fullMap.style='height:20px;width:20px;background-color: #F0F0F0;position:absolute;left:50px;top:0;'
    let pic1 = document.createElement('img')
    pic1.src='/img/earth.png'
    pic1.style='height:100%;width:100%';
    fullMap.appendChild(pic1)
    fullMap.onclick=()=>{
      map.value.getView().setZoom(12.7)
    }
    fullMap.onmouseover=()=>{
      timer = setTimeout(()=>{
        document.getElementById('tip').style.display='block'
        document.getElementById('tip').innerHTML='地图'
        document.getElementById('tip').style.left='50px'
      },1500)
    }
    fullMap.onmouseleave=()=>{
      clearTimeout(timer)
      document.getElementById('tip').style.display='none'
    }

    let rasterMap=document.createElement('div')
    rasterMap.id='1'
    rasterMap.style='height:20px;width:20px;background-color: #F0F0F0;position:absolute;left:75px;top:0;'
    let pic2 = document.createElement('img')
    pic2.src='/img/grid.png'
    pic2.style='height:100%;width:100%';
    rasterMap.appendChild(pic2)
    rasterMap.onclick=()=>{
      map.value.getView().setZoom(14.1)
    }
    rasterMap.onmouseover=()=>{
      timer = setTimeout(()=>{
        document.getElementById('tip').style.display='block'
        document.getElementById('tip').innerHTML='栅格'
        document.getElementById('tip').style.left='75px'
      },1500)

    }
    rasterMap.onmouseleave=()=>{
      clearTimeout(timer)
      document.getElementById('tip').style.display='none'
    }
    let hand = document.createElement('div')
    hand.style='height:20px;width:20px;background-color: #F0F0F0;position:absolute;left:100px;top:0;';
    let pic3 = document.createElement('img')
    pic3.src='/img/hand.png'
    pic3.style='height:100%;width:100%';
    hand.appendChild(pic3)
    hand.onclick=()=>{
      pageInstance.refs.map.style.cursor='pointer'
    }
    hand.onmouseover=()=>{
      timer = setTimeout(()=>{
        document.getElementById('tip').style.display='block'
        document.getElementById('tip').innerHTML='手势'
        document.getElementById('tip').style.left='100px'
      },1500)
    }
    hand.onmouseleave=()=>{
      clearTimeout(timer)
      document.getElementById('tip').style.display='none'
    }
    let control1 = new Control({element:fullMap})
    let control2 = new Control({element:rasterMap})
    let control3  = new Control({element:hand})
    let control4  = new Control({element:tip})
    // map.value.addControl(control1)
    // map.value.addControl(control2)
    // map.value.addControl(control3)
    // map.value.addControl(control4)
    // new Graticule({
    //       map: map.value,
    //       strokeStyle: new Stroke({color: 'rgba(12, 12, 12, 0.8)',width: 0.6}),
    //       targetSize: 100}
    // )
  }
  )

</script>

<style scoped>
/* 2D/3D 切换按钮容器 */
.dimension-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

/* 2D/3D 切换按钮样式 */
.toggle-btn {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  background-color: #f0f0f0;
  border: 2px solid #d0d0d0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮悬停效果 */
.toggle-btn:hover {
  background-color: #e8e8e8;
  border-color: #b0b0b0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 按钮激活状态 */
.toggle-btn.active {
  background-color: #4a90e2;
  color: white;
  border-color: #3a7bc8;
}

/* 激活状态下的悬停效果 */
.toggle-btn.active:hover {
  background-color: #3a7bc8;
  box-shadow: 0 2px 8px rgba(58, 123, 200, 0.3);
}

/* 按钮点击效果 */
.toggle-btn:active {
  transform: scale(0.95);
}

.body {
  background-color: rgb(12, 44, 54);
  color: #c9d1d9;
  font-family: Arial, sans-serif;
  position: absolute;
  right:30px;
  top:30px;
  width: 300px;
  z-index: 999;
  background-image: linear-gradient(135deg, transparent 25%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 50%, transparent 50%, transparent 75%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05));
  background-size: 5px 5px;
  font-size: 20px;
  border-radius: 20px;
}
table {
  width: 80%;
  margin: 50px auto;
  border-collapse: collapse;
}
th, td {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #30363d;
}
th {
  background-color: #0d1117;
  color: #58a6ff;
  font-weight: bold;
}
tr:nth-child(even) {
  background-color: rgb(12, 44, 54);
}
tr:hover {
  background-color: rgb(6, 52, 66);
}
</style>