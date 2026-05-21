<template>
  <div id="bottom_right" class="crop-water-bottom">
    <button class="back-button" @click="backToMap">Back</button>

    <section class="crop-water-layout">
      <div class="crop-water-head">
        <div>
          <div class="panel-title">Crop Water Requirement Prediction</div>
         
        </div>

        <div class="date-pill">Current Date: {{ currentDateText }}</div>
      </div>

      <div class="crop-water-controls">
        <div class="crop-type-list">
          <button
            class="legend-item"
            :class="{ clicked: cropWaterActiveCrop === item.name }"
            v-for="item in cropTypes"
            :key="item.name"
            type="button"
            @click="changeCrop(item.name)"
          >
            <span
              class="crop-water-color"
              :style="{ backgroundColor: item.color }"
            ></span>
            <span class="crop-water-name">{{ item.name }}</span>
          </button>
        </div>

        <button class="toggle-button" type="button" @click="toggleCylinder">
          {{ cropWaterShowCylinder ? "Hide Cylinders" : "Show Cylinders" }}
        </button>
        <button
          class="toggle-button"
          :class="{ active: cropWaterLockViewport }"
          type="button"
          @click="toggleViewportLock"
        >
          {{ cropWaterLockViewport ? "Fixed" : "Unfixed" }}
        </button>
      </div>

      <div class="slider-row">
        <span>{{ startDateText }}</span>
        <div class="time-slider-wrap">
          <input
            v-model="dayIndex"
            class="time-slider"
            :class="{ playing: cropWaterIsPlaying }"
            type="range"
            :min="0"
            :max="totalDays - 1"
            step="1"
            @input="changeDate"
          />
          <button
            class="slider-play-thumb"
            :class="{
              playing: cropWaterIsPlaying,
              dragging: isThumbDragging,
            }"
            :style="{ left: sliderThumbLeft }"
            type="button"
            :aria-label="cropWaterIsPlaying ? 'Pause playback' : 'Play timeline'"
            @pointerdown.prevent.stop="handleThumbPointerDown"
          ></button>
        </div>
        <span>{{ endDateText }}</span>
      </div>

      <div class="crop-water-main">
        <div class="metric-grid">
          <button
            class="metric-card metric-card-static"
            type="button"
          >
            <span>Blue Water Footprint</span>
            <strong>{{ currentData.blueWater }} <em>m3/t</em></strong>
          </button>

          <button
            class="metric-card metric-card-static"
            type="button"
          >
            <span>Green Water Footprint</span>
            <strong>{{ currentData.greenWater }} <em>m3/t</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'waterFootprint' }"
            :style="totalWaterCardStyle"
            @click="changeMetric('waterFootprint')"
          >
            <span>Total Water</span>
            <strong>{{ currentData.totalWater }} <em>m3</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'irrigationWater' }"
            @click="changeMetric('irrigationWater')"
          >
            <span>Total Irrigation Water</span>
            <strong>{{ currentData.irrigationWater }} <em>m3</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'blueWater' }"
            type="button"
            @click="changeMetric('blueWater')"
          >
            <span>Total Blue Water</span>
            <strong>{{ currentData.totalBlueWater }} <em>m3</em></strong>
          </button>

          <button
            class="metric-card"
            :class="{ active: cropWaterActiveMetric === 'greenWater' }"
            type="button"
            @click="changeMetric('greenWater')"
          >
            <span>Total Green Water</span>
            <strong>{{ currentData.totalGreenWater }} <em>m3</em></strong>
          </button>
        </div>

        <div class="chart-card">
          <div class="chart-title-row">
            <div class="chart-title">Crop Water Dynamic Process</div>
            <div class="chart-legend">
              <span class="legend-bar">Daily Water Requirement</span>
              <span class="legend-line">Cumulative Water Requirement</span>
            </div>
          </div>

          <svg class="trend-chart" viewBox="0 0 520 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="stageGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stop-color="rgba(56, 189, 248, 0.1)" />
                <stop offset="52%" stop-color="rgba(34, 197, 94, 0.12)" />
                <stop offset="100%" stop-color="rgba(245, 158, 11, 0.1)" />
              </linearGradient>
              <linearGradient id="etaBarGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(125, 211, 252, 0.82)" />
                <stop offset="100%" stop-color="rgba(14, 165, 233, 0.18)" />
              </linearGradient>
              <filter id="cumulativeGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect x="0" y="0" width="520" height="150" fill="url(#stageGradient)" />
            <rect
              v-for="stage in stageBands"
              :key="stage.name"
              class="stage-band"
              :x="stage.x"
              y="15"
              :width="stage.width"
              height="116"
            />
            <line class="chart-axis" x1="0" y1="132" x2="520" y2="132" />

            <g>
              <rect
                v-for="bar in dailyBars"
                :key="bar.date"
                class="daily-bar"
                :x="bar.x"
                :y="bar.y"
                :width="bar.width"
                :height="bar.height"
              />
            </g>

            <path class="cumulative-line" :d="cumulativePath" />
            <line
              class="current-line"
              :x1="currentPoint.x"
              y1="14"
              :x2="currentPoint.x"
              y2="132"
            />
            <circle
              class="current-dot"
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="5"
            />
            <circle
              class="current-dot-pulse"
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="9"
            />

            <g v-if="hoveredChartPoint" class="hover-marker">
              <line
                :x1="hoveredChartPoint.x"
                y1="14"
                :x2="hoveredChartPoint.x"
                y2="132"
              />
              <circle :cx="hoveredChartPoint.x" :cy="hoveredChartPoint.y" r="4.5" />
            </g>

            <rect
              v-for="hit in chartHitAreas"
              :key="hit.date"
              class="chart-hit-area"
              :x="hit.x"
              y="0"
              :width="hit.width"
              height="150"
              @mouseenter="setChartHover(hit.index)"
              @mousemove="setChartHover(hit.index)"
              @mouseleave="clearChartHover"
            />
          </svg>

          <div class="chart-footer">
            <span>{{ startDateText }}<br />Sowing</span>
            <span>Rapid Growth</span>
            <span>{{ endDateText }}<br />Maturity</span>
          </div>

          <div
            v-if="hoveredChartPoint"
            class="chart-tooltip"
            :style="chartTooltipStyle"
          >
            <b>{{ hoveredChartPoint.date }}</b>
            <span>Daily Requirement: {{ hoveredChartPoint.dailyEta }} m3</span>
            <span>Cumulative Requirement: {{ hoveredChartPoint.cumulativeEta }} m3</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import useMapStore from "@/stores/map";

const store = useMapStore();
const router = useRouter();
const waterApiBase =
  process.env.VUE_APP_CROP_WATER_API_BASE || "http://localhost:5000";
console.info("Crop water summary API base:", waterApiBase);
const {
  cropWaterShowCylinder,
  cropWaterActiveMetric,
  cropWaterActiveDate,
  cropWaterActiveCrop,
  cropWaterViewportCrop,
  cropWaterSummaryData,
  cropWaterIsPlaying,
  cropWaterLockViewport,
} = storeToRefs(store);

store.isShowFeautureInfo = false;

const cropDateRanges = {
  wheat: { start: "2024-10-05", end: "2025-06-15" },
  corn: { start: "2025-05-10", end: "2025-10-05" },
  vegetables: { start: "2025-05-01", end: "2025-09-25" },
};
const activeCropDateRange = computed(
  () => cropDateRanges[cropWaterActiveCrop.value] || cropDateRanges.wheat
);
const startDate = computed(() => new Date(activeCropDateRange.value.start));
const endDate = computed(() => new Date(activeCropDateRange.value.end));
const startDateText = computed(() => formatDate(startDate.value));
const endDateText = computed(() => formatDate(endDate.value));
const dayIndex = ref(0);
const chartSeries = ref([]);
const hoveredChartIndex = ref(null);
const isThumbDragging = ref(false);
let chartRequestSeq = 0;
let summaryRequestSeq = 0;
let playbackTimer = null;
let thumbDragState = null;
const summaryCache = new Map();
const summaryPendingCache = new Map();

const chartWidth = 520;
const chartHeight = 150;
const chartTop = 14;
const chartBottom = 132;
const barTop = 58;

const cropTypes = [
  { name: "wheat", color: "#00FE08", factor: 0.86 },
  { name: "corn", color: "#FDFE03", factor: 1.18 },
  { name: "vegetables", color: "#9C27B0", factor: 1.08 },
];

const totalDays = computed(() => {
  const diff = endDate.value.getTime() - startDate.value.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
});

const currentDate = computed(() => {
  const date = new Date(startDate.value);
  date.setDate(startDate.value.getDate() + Number(dayIndex.value));
  return date;
});

const currentDateText = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const sliderProgress = computed(() => {
  const maxIndex = Math.max(totalDays.value - 1, 1);

  return (Number(dayIndex.value) / maxIndex) * 100;
});

const sliderThumbLeft = computed(() => {
  return `calc(17px + ${sliderProgress.value} * (100% - 34px) / 100)`;
});

watch(
  () => [cropWaterActiveCrop.value, cropWaterActiveDate.value],
  () => {
    loadSummaryData();
  },
  { immediate: true }
);

watch(
  () => [cropWaterActiveCrop.value, cropWaterActiveDate.value],
  () => {
    loadTrendSeries();
  },
  { immediate: true }
);

watch(
  () => cropWaterActiveDate.value,
  (date) => {
    const nextIndex = getDayIndexFromDate(date);

    if (Number.isFinite(nextIndex) && Number(dayIndex.value) !== nextIndex) {
      dayIndex.value = nextIndex;
    }
  }
);

watch(
  () => cropWaterActiveCrop.value,
  () => {
    const nextIndex = getDayIndexFromDate(cropWaterActiveDate.value);
    dayIndex.value = Number.isFinite(nextIndex) ? nextIndex : 0;
    cropWaterActiveDate.value = currentDateText.value;
  }
);

watch(
  () => cropWaterIsPlaying.value,
  (isPlaying) => {
    if (isPlaying) {
      startPlaybackTimer();
    } else {
      stopPlaybackTimer();
    }
  }
);

onMounted(() => {
  changeDate();
  cropWaterShowCylinder.value = false;
});

onBeforeUnmount(() => {
  cropWaterShowCylinder.value = false;
  cropWaterIsPlaying.value = false;
  stopPlaybackTimer();
  stopThumbDrag();
  chartRequestSeq++;
});

function changeCrop(crop) {
  cropWaterIsPlaying.value = false;
  stopPlaybackTimer();
  cropWaterActiveCrop.value = crop;
  cropWaterViewportCrop.value = crop;
  dayIndex.value = 0;
  cropWaterActiveDate.value = currentDateText.value;
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

function toggleViewportLock() {
  cropWaterLockViewport.value = !cropWaterLockViewport.value;

  console.info("[crop-water] viewport lock toggled", {
    locked: cropWaterLockViewport.value,
    isPlaying: cropWaterIsPlaying.value,
  });

  if (!cropWaterLockViewport.value) {
    cropWaterIsPlaying.value = true;
  }
}

function togglePlayback() {
  cropWaterIsPlaying.value = !cropWaterIsPlaying.value;

  if (cropWaterIsPlaying.value) {
    cropWaterLockViewport.value = false;
  }

  console.info("[crop-water] playback toggled", {
    isPlaying: cropWaterIsPlaying.value,
    locked: cropWaterLockViewport.value,
  });
}

function handleThumbPointerDown(event) {
  const sliderWrap = event.currentTarget?.parentElement;
  const rect = sliderWrap?.getBoundingClientRect();

  if (!rect) {
    togglePlayback();
    return;
  }

  thumbDragState = {
    startX: event.clientX,
    rect,
    moved: false,
  };
  isThumbDragging.value = true;

  window.addEventListener("pointermove", handleThumbPointerMove);
  window.addEventListener("pointerup", handleThumbPointerUp, { once: true });
}

function handleThumbPointerMove(event) {
  if (!thumbDragState) return;

  if (Math.abs(event.clientX - thumbDragState.startX) > 3) {
    thumbDragState.moved = true;
  }

  if (!thumbDragState.moved) return;

  updateDayIndexFromClientX(event.clientX, thumbDragState.rect);
}

function handleThumbPointerUp(event) {
  if (!thumbDragState) return;

  if (thumbDragState.moved) {
    updateDayIndexFromClientX(event.clientX, thumbDragState.rect);
  } else {
    togglePlayback();
  }

  stopThumbDrag();
}

function stopThumbDrag() {
  window.removeEventListener("pointermove", handleThumbPointerMove);
  window.removeEventListener("pointerup", handleThumbPointerUp);
  thumbDragState = null;
  isThumbDragging.value = false;
}

function updateDayIndexFromClientX(clientX, rect) {
  const usableWidth = Math.max(rect.width - 34, 1);
  const localX = Math.min(Math.max(clientX - rect.left - 17, 0), usableWidth);
  const ratio = localX / usableWidth;

  dayIndex.value = Math.round(ratio * (totalDays.value - 1));
  changeDate();
}

function startPlaybackTimer() {
  stopPlaybackTimer();

  playbackTimer = setInterval(() => {
    const nextIndex = Number(dayIndex.value) + 1;
    dayIndex.value = nextIndex >= totalDays.value ? 0 : nextIndex;
    changeDate();
  }, 2800);
}

function stopPlaybackTimer() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

function backToMap() {
  router.push("/cropClassification");
}

function getDayIndexFromDate(date) {
  const time = new Date(date).getTime();

  if (!Number.isFinite(time)) {
    return null;
  }

  return Math.min(
    Math.max(
      Math.round((time - startDate.value.getTime()) / (1000 * 60 * 60 * 24)),
      0
    ),
    totalDays.value - 1
  );
}

async function loadSummaryData() {
  const requestSeq = ++summaryRequestSeq;
  const crop = cropWaterActiveCrop.value;
  const date = cropWaterActiveDate.value;
  const summary = await loadSummaryByDate(crop, date, {
    log: true,
  });

  if (
    requestSeq !== summaryRequestSeq ||
    crop !== cropWaterActiveCrop.value ||
    date !== cropWaterActiveDate.value
  ) {
    return;
  }

  cropWaterSummaryData.value = summary;
  console.info("[crop-water] summary data applied", {
    crop,
    apiCrop: getSummaryApiCrop(crop),
    date,
    data: summary,
  });
}
async function loadTrendSeries() {
  const requestSeq = ++chartRequestSeq;
  const crop = cropWaterActiveCrop.value;
  const dates = buildDateList();

  if (requestSeq !== chartRequestSeq) return;

  chartSeries.value = buildFixedCropChartSeries(dates, crop);
}

async function loadSummaryByDate(crop, date, options = {}) {
  const apiCrop = getSummaryApiCrop(crop);
  const cacheKey = `${apiCrop}:${date}`;

  if (summaryCache.has(cacheKey)) {
    const cached = summaryCache.get(cacheKey);
    if (options.log) {
      console.info("Crop daily summary water API cached response:", {
        crop,
        apiCrop,
        date,
        data: cached,
      });
    }
    return cached;
  }

  if (summaryPendingCache.has(cacheKey)) {
    return summaryPendingCache.get(cacheKey);
  }

  const url = `${waterApiBase}/api/water/summary/${apiCrop}/${date}`;
  const request = fetch(url)
    .then(async (response) => {
      const result = await readApiResponseBody(response);

      if (options.log) {
        console.info("Crop daily summary water API response:", {
          crop,
          apiCrop,
          date,
          status: response.status,
          ok: response.ok,
          url,
          data: result,
        });
      }

      if (!response.ok) {
        summaryCache.set(cacheKey, null);
        return null;
      }

      const row = result?.data?.data ?? result?.data ?? result;
      console.info("[crop-water] summary row parsed", {
        crop,
        apiCrop,
        date,
        row,
      });
      summaryCache.set(cacheKey, row || null);
      return row || null;
    })
    .catch((error) => {
      if (options.log) {
        console.warn("Crop daily summary water API request failed.", error);
      }
      summaryCache.set(cacheKey, null);
      return null;
    })
    .finally(() => {
      summaryPendingCache.delete(cacheKey);
    });

  summaryPendingCache.set(cacheKey, request);
  return request;
}

function getSummaryApiCrop(crop) {
  const cropName = String(crop || "").toLowerCase();

  if (cropName === "vegetables") {
    return "potato";
  }

  return cropName;
}

async function readApiResponseBody(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function buildMockChartSeries(dates) {
  return buildFixedCropChartSeries(dates, cropWaterActiveCrop.value);
}

function buildFixedCropChartSeries(dates, crop) {
  let cumulativeEta = 0;
  const profile = getFixedCropChartProfile(crop);

  return dates.map((date, index) => {
    const progress = dates.length <= 1 ? 0 : index / (dates.length - 1);
    const normalizedDaily = getInterpolatedProfileValue(profile.points, progress);
    const dailyEta = normalizedDaily * profile.scale;
    const blueWater = dailyEta * profile.blueRatio;
    const greenWater = dailyEta - blueWater;

    cumulativeEta += dailyEta;

    return {
      date,
      dailyEta,
      blueWater,
      greenWater,
      cumulativeEta,
    };
  });
}

function getFixedCropChartProfile(crop) {
  const profiles = {
    wheat: {
      scale: 105,
      blueRatio: 0.34,
      points: [
        [0, 0.52],
        [0.1, 0.68],
        [0.22, 0.95],
        [0.34, 0.82],
        [0.48, 0.5],
        [0.64, 0.34],
        [0.78, 0.42],
        [0.9, 0.58],
        [1, 0.62],
      ],
    },
    corn: {
      scale: 150,
      blueRatio: 0.48,
      points: [
        [0, 0.28],
        [0.1, 0.4],
        [0.2, 0.62],
        [0.34, 1],
        [0.5, 0.92],
        [0.64, 0.54],
        [0.78, 0.42],
        [0.9, 0.5],
        [1, 0.38],
      ],
    },
    vegetables: {
      scale: 126,
      blueRatio: 0.44,
      points: [
        [0, 0.32],
        [0.12, 0.5],
        [0.24, 0.76],
        [0.38, 1],
        [0.54, 0.9],
        [0.7, 0.68],
        [0.84, 0.58],
        [1, 0.42],
      ],
    },
  };

  return profiles[crop] || profiles.wheat;
}

function getInterpolatedProfileValue(points, progress) {
  const t = Math.min(Math.max(Number(progress) || 0, 0), 1);

  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    if (t >= x1 && t <= x2) {
      const localT = (t - x1) / Math.max(x2 - x1, 0.0001);
      const easedT = localT * localT * (3 - 2 * localT);
      return y1 + (y2 - y1) * easedT;
    }
  }

  return points[points.length - 1]?.[1] ?? 0.5;
}

function getMockChartPoint(index) {
  const data = getMockData(index);
  const totalEta = data.totalBlueWater + data.totalGreenWater;

  return {
    dailyEta: totalEta,
    blueWater: data.totalBlueWater,
    greenWater: data.totalGreenWater,
  };
}

const currentData = computed(() => {
  const data = getMockData(Number(dayIndex.value));
  const summary = cropWaterSummaryData.value;

  return {
    blueWater: formatMetricValue(
      pickSummaryMetric(
        summary,
        () =>
          getWaterFootprintValue(
            summary,
            [
              "blue_water_footprint_m3_per_t",
              "blueWaterFootprintM3PerT",
              "blue_wf_m3_t",
              "blueWfM3T",
              "blue_water_footprint_m3_t",
            ],
            ["total_blue_water_m3", "totalBlueWaterM3"]
          ),
        data.blueWater
      )
    ),
    greenWater: formatMetricValue(
      pickSummaryMetric(
        summary,
        () =>
          getWaterFootprintValue(
            summary,
            [
              "green_water_footprint_m3_per_t",
              "greenWaterFootprintM3PerT",
              "green_wf_m3_t",
              "greenWfM3T",
              "green_water_footprint_m3_t",
            ],
            ["total_green_water_m3", "totalGreenWaterM3"]
          ),
        data.greenWater
      )
    ),
    totalWater: formatMetricValue(
      pickSummaryMetric(
        summary,
        () => getTotalWaterValue(summary),
        data.totalBlueWater + data.totalGreenWater
      )
    ),
    irrigationWater: formatMetricValue(
      pickSummaryMetric(
        summary,
        () =>
          pickMetricValue(
            summary,
            "total_irrigation_use_m3",
            "totalIrrigationUseM3",
            "total_irrigation_water_m3",
            "totalIrrigationWaterM3"
          ),
        data.irrigationWater
      )
    ),
    totalBlueWater: formatMetricValue(
      pickSummaryMetric(
        summary,
        () =>
          pickMetricValue(
            summary,
            "total_blue_water_m3",
            "totalBlueWaterM3"
          ),
        data.totalBlueWater
      )
    ),
    totalGreenWater: formatMetricValue(
      pickSummaryMetric(
        summary,
        () =>
          pickMetricValue(
            summary,
            "total_green_water_m3",
            "totalGreenWaterM3"
          ),
        data.totalGreenWater
      )
    ),
  };
});

const totalWaterMixRatio = computed(() => {
  const data = getMockData(Number(dayIndex.value));
  const summary = cropWaterSummaryData.value;
  const blue = pickSummaryMetric(
    summary,
    () => pickMetricValue(summary, "total_blue_water_m3", "totalBlueWaterM3"),
    data.totalBlueWater
  );
  const green = pickSummaryMetric(
    summary,
    () => pickMetricValue(summary, "total_green_water_m3", "totalGreenWaterM3"),
    data.totalGreenWater
  );

  return getGreenWaterRatio(blue, green);
});

const totalWaterCardStyle = computed(() => {
  const color = mixRgbColor(
    { r: 42, g: 135, b: 235 },
    { r: 42, g: 196, b: 112 },
    amplifyMixRatio(totalWaterMixRatio.value)
  );

  return {
    "--metric-accent": color,
    "--metric-accent-soft": color.replace("rgb", "rgba").replace(")", ", 0.18)"),
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

function pickSummaryMetric(source, getter, fallback) {
  if (!source) return fallback;

  const value = getter();
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getTotalWaterValue(source) {
  const blue = Number(
    pickMetricValue(source, "total_blue_water_m3", "totalBlueWaterM3")
  );
  const green = Number(
    pickMetricValue(source, "total_green_water_m3", "totalGreenWaterM3")
  );

  if (Number.isFinite(blue) || Number.isFinite(green)) {
    return (Number.isFinite(blue) ? blue : 0) + (Number.isFinite(green) ? green : 0);
  }

  return pickMetricValue(
    source,
    "total_water_footprint_m3",
    "totalWaterFootprintM3"
  );
}

function getGreenWaterRatio(blue, green) {
  const safeBlue = Number.isFinite(blue) && blue > 0 ? blue : 0;
  const safeGreen = Number.isFinite(green) && green > 0 ? green : 0;
  const total = safeBlue + safeGreen;

  return total > 0 ? safeGreen / total : 0.5;
}

function mixRgbColor(fromColor, toColor, ratio) {
  const t = Math.min(Math.max(Number(ratio) || 0, 0), 1);
  const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * t);
  const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * t);
  const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function amplifyMixRatio(ratio) {
  const t = Math.min(Math.max(Number(ratio) || 0, 0), 1);
  const stretched = Math.min(Math.max((t - 0.5) * 1.8 + 0.5, 0), 1);

  if (stretched < 0.5) {
    return Math.pow(stretched * 2, 1.45) * 0.5;
  }

  return 1 - Math.pow((1 - stretched) * 2, 1.45) * 0.5;
}

function getWaterFootprintValue(source, footprintKeys, totalWaterKeys) {
  const directValue = pickMetricValue(source, ...footprintKeys);

  if (directValue !== undefined) {
    return directValue;
  }

  const totalWater = Number(pickMetricValue(source, ...totalWaterKeys));
  const yieldValue = Number(pickMetricValue(source, "yield_t", "yieldT"));

  if (
    Number.isFinite(totalWater) &&
    Number.isFinite(yieldValue) &&
    yieldValue > 0
  ) {
    return totalWater / yieldValue;
  }

  return undefined;
}

function formatMetricValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "--";
}

function pickFiniteMetric(source, keys, fallback) {
  const value = pickMetricValue(source, ...keys);
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getCropFactor() {
  return (
    cropTypes.find((item) => item.name === cropWaterActiveCrop.value)?.factor ?? 1
  );
}

function getCropWaterCurve(crop = cropWaterActiveCrop.value) {
  const curves = {
    wheat: {
      base: 0.62,
      waves: [
        { center: 38, width: 30, height: 2.6 },
        { center: 82, width: 34, height: 4.4 },
        { center: 330, width: 42, height: 1.6 },
      ],
    },
    corn: {
      base: 0.82,
      waves: [
        { center: 122, width: 30, height: 2.2 },
        { center: 178, width: 36, height: 6.1 },
        { center: 242, width: 44, height: 2.5 },
      ],
    },
    vegetables: {
      base: 0.92,
      waves: [
        { center: 115, width: 34, height: 2.4 },
        { center: 170, width: 46, height: 4.8 },
        { center: 235, width: 42, height: 2.1 },
      ],
    },
  };

  return curves[crop] || curves.wheat;
}

function getSeasonalDominantCrop(date) {
  const time = new Date(formatDate(date)).getTime();

  if (time < new Date("2025-05-01").getTime()) return "wheat";
  if (time < new Date("2025-05-10").getTime()) return "vegetables";
  if (time < new Date("2025-09-26").getTime()) return "corn";
  if (time <= new Date("2025-10-05").getTime()) return "corn";

  return "wheat";
}

/* function getMockData(index) {
  const factor = getCropFactor();
  const seasonalIndex = Number(index) % 365;
  const curve = getCropWaterCurve();
  const daily =
    (curve.base +
      Math.max(Math.sin(seasonalIndex / 17), 0) * 0.35 +
      curve.waves.reduce(
        (sum, wave) =>
          sum +
          Math.exp(-Math.pow((seasonalIndex - wave.center) / wave.width, 2)) *
            wave.height,
        0
      )) *
    factor;
  const total = (index * 1.35 + Math.max(index - 80, 0) * 1.2) * factor;

  return {
    dailyWater: daily,
    blueWater: total * 0.43,
    greenWater: total * 0.57,
    waterFootprint: total * 6.2,
    irrigationWater: total * 0.86 * 0.43,
    totalBlueWater: total * 43,
    totalGreenWater: total * 57,
  };
} */
function getMockData(index) {
  const crop = cropWaterActiveCrop.value;
  const seasonalIndex = Number(index) % 365;
  const curve = getCropWaterCurve(crop);

  const dailyEtaMm =
    curve.base +
    Math.max(Math.sin(seasonalIndex / 17), 0) * 0.35 +
    curve.waves.reduce(
      (sum, wave) =>
        sum +
        Math.exp(-Math.pow((seasonalIndex - wave.center) / wave.width, 2)) *
          wave.height,
      0
    );

  const cropAreaM2 = 52000000; // 模拟研究区当天作物面积，约52 km²
  const totalWater = dailyEtaMm / 1000 * cropAreaM2;

  const blueRatioMap = {
    wheat: 0.34,
    corn: 0.42,
    vegetables: 0.44,
  };

  const blueRatio = blueRatioMap[crop] ?? 0.42;
  const greenRatio = 1 - blueRatio;

  const totalBlueWater = totalWater * blueRatio;
  const totalGreenWater = totalWater * greenRatio;
  const irrigationWater = totalBlueWater * 1.05;

  const dailyYieldTonMap = {
    wheat: 180,
    corn: 220,
    vegetables: 160,
  };

  const dailyYieldTon = dailyYieldTonMap[crop] ?? 180;

  return {
    dailyWater: dailyEtaMm,

    blueWater: totalBlueWater / dailyYieldTon,
    greenWater: totalGreenWater / dailyYieldTon,

    totalWater,
    irrigationWater,
    totalBlueWater,
    totalGreenWater,
    waterFootprint: totalWater / dailyYieldTon,
  };
}
const activeChartSeries = computed(() =>
  chartSeries.value.length ? chartSeries.value : buildMockChartSeries(buildDateList())
);

const dailyMax = computed(() =>
  Math.max(...activeChartSeries.value.map((item) => item.dailyEta), 1)
);

const cumulativeMax = computed(() =>
  Math.max(...activeChartSeries.value.map((item) => item.cumulativeEta), 1)
);

const dailyBars = computed(() => {
  const values = activeChartSeries.value;
  const slotWidth = chartWidth / Math.max(values.length, 1);
  const barWidth = Math.max(slotWidth * 0.62, 1);

  return values.map((item, index) => {
    const height = (item.dailyEta / dailyMax.value) * (chartBottom - barTop);

    return {
      date: item.date,
      x: index * slotWidth + (slotWidth - barWidth) / 2,
      y: chartBottom - height,
      width: barWidth,
      height,
    };
  });
});

const cumulativePoints = computed(() =>
  activeChartSeries.value.map((item, index) => ({
    x: getChartX(index),
    y:
      chartTop +
      (1 - item.cumulativeEta / cumulativeMax.value) * (chartBottom - chartTop),
  }))
);

const cumulativePath = computed(() => buildSmoothPath(cumulativePoints.value));

const currentPoint = computed(() => {
  const index = Math.min(Number(dayIndex.value), activeChartSeries.value.length - 1);
  const point = cumulativePoints.value[index] ?? { x: 0, y: chartBottom };

  return {
    x: point.x,
    y: point.y,
  };
});

const stageBands = computed(() => [
  { name: "Sowing", x: 0, width: chartWidth * 0.28 },
  { name: "Rapid Growth", x: chartWidth * 0.28, width: chartWidth * 0.47 },
  { name: "Maturity", x: chartWidth * 0.75, width: chartWidth * 0.25 },
]);

const chartHitAreas = computed(() => {
  const values = activeChartSeries.value;
  const slotWidth = chartWidth / Math.max(values.length, 1);

  return values.map((item, index) => ({
    date: item.date,
    index,
    x: index * slotWidth,
    width: slotWidth,
  }));
});

const hoveredChartPoint = computed(() => {
  if (hoveredChartIndex.value === null) return null;

  const index = hoveredChartIndex.value;
  const item = activeChartSeries.value[index];
  const point = cumulativePoints.value[index];

  if (!item || !point) return null;

  return {
    x: point.x,
    y: point.y,
    date: item.date,
    dailyEta: item.dailyEta.toFixed(2),
    blueWater: item.blueWater.toFixed(2),
    greenWater: item.greenWater.toFixed(2),
    cumulativeEta: item.cumulativeEta.toFixed(2),
  };
});

const chartTooltipStyle = computed(() => {
  const point = hoveredChartPoint.value;
  if (!point) return {};

  const leftPercent = (point.x / chartWidth) * 100;

  return {
    left: `${Math.min(Math.max(leftPercent, 16), 84)}%`,
  };
});

function setChartHover(index) {
  hoveredChartIndex.value = index;
}

function clearChartHover() {
  hoveredChartIndex.value = null;
}

function buildDateList() {
  const dates = [];

  for (let i = 0; i < totalDays.value; i++) {
    dates.push(formatDate(getDateByIndex(i)));
  }

  return dates;
}

function getDateByIndex(index) {
  const date = new Date(startDate.value);
  date.setDate(startDate.value.getDate() + Number(index));
  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getChartX(index) {
  const count = Math.max(activeChartSeries.value.length - 1, 1);
  return (index / count) * chartWidth;
}

function buildSmoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const previous = points[i - 1] || current;
    const afterNext = points[i + 2] || next;
    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  return path;
}
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
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.crop-water-color {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.18);
  transition: opacity 0.3s ease;
}

.legend-item.clicked .crop-water-color {
  opacity: 1;
}

.legend-item.clicked .crop-water-name {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 204, 36, 0.42);
}

.legend-item:not(.clicked) .crop-water-color {
  opacity: 0.3;
}

.legend-item:not(.clicked) .crop-water-name {
  opacity: 0.72;
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

.toggle-button.active {
  border-color: rgba(255, 204, 36, 0.9);
  background: rgba(255, 204, 36, 0.16);
  color: #ffcc24;
}

.toggle-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.slider-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 95px minmax(0, 1fr) 95px;
  gap: 14px;
  align-items: center;
  font-size: 12px;
  color: #cbd5e1;
}

.time-slider-wrap {
  position: relative;
  height: 34px;
  display: flex;
  align-items: center;
}

.time-slider {
  width: 100%;
  height: 34px;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}

.time-slider:focus {
  outline: none;
}

.time-slider::-webkit-slider-runnable-track {
  height: 10px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(56, 189, 248, 0.95), rgba(34, 197, 94, 0.95), rgba(255, 193, 7, 0.95)),
    rgba(15, 23, 42, 0.84);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.time-slider.playing::-webkit-slider-runnable-track {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.28), transparent, rgba(255, 255, 255, 0.28)),
    linear-gradient(90deg, rgba(56, 189, 248, 0.95), rgba(34, 197, 94, 0.95), rgba(255, 193, 7, 0.95));
  background-size: 90px 10px, 100% 10px;
  animation: sliderFlow 1.1s linear infinite;
}

.time-slider::-webkit-slider-thumb {
  width: 34px;
  height: 34px;
  margin-top: -10px;
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
}

.time-slider::-moz-range-track {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8, #22c55e, #ffc107);
}

.time-slider::-moz-range-thumb {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
}

.slider-play-thumb {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 3px solid #fef3c7;
  border-radius: 50%;
  background:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 5v14l11-7z' fill='%230f172a'/%3E%3C/svg%3E") center / 15px 15px no-repeat,
    #facc15;
  box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.16), 0 0 18px rgba(250, 204, 21, 0.48);
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition:
    left 0.34s linear,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  will-change: left, transform;
}

