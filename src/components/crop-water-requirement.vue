<template>
  <div id="bottom_right" class="crop-water-bottom">
    <button class="back-button" @click="backToMap">Back</button>

    <section class="crop-water-layout">
      <div class="crop-water-head">
        <div>
          <div class="panel-title">Crop Water Requirement Prediction</div>
          <div class="panel-subtitle">2019-04-18 to 2019-10-05 growth period</div>
        </div>

        <div class="date-pill">Current Date: {{ currentDateText }}</div>
      </div>

      <div class="crop-water-controls">
        <div class="crop-type-list">
          <div
            class="legend-item"
            :class="{ clicked: cropWaterActiveCrop === item.name }"
            v-for="item in cropTypes"
            :key="item.name"
            @click="changeCrop(item.name)"
          >
            <div class="crop-water-icon">
              <img :src="item.src" />
            </div>
            <span class="crop-water-name">{{ item.name }}</span>
          </div>
        </div>

        <button class="toggle-button" @click="toggleCylinder">
          {{ cropWaterShowCylinder ? "Hide Cylinders" : "Show Cylinders" }}
        </button>
      </div>

      <div class="slider-row">
        <span>2019-04-18</span>
        <input
          v-model="dayIndex"
          class="time-slider"
          type="range"
          :min="0"
          :max="totalDays - 1"
          step="1"
          @input="changeDate"
        />
        <span>2019-10-05</span>
      </div>

      <div class="crop-water-main">
        <div class="metric-grid">
          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'blueWater' }"
            @click="changeMetric('blueWater')"
          >
            <span>Total Blue Water</span>
            <strong>{{ currentData.blueWater }} <em>m3/t</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'greenWater' }"
            @click="changeMetric('greenWater')"
          >
            <span>Total Green Water</span>
            <strong>{{ currentData.greenWater }} <em>m3/t</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'waterFootprint' }"
            @click="changeMetric('waterFootprint')"
          >
            <span>Total Water Footprint</span>
            <strong>{{ currentData.waterFootprint }} <em>m3/t</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'irrigationWater' }"
            @click="changeMetric('irrigationWater')"
          >
            <span>Total Irrigation Water</span>
            <strong>{{ currentData.irrigationWater }} <em>m3</em></strong>
          </button>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            {{ cropWaterActiveCrop }} growth water requirement trend
          </div>

          <svg class="trend-chart" viewBox="0 0 520 150" preserveAspectRatio="none">
            <polyline class="trend-line" :points="trendPoints" />
            <line
              class="current-line"
              :x1="currentPoint.x"
              y1="16"
              :x2="currentPoint.x"
              y2="132"
            />
            <circle
              class="current-dot"
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="4.5"
            />
          </svg>

          <div class="chart-footer">
            <span>Sowing</span>
            <span>Rapid growth</span>
            <span>Maturity</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import useMapStore from "@/stores/map";

const store = useMapStore();
const router = useRouter();
const waterApiBase =
  process.env.VUE_APP_CROP_WATER_API_BASE || "http://localhost:5000";
const {
  cropWaterShowCylinder,
  cropWaterActiveMetric,
  cropWaterActiveDate,
  cropWaterActiveCrop,
  cropWaterSummaryData,
} = storeToRefs(store);

store.isShowFeautureInfo = false;

const startDate = new Date("2019-04-18");
const endDate = new Date("2019-10-05");
const dayIndex = ref(0);

const cropTypes = [
  { name: "other", src: "/img/other.png", factor: 0.75 },
  { name: "cotton", src: "/img/cotton.png", factor: 1 },
  { name: "corn", src: "/img/corn.png", factor: 1.18 },
  { name: "wheat", src: "/img/wheat.png", factor: 0.86 },
  { name: "vegetable", src: "/img/vegetable.png", factor: 1.32 },
];

const totalDays = computed(() => {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
});

