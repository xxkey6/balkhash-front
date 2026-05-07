<template>
  <div id="timeSlider">
    <div class="p1">
      <span class="span" style="">10M LAND COVER</span>
      <span class="span" style="color: rgb(75, 112, 125)">CHOSE A YEAR TO VIEW</span>
    </div>
    <div class="p2">
      <div style="position: relative;  top:16%;width: 100%; height: 30%;">
        <input type="range" id="year-slider" min="2018" max="2023" step="1" v-model="currentYear"  ref="year-slider"/>
        <div id="play-year-pause-button" style="height:25px;width:25px;background-color: transparent" @click="playOrStopYear">
          <img :src="isYearPlaying?'/img/24gl-pause2.png':'/img/24gl-play.png'" style="height:100%;width:100%">
        </div>
      </div>
      <div class="timeline_year" id="timeline_year">
      <span  class="month" v-for="item in yearInfo" v-bind:key="item.index" :style="item.style">{{item.name}}</span>
      </div>
      <div style="position: relative; top:20%;  width: 100%; height: 30%">
        <input type="range" id="month-slider" min="1" max="12" step="1" v-model="currentMonth"  style="width: 70%;left: 15%" ref="month-slider"/>
        <div id="play-month-pause-button" style="height:25px;width:25px;background-color: transparent" @click="playOrStopMonth">
          <img :src="isMonthPlaying?'/img/24gl-pause2.png':'/img/24gl-play.png'" style="height:100%;width:100%">
        </div>
      </div>
      <div class="timeline_month" id="timeline_month">
      <span class="month" v-for="item in monthInfo" v-bind:key="item.index" :style="item.style">{{item.name}}</span>
    </div>
  </div>
  </div>
</template>

<script setup>
import {storeToRefs} from 'pinia'
import useMapStore from "@/stores/map";
import {onBeforeUnmount, ref, watchEffect} from "vue";
    const store = useMapStore()
    store.removeCropLayerLine()
    store.removeAdministrativeLayer()
    store.removeCropImageryLayers()
    store.removeClick()
    store.isShowFeautureInfo = false
    let  {isYearPlaying,isMonthPlaying,yearInfo,monthInfo,monthPlayer,yearPlayer} = storeToRefs(store)
    let currentYear = ref(2023)
    let currentMonth = ref(5)
    store.getYearInfo()
    store.getMonthInfo()
  watchEffect(()=>{
    console.log(typeof currentMonth.value)
    currentMonth.value = (Number)(currentMonth.value)
       let currentMontFormat
        if(currentMonth.value<10){
          currentMontFormat = '0'+currentMonth.value
        }else{
          currentMontFormat = currentMonth.value+''
        }
        store.addTimeData({year:currentYear.value,month:currentMontFormat})
      })
  onBeforeUnmount(() => {
    if(isYearPlaying.value){
      clearInterval(yearPlayer.value)
    }
    if(isMonthPlaying.value){
      clearInterval(monthPlayer.value)
    }
  })
    const  playOrStopYear = function () {
      if (isYearPlaying.value) {
        clearInterval(yearPlayer.value)
        isYearPlaying.value = false
      } else {
        isYearPlaying.value = true
        store.yearPlayer = setInterval(() => {
          if (currentYear.value >= 2023) {
            currentYear.value = 2018
          } else if (currentYear.value >= 2018 && currentMonth.value <= 2023) {
            currentYear.value += 1
          }
        }, 2000)
      }
    }
      const playOrStopMonth = function () {
        if (isMonthPlaying.value) {
          clearInterval(monthPlayer.value)
          isMonthPlaying.value = false
        } else {
          isMonthPlaying.value = true
          store.monthPlayer = setInterval(() => {
            if (currentMonth.value >= 12) {
              currentMonth.value = 1
            } else if (currentMonth.value >= 1 && currentMonth.value <= 12) {
              currentMonth.value += 1
            }
          }, 2000)
        }
      }
</script>

<style>

</style>