.slider-play-thumb.playing {
  background:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 5h4v14H7zM13 5h4v14h-4z' fill='%230f172a'/%3E%3C/svg%3E") center / 15px 15px no-repeat,
    #facc15;
  animation: sliderThumbPulse 1.15s ease-in-out infinite;
}

.slider-play-thumb.dragging {
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.slider-play-thumb:hover {
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 0 0 5px rgba(250, 204, 21, 0.18), 0 0 24px rgba(250, 204, 21, 0.64);
}

@keyframes sliderFlow {
  from {
    background-position: 0 0, 0 0;
  }

  to {
    background-position: 90px 0, 0 0;
  }
}

@keyframes sliderThumbPulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.14), 0 0 18px rgba(250, 204, 21, 0.42);
  }

  50% {
    box-shadow: 0 0 0 7px rgba(250, 204, 21, 0.2), 0 0 28px rgba(250, 204, 21, 0.68);
  }
}

.crop-water-main {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(620px, 0.9fr) minmax(420px, 1.1fr);
  gap: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  border-color: var(--metric-accent, rgba(255, 193, 7, 0.95));
  box-shadow: 0 0 12px var(--metric-accent-soft, rgba(255, 193, 7, 0.2));
}

.metric-card-static {
  cursor: default;
}

.metric-card span {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
}