const currentDate = computed(() => {
  const date = new Date(startDate);
  date.setDate(startDate.getDate() + Number(dayIndex.value));
  return date;
});

const currentDateText = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

watch(
  () => [cropWaterActiveCrop.value, cropWaterActiveDate.value],
  () => {
    loadSummaryData();
  },
  { immediate: true }
);

function changeCrop(crop) {
  cropWaterActiveCrop.value = crop;
  dayIndex.value = 0;
  changeDate();
}

function changeMetric(metric) {
  cropWaterActiveMetric.value = metric;
}

function changeDate() {
  cropWaterActiveDate.value = currentDateText.value;
}

function toggleCylinder() {
  cropWaterShowCylinder.value = !cropWaterShowCylinder.value;
}

function backToMap() {
  router.push("/cropClassification");
}

async function loadSummaryData() {
  try {
    const response = await fetch(
      `${waterApiBase}/api/water/summary/${cropWaterActiveCrop.value}/${cropWaterActiveDate.value}`
    );

    if (!response.ok) {
      throw new Error(`Summary request failed: ${response.status}`);
    }

    const result = await response.json();
    cropWaterSummaryData.value = result.data?.data ?? result.data ?? result;
  } catch (error) {
    cropWaterSummaryData.value = null;
  }
}

const currentData = computed(() => {
  if (cropWaterSummaryData.value) {
    return {
      blueWater: formatMetricValue(
        pickMetricValue(cropWaterSummaryData.value, "total_blue_water_m3", "totalBlueWaterM3")
      ),
      greenWater: formatMetricValue(
        pickMetricValue(cropWaterSummaryData.value, "total_green_water_m3", "totalGreenWaterM3")
      ),
      waterFootprint: formatMetricValue(
        pickMetricValue(
          cropWaterSummaryData.value,
          "total_water_footprint_m3",
          "totalWaterFootprintM3"
        )
      ),
      irrigationWater: formatMetricValue(
        pickMetricValue(
          cropWaterSummaryData.value,
          "total_irrigation_use_m3",
          "totalIrrigationUseM3"
        )
      ),
    };
  }

  const data = getMockData(Number(dayIndex.value));

  return {
    blueWater: data.blueWater.toFixed(2),
    greenWater: data.greenWater.toFixed(2),
    waterFootprint: data.waterFootprint.toFixed(2),
    irrigationWater: data.irrigationWater.toFixed(2),
  };
});

function pickMetricValue(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function formatMetricValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "--";
}

function getCropFactor() {
  return (
    cropTypes.find((item) => item.name === cropWaterActiveCrop.value)?.factor ?? 1
  );
}

function getMockData(index) {
  const factor = getCropFactor();
  const daily =
    (1.2 +
      Math.sin(index / 18) * 0.5 +
      Math.exp(-Math.pow((index - 145) / 55, 2)) * 4.2) *
    factor;
  const total = (index * 1.35 + Math.max(index - 80, 0) * 1.2) * factor;

  return {
    dailyWater: daily,
    blueWater: total * 0.43,
    greenWater: total * 0.57,
    waterFootprint: total * 6.2,
    irrigationWater: total * 0.86 * 0.43,
  };
}

const trendRaw = computed(() => {
  const values = [];

  for (let i = 0; i < totalDays.value; i++) {
    values.push(getMockData(i).dailyWater);
  }

  return values;
});

const trendPoints = computed(() => {
  const values = trendRaw.value;
  const max = Math.max(...values);
  const min = Math.min(...values);

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 520;
      const y = 16 + (1 - (value - min) / (max - min)) * 116;
      return `${x},${y}`;
    })
    .join(" ");
});

const currentPoint = computed(() => {
  const values = trendRaw.value;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const index = Number(dayIndex.value);
  const value = values[index];

  return {
    x: (index / (values.length - 1)) * 520,
    y: 16 + (1 - (value - min) / (max - min)) * 116,
  };
});
</script>