.metric-card strong {
  color: var(--metric-accent, #ffc107);
  font-size: 20px;
}

.metric-card em {
  font-style: normal;
  font-size: 12px;
  color: #fde68a;
}

.chart-card {
  position: relative;
  height: 146px;
  padding: 9px 14px 8px;
  box-sizing: border-box;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(17, 46, 54, 0.9)),
    rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.22);
  overflow: visible;
}

.chart-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.chart-title {
  color: #e5e7eb;
  font-weight: 700;
  font-size: 14px;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 10px;
  white-space: nowrap;
}

.chart-legend span::before {
  content: "";
  display: inline-block;
  width: 14px;
  height: 4px;
  margin-right: 5px;
  vertical-align: middle;
  border-radius: 999px;
}

.legend-bar::before {
  background: rgba(125, 211, 252, 0.8);
}

.legend-line::before {
  background: #ffc107;
  box-shadow: 0 0 8px rgba(255, 193, 7, 0.85);
}

.trend-chart {
  width: 100%;
  height: 100px;
  margin-top: 1px;
  border-radius: 6px;
  overflow: hidden;
}

.stage-band {
  fill: transparent;
  stroke: rgba(226, 232, 240, 0.08);
  stroke-width: 1;
}

.chart-axis {
  stroke: rgba(203, 213, 225, 0.35);
  stroke-width: 1;
}

.daily-bar {
  fill: url(#etaBarGradient);
  opacity: 0.78;
}

.cumulative-line {
  fill: none;
  stroke: #ffc107;
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: url(#cumulativeGlow);
}

.current-line {
  stroke: rgba(255, 255, 255, 0.36);
  stroke-width: 1;
}

.current-dot {
  fill: #ffffff;
  stroke: #ffc107;
  stroke-width: 3;
  filter: url(#cumulativeGlow);
}

.current-dot-pulse {
  fill: rgba(255, 193, 7, 0.18);
  stroke: rgba(255, 193, 7, 0.55);
  stroke-width: 1;
  transform-origin: center;
  animation: chartPulse 1.8s ease-in-out infinite;
}

.hover-marker line {
  stroke: rgba(255, 255, 255, 0.45);
  stroke-width: 1;
}

.hover-marker circle {
  fill: #0f172a;
  stroke: #ffc107;
  stroke-width: 2.5;
}

.chart-hit-area {
  fill: transparent;
  cursor: crosshair;
}

.chart-footer {
  margin-top: -8px;
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 10px;
  line-height: 1.12;
}

.chart-footer span:nth-child(2) {
  color: #cbd5e1;
}

.chart-tooltip {
  position: absolute;
  bottom: 32px;
  z-index: 4;
  min-width: 168px;
  padding: 8px 10px;
  border-radius: 8px;
  transform: translateX(-50%);
  pointer-events: none;
  color: #dffaff;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 193, 7, 0.38);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.36);
  font-size: 11px;
}

.chart-tooltip b,
.chart-tooltip span {
  display: block;
}

.chart-tooltip b {
  margin-bottom: 4px;
  color: #ffc107;
}

.chart-tooltip span {
  margin-top: 2px;
  color: #cbd5e1;
}

@keyframes chartPulse {
  0% {
    opacity: 0.75;
    transform: scale(0.7);
  }

  60% {
    opacity: 0.05;
    transform: scale(1.55);
  }

  100% {
    opacity: 0;
    transform: scale(1.75);
  }
}
</style>