<style scoped>
.crop-water-bottom {
  position: absolute !important;
  top: auto !important;
  bottom: 0 !important;
  height: 36% !important;
  width: 100% !important;
  left: 0;
  right: 0;
  color: #dffaff;
  box-sizing: border-box;
  background-size: 7px 7px;
  background-color: rgb(12, 44, 54);
  background-image: -webkit-linear-gradient(-45deg,
  rgba(0, 0, 0, .2) 25%,
  transparent 25%,
  transparent 50%,
  rgba(0, 0, 0, .2) 50%,
  rgba(0, 0, 0, .2) 75%,
  transparent 75%,
  transparent);
}

.crop-water-layout {
  height: 100%;
  padding: 14px 20px 16px 140px;
  box-sizing: border-box;
}

.back-button {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  height: 48px;
  min-width: 96px;
  cursor: pointer;
  color: rgb(191, 238, 255);
  background-color: rgb(0, 35, 47);
  border: 2px solid rgb(191, 238, 255);
  font-size: 1.15rem;
}

.back-button:hover {
  background-color: rgb(191, 238, 255);
  color: rgb(0, 35, 47);
}

.crop-water-head,
.crop-water-controls,
.slider-row,
.crop-water-main {
  display: flex;
  align-items: center;
}

.crop-water-head {
  justify-content: space-between;
}

.panel-title {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

.panel-subtitle {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
}

.date-pill {
  padding: 7px 15px;
  border-radius: 999px;
  border: 1px solid rgba(255, 193, 7, 0.55);
  color: #ffc107;
  background: rgba(255, 193, 7, 0.12);
  font-weight: 700;
}

.crop-water-controls {
  margin-top: 9px;
  justify-content: space-between;
  gap: 14px;
}

.crop-type-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 12px;
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  cursor: pointer;
}

.crop-water-icon {
  width: 30px;
  height: 30px;
  margin-right: 8px;
  transition: opacity 0.3s ease;
}

.crop-water-icon img {
  width: 100%;
  height: 100%;
}

.legend-item.clicked .crop-water-icon {
  opacity: 1;
}

.legend-item:not(.clicked) .crop-water-icon {
  opacity: 0.3;
}

.crop-water-name {
  font-size: 18px;
  font-weight: 700;
  color: rgb(191, 238, 255);
}

.toggle-button {
  min-width: 132px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0, 191, 255, 0.55);
  background: rgba(0, 191, 255, 0.14);
  color: #7dd3fc;
  cursor: pointer;
  font-weight: 700;
}

.slider-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 95px 1fr 95px;
  gap: 12px;
  font-size: 12px;
  color: #cbd5e1;
}

.time-slider {
  width: 100%;
  accent-color: #ffc107;
  cursor: pointer;
}

.crop-water-main {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(340px, 0.58fr) minmax(520px, 1.42fr);
  gap: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  height: 68px;
  padding: 9px 14px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #cbd5e1;
  text-align: left;
  cursor: pointer;
}

.metric-card.active {
  border-color: rgba(255, 193, 7, 0.95);
  box-shadow: 0 0 12px rgba(255, 193, 7, 0.2);
}

.metric-card span {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
}

.metric-card strong {
  color: #ffc107;
  font-size: 20px;
}

.metric-card em {
  font-style: normal;
  font-size: 12px;
  color: #fde68a;
}

.chart-card {
  height: 146px;
  padding: 10px 14px;
  box-sizing: border-box;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.chart-title {
  color: #e5e7eb;
  font-weight: 700;
  font-size: 14px;
}

.trend-chart {
  width: 100%;
  height: 104px;
}

.trend-line {
  fill: none;
  stroke: #ffc107;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.current-line {
  stroke: rgba(255, 255, 255, 0.28);
  stroke-width: 1;
}

.current-dot {
  fill: #ffffff;
  stroke: #ffc107;
  stroke-width: 3;
}

.chart-footer {
  margin-top: -5px;
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 11px;
}
</style>
