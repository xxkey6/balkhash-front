<template>
  <div ref="cesiumRef" class="map-container"></div>
  <div
    class="crop-growth-overlay"
    :class="currentGrowthIconClass"
    :style="currentGrowthIconStyle"
    :aria-label="`${currentDisplayCrop} ${currentGrowthStage}`"
  >
    <svg class="growth-svg" viewBox="0 0 96 96" aria-hidden="true">
      <g class="growth-svg-crop growth-svg-cotton">
        <path class="svg-stem svg-main-stem" d="M48 82 C48 67 48 52 50 31" />
        <path class="svg-stem svg-side-stem" d="M47 65 C39 57 35 48 34 38" />
        <path class="svg-leaf svg-leaf-left" d="M46 61 C30 52 21 54 15 64 C27 70 39 68 46 61Z" />
        <path class="svg-leaf svg-leaf-right" d="M50 52 C60 40 70 38 79 43 C72 56 60 61 50 52Z" />
        <g class="svg-head svg-cotton-boll">
          <circle cx="49" cy="25" r="10" />
          <circle cx="38" cy="30" r="9" />
          <circle cx="60" cy="31" r="9" />
          <circle cx="49" cy="37" r="9" />
        </g>
      </g>

      <g class="growth-svg-crop growth-svg-corn">
        <path class="svg-stem svg-main-stem" d="M48 86 L48 28" />
        <path class="svg-leaf svg-leaf-left" d="M47 68 C29 55 18 58 10 70 C25 78 39 77 47 68Z" />
        <path class="svg-leaf svg-leaf-right" d="M49 61 C64 49 76 50 84 60 C71 68 60 70 49 61Z" />
        <g class="svg-head svg-corn-ear">
          <path class="svg-corn-husk svg-corn-husk-left" d="M42 42 C34 53 36 68 48 78 C46 61 48 49 55 40Z" />
          <path class="svg-corn-husk svg-corn-husk-right" d="M54 40 C64 51 63 67 48 78 C54 62 54 50 45 41Z" />
          <path class="svg-corn-cob" d="M48 18 C61 24 64 43 58 58 C54 69 43 69 38 58 C31 43 36 24 48 18Z" />
          <circle class="svg-kernel" cx="46" cy="30" r="2.1" />
          <circle class="svg-kernel" cx="52" cy="34" r="2.1" />
          <circle class="svg-kernel" cx="43" cy="41" r="2.1" />
          <circle class="svg-kernel" cx="52" cy="45" r="2.1" />
          <circle class="svg-kernel" cx="43" cy="53" r="2.1" />
          <circle class="svg-kernel" cx="50" cy="57" r="2.1" />
        </g>
      </g>

      <g class="growth-svg-crop growth-svg-rice">
        <path class="svg-stem svg-main-stem" d="M45 84 C43 66 44 47 49 24" />
        <path class="svg-stem svg-side-stem" d="M53 84 C53 66 52 49 48 31" />
        <path class="svg-leaf svg-leaf-left" d="M44 66 C29 58 20 61 13 70 C27 75 38 73 44 66Z" />
        <path class="svg-leaf svg-leaf-right" d="M53 60 C67 49 78 50 87 58 C75 68 64 70 53 60Z" />
        <g class="svg-head svg-rice-panicle">
          <path class="svg-panicle-line" d="M52 22 C65 33 69 48 62 66" />
          <ellipse cx="56" cy="29" rx="4" ry="7" />
          <ellipse cx="62" cy="38" rx="4" ry="7" />
          <ellipse cx="65" cy="49" rx="4" ry="7" />
          <ellipse cx="62" cy="60" rx="4" ry="7" />
          <ellipse cx="50" cy="36" rx="4" ry="7" />
          <ellipse cx="53" cy="50" rx="4" ry="7" />
        </g>
      </g>

      <g class="growth-svg-crop growth-svg-wheat">
        <path class="svg-stem svg-main-stem" d="M48 84 L48 31" />
        <path class="svg-leaf svg-leaf-left" d="M47 67 C34 57 24 59 17 69 C30 73 40 73 47 67Z" />
        <path class="svg-leaf svg-leaf-right" d="M50 58 C63 48 74 49 82 58 C70 65 60 66 50 58Z" />
        <g class="svg-head svg-wheat-head">
          <path class="svg-panicle-line" d="M48 15 L48 49" />
          <path d="M48 20 C36 18 34 28 46 29Z" />
          <path d="M49 20 C61 18 63 28 51 29Z" />
          <path d="M48 31 C35 30 34 40 46 40Z" />
          <path d="M49 31 C62 30 63 40 51 40Z" />
          <path d="M48 42 C37 42 36 51 47 51Z" />
          <path d="M49 42 C60 42 61 51 50 51Z" />
        </g>
      </g>
    </svg>
  </div>
  <div class="season-environment-overlay" :style="seasonEnvironmentStyle"></div>
  <div class="sun-direction-overlay" :style="sunDirectionOverlayStyle"></div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import useMapStore from "@/stores/map";

const Cesium = window.Cesium;
const store = useMapStore();
const {
  cropWaterShowCylinder,
  cropWaterActiveMetric,
  cropWaterActiveDate,
  cropWaterActiveCrop,
  cropWaterViewportCrop,
  cropWaterFocusCrop,
  cropWaterFocusRequestId,
  cropWaterIsPlaying,
  cropWaterLockViewport,
} = storeToRefs(store);

const emit = defineEmits(["select-field"]);

const cesiumRef = ref(null);
const activeCrop = computed(() => cropWaterActiveCrop.value);

const sunDirectionOverlayStyle = computed(() => {
  const date = new Date(cropWaterActiveDate.value);
  const yearStart = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Number.isFinite(date.getTime())
    ? Math.floor((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    : 1;
  const seasonalAngle = 118 + Math.sin(((dayOfYear - 80) / 365) * Math.PI * 2) * 42;

  return {
    background: `linear-gradient(${seasonalAngle.toFixed(
      1
    )}deg, rgba(255, 232, 171, 0.16), rgba(255, 255, 255, 0.025) 42%, rgba(13, 31, 43, 0.12))`,
  };
});
const seasonEnvironmentStyle = computed(() => {
  const date = new Date(cropWaterActiveDate.value);
  const month = Number.isFinite(date.getTime()) ? date.getMonth() + 1 : 1;
  const cropOpacityBoost = activeCrop.value === "vegetables" ? 0.04 : 0;

  if (month >= 3 && month <= 5) {
    return {
      background:
        "linear-gradient(180deg, rgba(178, 235, 194, 0.12), rgba(255, 255, 255, 0.02))",
      opacity: 0.75 + cropOpacityBoost,
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      background:
        "linear-gradient(180deg, rgba(255, 194, 94, 0.16), rgba(255, 112, 67, 0.08))",
      opacity: 0.85 + cropOpacityBoost,
    };
  }

  if (month >= 9 && month <= 11) {
    return {
      background:
        "linear-gradient(180deg, rgba(255, 193, 7, 0.12), rgba(141, 110, 99, 0.08))",
      opacity: 0.7 + cropOpacityBoost,
    };
  }

  return {
    background:
      "linear-gradient(180deg, rgba(120, 170, 210, 0.12), rgba(20, 40, 65, 0.12))",
    opacity: 0.8 + cropOpacityBoost,
  };
});
const cropWaterDisplayLayers = [
  {
    name: "lake:split_1",
    crop: "wheat",
    aliases: ["split_1"],
  },
  {
    name: "lake:split_2",
    crop: "corn",
    aliases: ["split_2"],
  },
  {
    name: "lake:split_3",
    crop: "vegetables",
    aliases: ["split_3"],
  },
];
let activeCropWaterDisplayLayers = cropWaterDisplayLayers.map((layer) => ({ ...layer }));
const cropWaterCylinderLayers = () =>
  activeCropWaterDisplayLayers.map((layer) => layer.name);
const workspace = "lake";
const fallbackCropWaterExtent = {
  west: 80.2,
  south: 42.2,
  east: 86.4,
  north: 45.6,
};
const geoserverBase =
  process.env.VUE_APP_CROP_GEOSERVER_BASE || "http://localhost:8080/geoserver";
const waterApiBase =
  process.env.VUE_APP_CROP_WATER_API_BASE || "http://localhost:5000";
const currentDisplayCrop = computed(() => {
  if (cropWaterViewportCrop.value) {
    return cropWaterViewportCrop.value;
  }

  return cropWaterActiveCrop.value || getSeasonalDominantCrop(cropWaterActiveDate.value);
});

const currentGrowthStage = computed(() => {
  const date = new Date(cropWaterActiveDate.value)
  const month = date.getMonth() + 1

  const crop = currentDisplayCrop.value

  if (crop === 'wheat') {
    if (month <= 2 || month >= 11) return 'Dormancy'
    if (month <= 4) return 'Jointing'
    return 'Ripening'
  }

  if (crop === 'corn') {
    if (month <= 7) return 'Tasseling'
    return 'Grain Filling'
  }

  if (crop === 'vegetables') {
    if (month <= 6) return 'Vegetative'
    if (month <= 8) return 'Flowering'
    return 'Maturity'
  }

  return 'Growth'
})

const currentGrowthIconClass = computed(() => {
  const crop = currentDisplayCrop.value || "crop";
  const visualCrop = crop === "vegetables" ? "cotton" : crop;
  const stage = currentGrowthStage.value
    .toLowerCase()
    .replace(/\s+/g, "-");

  return [`growth-crop-${visualCrop}`, `growth-stage-${stage}`];
});

const currentGrowthIconStyle = computed(() => {
  const crop = currentDisplayCrop.value || "crop";
  const progress = getCropGrowthProgress(crop, cropWaterActiveDate.value);
  const easedProgress = smoothStep(0, 1, progress);
  const maturity = smoothStep(0.64, 1, progress);
  const headProgress = smoothStep(0.38, 0.82, progress);
  const flowerProgress =
    crop === "vegetables"
      ? Math.sin(clamp01((progress - 0.52) / 0.28) * Math.PI)
      : headProgress;
  const cropMaxHeight = {
    corn: 62,
    vegetables: 50,
    wheat: 54,
  }[crop] ?? 50;
  const cropMinHeight = crop === "wheat" ? 20 : 16;
  const mainHeight = cropMinHeight + (cropMaxHeight - cropMinHeight) * easedProgress;
  const mainTop = Math.max(8, 70 - mainHeight);
  const sideHeight = Math.max(12, mainHeight * (0.52 + easedProgress * 0.16));
  const leafScale = 0.46 + easedProgress * 0.7;
  const headScale = 0.55 + headProgress * 0.55;

  return {
    "--growth-progress": progress.toFixed(3),
    "--growth-main-height": `${mainHeight.toFixed(1)}px`,
    "--growth-main-top": `${mainTop.toFixed(1)}px`,
    "--growth-side-height": `${sideHeight.toFixed(1)}px`,
    "--growth-side-opacity": smoothStep(0.18, 0.52, progress).toFixed(3),
    "--growth-leaf-scale": leafScale.toFixed(3),
    "--growth-head-opacity": headProgress.toFixed(3),
    "--growth-head-scale": headScale.toFixed(3),
    "--growth-bloom-opacity": Math.max(0, flowerProgress).toFixed(3),
    "--growth-maturity": maturity.toFixed(3),
  };
});

function getSeasonalDominantCrop(dateValue) {
  const time = new Date(dateValue).getTime();

  if (time < new Date("2025-05-01").getTime()) return "wheat";
  if (time < new Date("2025-05-10").getTime()) return "vegetables";
  if (time < new Date("2025-09-26").getTime()) return "corn";
  if (time <= new Date("2025-10-05").getTime()) return "corn";

  return "wheat";
}

function getCropGrowthProgress(crop, dateValue) {
  const date = new Date(dateValue);

  if (!Number.isFinite(date.getTime())) {
    return 0;
  }

  const windows = {
    wheat: [new Date("2024-10-05"), new Date("2025-06-15")],
    corn: [new Date("2025-05-10"), new Date("2025-10-05")],
    vegetables: [new Date("2025-05-01"), new Date("2025-09-25")],
  };
  const range = windows[crop];

  if (!range) {
    return 0;
  }

  return clamp01(
    (date.getTime() - range[0].getTime()) /
      Math.max(range[1].getTime() - range[0].getTime(), 1)
  );
}

let viewer = null;
let cachedGeojson = null;
let cylinderEntities = [];
let clickHandler = null;
let selectedHighlight = null;
let cameraMoveEndRemove = null;
let refreshTimer = null;
let animationFrameId = null;
let animatedCylinderItems = [];
let visibleLabelEntities = [];
let isCylinderAnimating = false;
let waterRequestSeq = 0;
let currentWaterDataMap = new Map();
let hasInitializedCylinderLayer = false;
let isUnmounted = false;
let waterReloadTimer = null;
let cylinderRefreshTimer = null;
let lastOrbitCylinderRefreshTime = 0;
let cylinderRequestSeq = 0;
let demoCylinderItems = [];
let demoCylinderAnimationId = null;
let selectedWaterFieldId = null;
let labelLayoutFrame = 0;
let cropWaterImageryLayers = [];
let cropWaterLayerExtents = new Map();
let cropWaterDenseFocusCenters = new Map();
let seasonalOrbitFrameId = null;
let seasonalOrbitTarget = null;
let seasonalOrbitCurrent = null;
let seasonalOrbitRoute = [];
let seasonalOrbitRouteIndex = 0;
let seasonalOrbitHeading = 0;
let seasonalOrbitPitchCurrent = null;
let seasonalOrbitRollCurrent = 0;
let seasonalOrbitHeight = null;
let seasonalOrbitLastTime = 0;

const animatedCylinderSlices = 40;
const staticCylinderSlices = 32;
const cylinderWfsSrs = "EPSG:4326";
const demoCylinderCount = 140;
const demoCylinderSlices = 24;
const demoMaxCylinderHeight = 260;
const zeroValueThreshold = 0.01;
const labelValueThreshold = 0.01;
const cylinderTransitionMs = 12000;
const maxConsecutiveRandomZeroDays = 3;
const cropWaterTimelineStartDate = "2024-10-05";
const visualMaxMetricValue = 4.6;
const minNonZeroCylinderHeight = 46;
const cylinderVisualGamma = 0.52;
const cylinderVisualRadius = 16;
const demoCylinderRadius = cylinderVisualRadius;
const allCylinderFeatureThreshold = 260;
const sampledCylinderFeatureCount = 180;
const duplicateCylinderCenterDistanceMeters = 12;
const seasonalFocusCameraHeight = 2000;
const seasonalMoveSpeed = 0.0009;
const seasonalOrbitHeadingSpeed = 0;
const orbitCylinderRefreshMs = 7000;

onMounted(async () => {
  if (!Cesium) {
    console.error("Cesium is not loaded.");
    return;
  }

  try {
    viewer = await initCesium();
    if (isUnmounted) return;

    try {
      await flyToLayerExtentFast();
    } catch (error) {
      console.warn("Failed to fly to crop layer extent, using fallback view.", error);
      flyToFallbackCropExtent();
    }
    if (isUnmounted) return;

    addShpWmsLayers();
    if (isUnmounted) return;
    try {
      await preloadCropDenseFocusCenters();
    } catch (error) {
      console.warn("Failed to preload crop focus centers.", error);
    }
    if (isUnmounted) return;

    updateSeasonalVisualization();
    if (cropWaterShowCylinder.value) {
      await addCylinderLayer();
    }
    if (isUnmounted) return;
    enableClickInfo();
    enableCameraLabelRefresh();
    updateViewportCropFromCamera();
    if (cropWaterFocusCrop.value) {
      focusCropArea(cropWaterFocusCrop.value);
    }
    viewer.scene.requestRender();
  } catch (error) {
    console.error("Crop water map failed to initialize.", error);
  }
});

watch(
  () => [cropWaterShowCylinder.value, cropWaterActiveMetric.value],
  () => {
    if (!viewer) return;

    if (cropWaterShowCylinder.value) {
      currentWaterDataMap = new Map();
      addCylinderLayer();
    } else {
      hasInitializedCylinderLayer = false;
      removeCylinderLayer();
    }
  }
);

watch(
  () => [cropWaterActiveCrop.value, cropWaterActiveDate.value],
  () => {
    updateSeasonalVisualization();

    if (cropWaterShowCylinder.value) {
      currentWaterDataMap = new Map();
      addCylinderLayer();
    }
  }
);

watch(
  () => cropWaterIsPlaying.value,
  () => {
    if (!viewer) return;

    console.info("[crop-water-map] playback changed", {
      isPlaying: cropWaterIsPlaying.value,
      locked: cropWaterLockViewport.value,
    });

    if (cropWaterIsPlaying.value) {
      if (cropWaterLockViewport.value) {
        console.info("[crop-water-map] playback requested while locked, unlocking viewport");
        cropWaterLockViewport.value = false;
      }

      updateSeasonalVisualization();
      if (!cropWaterLockViewport.value) {
        console.info("[crop-water-map] starting orbit from playback");
        startSeasonalOrbitFromCurrentView();
      }

      // 不启动自动相机巡航，保持当前手动调整的位置
      stopSeasonalOrbit();

      if (cropWaterShowCylinder.value) {
        startDemoCylinderAnimation();
      }
    } else {
      stopDemoCylinderAnimation();
      stopSeasonalOrbit();
    }
  }
);
watch(
  () => cropWaterLockViewport.value,
  () => {
    if (!viewer) return;

    console.info("[crop-water-map] viewport lock changed", {
      locked: cropWaterLockViewport.value,
      isPlaying: cropWaterIsPlaying.value,
    });

    if (cropWaterLockViewport.value) {
      stopSeasonalOrbit();
    } else {
      cropWaterIsPlaying.value = true;
      console.info("[crop-water-map] starting orbit from unlock button");
      startSeasonalOrbitFromCurrentView();
    }
  }
);

watch(
  () => cropWaterFocusRequestId.value,
  () => {
    if (!viewer || !cropWaterFocusCrop.value) return;

    focusCropArea(cropWaterFocusCrop.value);
  }
);

onBeforeUnmount(() => {
  isUnmounted = true;
  waterRequestSeq++;
  if (waterReloadTimer) {
    clearTimeout(waterReloadTimer);
    waterReloadTimer = null;
  }
  if (cylinderRefreshTimer) {
    clearTimeout(cylinderRefreshTimer);
    cylinderRefreshTimer = null;
  }
  removeCylinderLayer();
  stopSeasonalOrbit();
  disableCameraLabelRefresh();

  if (clickHandler) {
    clickHandler.destroy();
    clickHandler = null;
  }

  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});

async function initCesium() {
  const viewerInstance = new Cesium.Viewer(cesiumRef.value, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    imageryProvider: false,
    skyBox: false,
    skyAtmosphere: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  });

  viewerInstance.scene.globe.depthTestAgainstTerrain = false;

  viewerInstance.scene.globe.enableLighting = true;
  viewerInstance.shadows = false;
  viewerInstance.scene.light = new Cesium.SunLight();

  viewerInstance.scene.postProcessStages.fxaa.enabled = true;
  viewerInstance.scene.requestRenderMode = true;
  viewerInstance.scene.maximumRenderTimeChange = Number.POSITIVE_INFINITY;
  viewerInstance.imageryLayers.removeAll();

  try {
    const arcgisProvider =
      await Cesium.ArcGisMapServerImageryProvider.fromUrl(
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
      );

    viewerInstance.imageryLayers.addImageryProvider(arcgisProvider);
  } catch (error) {
    console.error("ArcGIS imagery failed to load.", error);

    viewerInstance.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      })
    );
  }

  return viewerInstance;
}

async function flyToLayerExtentFast() {
  if (!viewer) return;

  const url =
    `${geoserverBase}/${workspace}/wms?` +
    "service=WMS&version=1.1.1&request=GetCapabilities";

  const response = await fetch(url);
  const text = await response.text();
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const layers = Array.from(xml.getElementsByTagName("Layer"));
  const availableLayerNames = Array.from(layers)
    .map((layer) => layer.getElementsByTagName("Name")[0]?.textContent)
    .filter(Boolean);
  activeCropWaterDisplayLayers = resolveCropWaterLayers(availableLayerNames);
  if (!activeCropWaterDisplayLayers.length) {
    throw new Error("No new crop WMS layers are available in GeoServer.");
  }
  const targetNames = new Set(
    activeCropWaterDisplayLayers.flatMap((layer) => [
      layer.name,
      layer.name.split(":")[1],
    ])
  );
  const extent = {
    west: Number.POSITIVE_INFINITY,
    south: Number.POSITIVE_INFINITY,
    east: Number.NEGATIVE_INFINITY,
    north: Number.NEGATIVE_INFINITY,
  };

  for (const layer of layers) {
    const nameNode = layer.getElementsByTagName("Name")[0];
    if (!nameNode) continue;

    const name = nameNode.textContent;

    if (!targetNames.has(name)) continue;

    const bboxNode = layer.getElementsByTagName("LatLonBoundingBox")[0];
    if (!bboxNode) continue;

    const west = Number(bboxNode.getAttribute("minx"));
    const south = Number(bboxNode.getAttribute("miny"));
    const east = Number(bboxNode.getAttribute("maxx"));
    const north = Number(bboxNode.getAttribute("maxy"));

    if (![west, south, east, north].every(Number.isFinite)) continue;

    extent.west = Math.min(extent.west, west);
    extent.south = Math.min(extent.south, south);
    extent.east = Math.max(extent.east, east);
    extent.north = Math.max(extent.north, north);

    const layerConfig = activeCropWaterDisplayLayers.find(
      (item) => item.name === name || item.name.split(":")[1] === name
    );

    if (layerConfig) {
      cropWaterLayerExtents.set(layerConfig.crop, {
        west,
        south,
        east,
        north,
      });
    }
  }

  const targetExtent = [extent.west, extent.south, extent.east, extent.north].every(
    Number.isFinite
  )
    ? extent
    : fallbackCropWaterExtent;

  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      targetExtent.west,
      targetExtent.south,
      targetExtent.east,
      targetExtent.north
    ),
    duration: 1.2,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-75),
      roll: 0,
    },
  });
}

function resolveCropWaterLayers(availableLayerNames) {
  const qualifyLayerName = (name) =>
    String(name || "").includes(":") ? name : `${workspace}:${name}`;
  const normalizedAvailable = availableLayerNames.map((name) => ({
    name,
    bareName: name.split(":").pop(),
    normalizedName: normalizeLayerName(name),
  }));

  return cropWaterDisplayLayers.map((layer) => {
    const preferredNames = [layer.name, layer.name.split(":").pop()];
    const preferredMatch = normalizedAvailable.find((candidate) =>
      preferredNames.includes(candidate.name) || preferredNames.includes(candidate.bareName)
    );

    if (preferredMatch) {
      return { ...layer, name: qualifyLayerName(preferredMatch.name) };
    }

    const aliases = (layer.aliases || [layer.crop]).map(normalizeLayerName);
    const aliasMatch = normalizedAvailable.find((candidate) =>
      aliases.some((alias) => candidate.normalizedName.includes(alias))
    );

    if (aliasMatch) {
      return { ...layer, name: qualifyLayerName(aliasMatch.name) };
    }

    console.warn(`No new GeoServer WMS layer matched crop "${layer.crop}".`, {
      expected: layer.name,
      aliases: layer.aliases,
      available: availableLayerNames,
    });

    return null;
  }).filter(Boolean);
}

function normalizeLayerName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function flyToFallbackCropExtent() {
  if (!viewer) return;

  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      fallbackCropWaterExtent.west,
      fallbackCropWaterExtent.south,
      fallbackCropWaterExtent.east,
      fallbackCropWaterExtent.north
    ),
    duration: 1.2,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-75),
      roll: 0,
    },
  });
}

async function loadGeojson() {
  const firstLayerName = cropWaterCylinderLayers()[0];

  if (!firstLayerName) {
    throw new Error("No new crop WFS layers are available in GeoServer.");
  }

  const geojson = await loadLayerGeojson(firstLayerName);
  const features = geojson.features || [];

  if (features.length === 0) {
    throw new Error("WFS returned no field features.");
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

async function loadLayerGeojson(layerName, bbox = null, maxFeatures = null) {
  const qualifiedLayerName = layerName.includes(":")
    ? layerName
    : `${workspace}:${layerName}`;
  const layerWorkspace = qualifiedLayerName.split(":")[0];
  const bboxQuery = bbox
    ? `&BBOX=${encodeURIComponent(
        `${bbox.west},${bbox.south},${bbox.east},${bbox.north},${cylinderWfsSrs}`
      )}`
    : "";
  const maxFeaturesQuery = maxFeatures
    ? `&maxFeatures=${maxFeatures}&count=${maxFeatures}`
    : "";
  const wfsUrl =
    `${geoserverBase}/${layerWorkspace}/ows?` +
    "service=WFS&version=1.0.0&request=GetFeature" +
    `&typeName=${encodeURIComponent(qualifiedLayerName)}` +
    bboxQuery +
    maxFeaturesQuery +
    "&outputFormat=application/json" +
    `&srsName=${cylinderWfsSrs}`;
  const response = await fetch(wfsUrl);

  if (!response.ok) {
    throw new Error(
      `WFS request failed for ${qualifiedLayerName}: ${response.status}`
    );
  }

  const geojson = await response.json();

  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        sourceLayer: layerName,
      },
    })),
  };
}

function addShpWmsLayers() {
  if (!viewer) return;

  if (!activeCropWaterDisplayLayers.length) {
    console.warn("No new crop WMS layers to add.");
    return;
  }

  cropWaterImageryLayers = [];

  for (const layer of activeCropWaterDisplayLayers) {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: `${geoserverBase}/${workspace}/wms`,
      layers: layer.name,
      parameters: {
        SERVICE: "WMS",
        VERSION: "1.1.1",
        TRANSPARENT: true,
        FORMAT: "image/png",
        TILED: true,
      },
      enablePickFeatures: false,
    });
    const imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
    imageryLayer.alpha = 0.9;
    imageryLayer.brightness = 1;
    imageryLayer.contrast = 1.05;
    cropWaterImageryLayers.push({ crop: layer.crop, imageryLayer });
  }

  resetCropWaterLayerDisplay();
}

async function preloadCropDenseFocusCenters() {
  for (const layer of activeCropWaterDisplayLayers) {
    try {
      const geojson = await loadLayerGeojson(layer.name, null, 900);
      const denseFocus = getDenseFeatureFocusExtent(geojson);

      if (denseFocus) {
        cropWaterDenseFocusCenters.set(layer.crop, denseFocus);
      }
    } catch (error) {
      console.warn(`Failed to preload dense focus for ${layer.name}.`, error);
    }
  }
}

function getQuantile(values, quantile) {
  if (!values.length) return 0;

  const index = Math.min(
    Math.max(Math.round((values.length - 1) * quantile), 0),
    values.length - 1
  );

  return values[index];
}

async function addStyledGeojson(geojson) {
  if (!viewer) return;

  const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
    clampToGround: true,
  });

  viewer.dataSources.add(dataSource);

  for (const entity of dataSource.entities.values) {
    if (!entity.polygon) continue;

    entity.polygon.material =
      Cesium.Color.fromCssColorString("#A7F3D0").withAlpha(0.35);
    entity.polygon.outlineColor =
      Cesium.Color.fromCssColorString("#10B981");
    entity.polygon.outlineWidth = 1.1;
    entity.polygon.height = 0;
    entity.polygon.extrudedHeight = undefined;
    entity.polygon.perPositionHeight = false;
  }
}

function flyToGeojsonExtent(geojson) {
  if (!viewer || !geojson?.features?.length) return;

  const extent = getGeojsonExtent(geojson);
  if (!extent) return;

  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      extent.west,
      extent.south,
      extent.east,
      extent.north
    ),
    duration: 0.8,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-75),
      roll: 0,
    },
  });
}

async function focusCropArea(crop) {
  if (!viewer || !crop) return;

  const extent = await ensureCropFocusExtent(crop);
  if (!extent) return;

  if (cropWaterIsPlaying.value) {
    cropWaterIsPlaying.value = false;
    stopSeasonalOrbit();
    stopDemoCylinderAnimation();
  }

  viewer.camera.flyTo({
    destination: getCropFocusDestination(extent),
    duration: 1.1,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    complete: () => {
      cropWaterViewportCrop.value = crop;
      viewer.scene.requestRender();

      if (cropWaterShowCylinder.value) {
        addCylinderLayer();
      }
    },
  });
}

function getCropFocusDestination(extent) {
  const lon = Number.isFinite(extent.lon)
    ? extent.lon
    : (extent.west + extent.east) / 2;
  const lat = Number.isFinite(extent.lat)
    ? extent.lat
    : (extent.south + extent.north) / 2;
  const lonSpan = Math.max(Math.abs(extent.east - extent.west), 0.015);
  const latSpan = Math.max(Math.abs(extent.north - extent.south), 0.012);
  const lonMeters =
    lonSpan * 111320 * Math.max(Math.cos(Cesium.Math.toRadians(lat)), 0.2);
  const latMeters = latSpan * 110540;
  const height = clamp(2600, Math.max(lonMeters, latMeters) * 2.6, 22000);

  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
}

async function ensureCropFocusExtent(crop) {
  const cachedFocus = cropWaterDenseFocusCenters.get(crop);
  const cachedExtent = cropWaterLayerExtents.get(crop);

  if (cachedFocus) {
    return cachedFocus;
  }

  const layer = activeCropWaterDisplayLayers.find((item) => item.crop === crop);

  if (!layer) {
    return getFallbackCropFocusExtent(crop);
  }

  try {
    const geojson = await loadLayerGeojson(layer.name, null, 1200);
    const extent = getGeojsonExtent(geojson);
    const denseFocus = getDenseFeatureFocusExtent(geojson);

    if (extent) {
      cropWaterLayerExtents.set(crop, extent);
    }

    if (denseFocus) {
      cropWaterDenseFocusCenters.set(crop, denseFocus);
      return denseFocus;
    }

    if (extent) {
      return extent;
    }
  } catch (error) {
    console.warn(`Failed to load focus extent for ${crop}.`, error);
  }

  return cachedExtent || getFallbackCropFocusExtent(crop);
}

function getDenseFeatureFocusExtent(geojson) {
  const centers = (geojson?.features || [])
    .map((feature) => getFeatureCenter(feature))
    .filter((center) => Array.isArray(center) && center.every(Number.isFinite));

  if (!centers.length) return null;

  const lonValues = centers.map((center) => center[0]).sort((a, b) => a - b);
  const latValues = centers.map((center) => center[1]).sort((a, b) => a - b);
  const lonSpan = Math.max(lonValues[lonValues.length - 1] - lonValues[0], 0.01);
  const latSpan = Math.max(latValues[latValues.length - 1] - latValues[0], 0.01);
  const lonRadius = clamp(0.06, lonSpan * 0.08, 0.36);
  const latRadius = clamp(0.05, latSpan * 0.08, 0.28);
  let bestCenter = centers[0];
  let bestScore = -1;

  for (const center of centers) {
    let score = 0;

    for (const candidate of centers) {
      const lonDistance = Math.abs(candidate[0] - center[0]) / lonRadius;
      const latDistance = Math.abs(candidate[1] - center[1]) / latRadius;
      const distance = Math.hypot(lonDistance, latDistance);

      if (distance <= 1) {
        score += 1 - distance * 0.35;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCenter = center;
    }
  }

  let cluster = centers.filter((center) => {
    const lonDistance = Math.abs(center[0] - bestCenter[0]) / (lonRadius * 1.45);
    const latDistance = Math.abs(center[1] - bestCenter[1]) / (latRadius * 1.45);

    return Math.hypot(lonDistance, latDistance) <= 1;
  });

  if (cluster.length < Math.min(centers.length, 8)) {
    cluster = [...centers]
      .sort((a, b) => {
        const distanceA = Math.hypot(
          (a[0] - bestCenter[0]) / lonRadius,
          (a[1] - bestCenter[1]) / latRadius
        );
        const distanceB = Math.hypot(
          (b[0] - bestCenter[0]) / lonRadius,
          (b[1] - bestCenter[1]) / latRadius
        );

        return distanceA - distanceB;
      })
      .slice(0, Math.min(centers.length, 80));
  }

  const clusterLonValues = cluster.map((center) => center[0]).sort((a, b) => a - b);
  const clusterLatValues = cluster.map((center) => center[1]).sort((a, b) => a - b);
  const west = getQuantile(clusterLonValues, 0.05);
  const east = getQuantile(clusterLonValues, 0.95);
  const south = getQuantile(clusterLatValues, 0.05);
  const north = getQuantile(clusterLatValues, 0.95);
  const lonPadding = Math.max((east - west) * 0.45, 0.035);
  const latPadding = Math.max((north - south) * 0.45, 0.03);

  return {
    lon: bestCenter[0],
    lat: bestCenter[1],
    west: west - lonPadding,
    east: east + lonPadding,
    south: south - latPadding,
    north: north + latPadding,
  };
}

function getFallbackCropFocusExtent(crop) {
  const fallbackExtents = {
    wheat: { west: 80.2, south: 42.2, east: 82.4, north: 45.6 },
    corn: { west: 82.4, south: 42.2, east: 84.4, north: 45.6 },
    vegetables: { west: 84.4, south: 42.2, east: 86.4, north: 45.6 },
  };

  return fallbackExtents[crop] || fallbackCropWaterExtent;
}

function getGeojsonExtent(geojson) {
  const extent = {
    west: Number.POSITIVE_INFINITY,
    south: Number.POSITIVE_INFINITY,
    east: Number.NEGATIVE_INFINITY,
    north: Number.NEGATIVE_INFINITY,
  };

  for (const feature of geojson.features || []) {
    eachCoordinate(feature.geometry?.coordinates, (lon, lat) => {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

      extent.west = Math.min(extent.west, lon);
      extent.south = Math.min(extent.south, lat);
      extent.east = Math.max(extent.east, lon);
      extent.north = Math.max(extent.north, lat);
    });
  }

  if (![extent.west, extent.south, extent.east, extent.north].every(Number.isFinite)) {
    return null;
  }

  return extent;
}

async function loadWaterData(crop, dateStr, bbox = null) {
  const apiCrop = getWaterApiCrop(crop);
  const params = new URLSearchParams();

  if (bbox) {
    params.set("minLng", bbox.west);
    params.set("minLat", bbox.south);
    params.set("maxLng", bbox.east);
    params.set("maxLat", bbox.north);
  }

  const query = params.toString();
  const url = `${waterApiBase}/api/water/${apiCrop}/${dateStr}${
    query ? `?${query}` : ""
  }`;
  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  console.info("[crop-water-map] parcel water API response", {
    crop,
    apiCrop,
    date: dateStr,
    bbox,
    status: response.status,
    ok: response.ok,
    url,
    data,
  });

  if (!response.ok) {
    const error = new Error(`water request failed: ${response.status}`);
    error.requestUrl = url;
    throw error;
  }

  const waterMap = new Map();
  const features = [];

  for (const feature of data.features || []) {
    const props = feature.properties || {};
    const objectid = normalizeFeatureId(
      props.field_id ?? props.objectid ?? props.OBJECTID
    );

    if (objectid === null) continue;

    const blueWater = toFiniteNumber(props.blueWater ?? props.blue_water_mm);
    const greenWater = toFiniteNumber(props.greenWater ?? props.green_water_mm);
    const eta = toFiniteNumber(props.eta ?? props.eta_mm);
    const waterFootprint = eta;
    const irrigationWater = toFiniteNumber(
      props.irrigationWater ?? props.irrigation_use_mm
    );
    const dailyWater = toFiniteNumber(
      props.dailyWater ?? eta ?? greenWater + blueWater
    );
    const totalWater = toFiniteNumber(
      props.totalWater ?? eta ?? greenWater + blueWater
    );
    const normalizedProperties = {
      ...props,
      field_id: objectid,
      objectid,
      cropType: props.crop_type ?? props.crop ?? crop,
      dailyWater,
      totalWater,
      eta,
      blueWater,
      greenWater,
      waterFootprint,
      irrigationWater,
    };

    waterMap.set(objectid, {
      cropType: normalizedProperties.cropType,
      dailyWater,
      eta,
      blueWater,
      greenWater,
      waterFootprint,
      irrigationWater,
      totalWater,
    });

    if (feature.geometry) {
      features.push({
        ...feature,
        properties: normalizedProperties,
      });
    }
  }

  return {
    url,
    waterMap,
    geojson: {
      type: "FeatureCollection",
      features,
    },
  };
}

async function loadCylinderWaterData(crop, dateStr, viewportBbox) {
  const attempts = getCylinderWaterDataAttempts(crop, viewportBbox);
  let lastResult = null;
  let lastError = null;

  for (const attempt of attempts) {
    try {
      const result = await loadWaterData(crop, dateStr, attempt.bbox);
      lastResult = result;

      console.info("[crop-water-map] parcel cylinder water attempt", {
        crop,
        date: dateStr,
        attempt: attempt.name,
        bbox: attempt.bbox,
        url: result.url,
        featureCount: result.geojson.features.length,
        dataCount: result.waterMap.size,
      });

      if (result.geojson.features.length || result.waterMap.size) {
        return {
          ...result,
          source: attempt.name,
        };
      }
    } catch (error) {
      lastError = error;
      console.warn("[crop-water-map] parcel cylinder water attempt failed", {
        crop,
        date: dateStr,
        attempt: attempt.name,
        bbox: attempt.bbox,
        url: error?.requestUrl,
        error,
      });
    }
  }

  if (lastResult) {
    return {
      ...lastResult,
      source: "empty",
    };
  }

  throw lastError || new Error("No parcel water data attempts were available.");
}

function getCylinderWaterDataAttempts(crop, viewportBbox) {
  const attempts = [];

  if (viewportBbox) {
    attempts.push({
      name: "viewport",
      bbox: viewportBbox,
    });
    attempts.push({
      name: "expanded viewport",
      bbox: expandBbox(viewportBbox, 4),
    });
  }

  const cropExtent = cropWaterLayerExtents.get(crop);

  if (cropExtent) {
    attempts.push({
      name: "crop layer extent",
      bbox: expandBbox(cropExtent, 1.08),
    });
  }

  attempts.push({
    name: "no bbox",
    bbox: null,
  });

  return attempts;
}

function expandBbox(bbox, factor = 1) {
  if (!bbox) return null;

  const west = Number(bbox.west);
  const south = Number(bbox.south);
  const east = Number(bbox.east);
  const north = Number(bbox.north);

  if (![west, south, east, north].every(Number.isFinite)) return null;

  const lonCenter = (west + east) / 2;
  const latCenter = (south + north) / 2;
  const lonHalf = Math.max(Math.abs(east - west) * factor * 0.5, 0.01);
  const latHalf = Math.max(Math.abs(north - south) * factor * 0.5, 0.01);

  return {
    west: clamp(-180, lonCenter - lonHalf, 180),
    south: clamp(-90, latCenter - latHalf, 90),
    east: clamp(-180, lonCenter + lonHalf, 180),
    north: clamp(-90, latCenter + latHalf, 90),
  };
}

function getWaterApiCrop(crop) {
  const cropName = String(crop || "").toLowerCase();

  if (cropName === "vegetables") {
    return "potato";
  }

  return cropName;
}

async function reloadWaterData() {
  if (!viewer) return;

  const requestSeq = ++waterRequestSeq;
  const cameraRectangle = viewer.camera.computeViewRectangle();
  const bbox = cameraRectangle ? rectangleToBbox(cameraRectangle) : null;

  try {
    const { waterMap } = await loadWaterData(
      cropWaterActiveCrop.value,
      cropWaterActiveDate.value,
      bbox
    );

    if (requestSeq !== waterRequestSeq || isUnmounted) return;

    currentWaterDataMap = waterMap;

    if (cropWaterShowCylinder.value) {
      await addCylinderLayer();
    }
  } catch (error) {
    if (requestSeq === waterRequestSeq) {
      console.warn("Crop water data failed to load.", error);
      currentWaterDataMap = new Map();
      if (cropWaterShowCylinder.value) {
        await addCylinderLayer();
      }
    }
  }
}

function scheduleReloadWaterData() {
  if (waterReloadTimer) {
    clearTimeout(waterReloadTimer);
  }

  waterReloadTimer = setTimeout(() => {
    waterReloadTimer = null;
    reloadWaterData();
  }, 180);
}

function mergeWaterDataToGeojson(geojson, waterMap) {
  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const objectid = normalizeFeatureId(
      props.field_id ?? props.OBJECTID ?? props.objectid
    );
    const waterData = waterMap.get(objectid);

    feature.properties.cropType = waterData?.cropType ?? cropWaterActiveCrop.value;
    feature.properties.dailyWater = waterData?.dailyWater;
    feature.properties.blueWater = waterData?.blueWater;
    feature.properties.greenWater = waterData?.greenWater;
    feature.properties.waterFootprint = waterData?.waterFootprint;
    feature.properties.irrigationWater = waterData?.irrigationWater;
    feature.properties.totalWater = waterData?.totalWater;
  }
}

function enableClickInfo() {
  if (!viewer) return;

  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  clickHandler.setInputAction(async (click) => {
    try {
      const fieldInfo = await getWmsFeatureInfo(click.position);

      if (!fieldInfo) {
        clearSelectedField();
        return;
      }

      selectedWaterFieldId = String(fieldInfo.objectId);
      refreshCylinderLabelVisibility();
      emit("select-field", fieldInfo);
    } catch (error) {
      console.warn("GetFeatureInfo failed.", error);
      clearSelectedField();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

async function getWmsFeatureInfo(position) {
  if (!viewer || !position) return null;

  const cameraRectangle = viewer.camera.computeViewRectangle();
  if (!cameraRectangle) return null;

  const bbox = rectangleToBbox(cameraRectangle);
  const canvas = viewer.scene.canvas;
  const width = Math.round(canvas.clientWidth || canvas.width);
  const height = Math.round(canvas.clientHeight || canvas.height);
  const x = Math.round(position.x);
  const y = Math.round(position.y);
  const layers = activeCropWaterDisplayLayers.map((layer) => layer.name).join(",");
  const url =
    `${geoserverBase}/${workspace}/wms?` +
    [
      "SERVICE=WMS",
      "VERSION=1.1.1",
      "REQUEST=GetFeatureInfo",
      `LAYERS=${encodeURIComponent(layers)}`,
      `QUERY_LAYERS=${encodeURIComponent(layers)}`,
      "STYLES=",
      "INFO_FORMAT=application/json",
      "FEATURE_COUNT=5",
      `SRS=${cylinderWfsSrs}`,
      `BBOX=${encodeURIComponent(
        `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`
      )}`,
      `WIDTH=${width}`,
      `HEIGHT=${height}`,
      `X=${x}`,
      `Y=${y}`,
    ].join("&");
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GetFeatureInfo request failed: ${response.status}`);
  }

  const result = await response.json();
  const feature = result.features?.[0];

  if (!feature) return null;

  console.info("Clicked parcel properties:", feature.properties);

  return buildFieldInfoFromProperties(feature.properties || {}, feature.id);
}

function buildFieldInfoFromProperties(props, fallbackId) {
  const objectId = pickProperty(
    props,
    "OBJECTID",
    "objectid",
    "field_id",
    "FID_1",
    "FID",
    "id"
  ) ?? fallbackId ?? "unknown";
  const area = pickProperty(
    props,
    "Shape_Area",
    "SHAPE_Area",
    "SHAPE_AREA",
    "shape_area",
    "shape_Area",
    "area",
    "AREA",
    "Shape__Area",
    "Shape_Area_",
    "Shape_Area1",
    "Shape_Area2",
    "Shape_Ar",
    "Shape_A",
    "st_area",
    "ST_AREA",
    "geom_area"
  ) ?? pickPropertyByPattern(props, ["area", "acre"]);
  const length = pickProperty(
    props,
    "Shape_Leng",
    "SHAPE_Leng",
    "SHAPE_LENG",
    "Shape_Length",
    "SHAPE_Length",
    "SHAPE_LENGTH",
    "shape_leng",
    "shape_Leng",
    "shape_length",
    "shape_Length",
    "length",
    "LENGTH",
    "Shape__Length",
    "Shape_Leng_",
    "Shape_Len",
    "Shape_Le",
    "Shape_L",
    "st_length",
    "ST_LENGTH",
    "geom_length"
  ) ?? pickPropertyByPattern(props, ["leng", "length", "perim", "perimeter"]);
  const seed = Number(objectId) || hashString(String(objectId));
  const dailyWater = getRandomWaterValue({ properties: props }, seed);
  const blueWater = dailyWater * 0.43;
  const greenWater = dailyWater * 0.57;

  return {
    objectId,
    area: formatNumber(area ?? "unknown"),
    length: formatNumber(length ?? "unknown"),
    dailyWater,
    blueWater,
    greenWater,
    totalWater: dailyWater,
    irrigationWater: blueWater,
  };
}

function pickProperty(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function pickPropertyByPattern(source, patterns) {
  const entries = Object.entries(source || {});

  for (const [key, value] of entries) {
    const normalizedKey = key.toLowerCase();

    if (
      patterns.some((pattern) => normalizedKey.includes(pattern)) &&
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return undefined;
}

function highlightSelectedEntity(entity) {
  selectedHighlight = entity;
  entity.polygon.material =
    Cesium.Color.fromCssColorString("#A7F3D0").withAlpha(0.08);
  entity.polygon.outline = true;
  entity.polygon.outlineColor = Cesium.Color.fromCssColorString("#FFFFFF");
  entity.polygon.outlineWidth = 2;
}

function resetSelectedStyle() {
  if (!selectedHighlight || !selectedHighlight.polygon) return;

  selectedHighlight.polygon.material =
    Cesium.Color.fromCssColorString("#A7F3D0").withAlpha(0.35);
  selectedHighlight.polygon.outlineColor =
    Cesium.Color.fromCssColorString("#10B981");
  selectedHighlight.polygon.outlineWidth = 1.1;
  selectedHighlight = null;
}

function clearSelectedField() {
  selectedWaterFieldId = null;
  refreshCylinderLabelVisibility();
  resetSelectedStyle();
  emit("select-field", null);
}

defineExpose({
  clearSelectedField,
});

function addDemoCylinderLayer() {
  if (!viewer || !viewer.scene) return;

  removeCylinderLayer();
  stopDemoCylinderAnimation();

  const features = buildRandomViewportFeatures(
    viewer.camera.computeViewRectangle(),
    demoCylinderCount
  );
  const materialColor = getColorByMetric();
  const primitiveOptions = {
    translucent: true,
    closed: true,
    faceForward: true,
    flat: true,
    material: Cesium.Material.fromType("Color", {
      color: materialColor,
    }),
  };

  demoCylinderItems = features
    .map((feature, index) => {
      const center = getFeatureCenter(feature);
      if (!center) return null;

      const [lon, lat] = center;
      const seed = Number(feature.properties?.objectid ?? index);
      const targetHeight = getDemoCylinderHeight(seed, cropWaterActiveDate.value);
      const baseMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromDegrees(lon, lat, 0)
      );
      const primitive = viewer.scene.primitives.add(
        new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.CylinderGeometry({
              length: 1,
              topRadius: demoCylinderRadius,
              bottomRadius: demoCylinderRadius,
              slices: demoCylinderSlices,
              vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
            }),
          }),
          modelMatrix: getAnimatedCylinderModelMatrix(baseMatrix, targetHeight, 1),
          appearance: new Cesium.MaterialAppearance(primitiveOptions),
          asynchronous: false,
        })
      );

      cylinderEntities.push(primitive);

      return {
        primitive,
        baseMatrix,
        seed,
        geometryHeight: targetHeight,
        currentHeight: targetHeight,
        startHeight: targetHeight,
        targetHeight,
        progress: 1,
      };
    })
    .filter(Boolean);

  viewer.scene.requestRender();

  if (cropWaterIsPlaying.value) {
    startDemoCylinderAnimation();
  }
}

function updateDemoCylinderTargets() {
  if (!animatedCylinderItems.length) {
    addCylinderLayer();
    return;
  }

  for (const item of animatedCylinderItems) {
    item.heightState.waterMixRatio = getFeatureGreenWaterRatio(
      item.feature,
      item.seed
    );
    if (item.primitive?.appearance?.material?.uniforms) {
      item.primitive.appearance.material.uniforms.color = getColorByMetric(
        item.heightState.waterMixRatio
      );
    }
    item.startHeight = item.currentHeight ?? item.targetHeight;
    item.startValue = item.currentValue ?? item.targetValue;
    item.targetValue = getFeatureCylinderValue(item.feature, item.seed);
    item.targetHeight = getDemoCylinderHeightFromValue(item.targetValue);
    item.progress = 0;
    item.durationMs = getCylinderTransitionDuration(item.targetValue);
  }

  hasInitializedCylinderLayer = true;
  updateCylinderLabelRanks();
  startParcelCylinderAnimation();
}

function startDemoCylinderAnimation() {
  if (!viewer || demoCylinderAnimationId) return;

  let lastTime = performance.now();

  function animate() {
    if (!viewer || !demoCylinderItems.length) {
      demoCylinderAnimationId = null;
      return;
    }

    const now = performance.now();
    const delta = Math.min(now - lastTime, 34);
    lastTime = now;
    let hasMovingItem = false;

    for (const item of demoCylinderItems) {
      item.progress = Math.min(item.progress + delta / 900, 1);
      const easedProgress = easeInOutSine(item.progress);
      item.currentHeight = lerp(item.startHeight, item.targetHeight, easedProgress);
      item.primitive.modelMatrix = getCylinderModelMatrixForHeight(
        item.baseMatrix,
        item.geometryHeight,
        item.currentHeight
      );

      if (item.progress < 1) {
        hasMovingItem = true;
      }
    }

    viewer.scene.requestRender();

    if (hasMovingItem || cropWaterIsPlaying.value) {
      demoCylinderAnimationId = requestAnimationFrame(animate);
    } else {
      demoCylinderAnimationId = null;
    }
  }

  demoCylinderAnimationId = requestAnimationFrame(animate);
}

function startParcelCylinderAnimation() {
  if (!viewer || demoCylinderAnimationId) return;

  let lastTime = performance.now();
  let lastLabelLayoutTime = 0;

  function animate() {
    if (!viewer || !animatedCylinderItems.length) {
      demoCylinderAnimationId = null;
      return;
    }

    const now = performance.now();
    const delta = Math.min(now - lastTime, 34);
    lastTime = now;
    let hasMovingItem = false;

    for (const item of animatedCylinderItems) {
      item.progress = Math.min(
        item.progress + delta / (item.durationMs || cylinderTransitionMs),
        1
      );
      const easedProgress = easeInOutSine(item.progress);
      item.currentHeight = lerp(item.startHeight, item.targetHeight, easedProgress);
      item.currentValue = lerp(item.startValue, item.targetValue, easedProgress);
      item.primitive.modelMatrix = getCylinderModelMatrixForHeight(
        item.baseMatrix,
        item.geometryHeight,
        item.currentHeight
      );
      item.heightState.value = item.currentHeight;
      item.heightState.metricValue = item.currentValue;
      item.heightState.showLabel = shouldShowCylinderLabel(item);
      const shouldShowCylinder = shouldShowCylinderBody(item);
      item.heightState.showGlow = shouldShowCylinder;
      item.primitive.show = shouldShowCylinder;
      item.topEntity.show = shouldShowCylinderDisk(item);

      if (item.progress < 1) {
        hasMovingItem = true;
      }
    }

    if (now - lastLabelLayoutTime > 260) {
      lastLabelLayoutTime = now;
      updateCylinderLabelRanks();

      for (const item of animatedCylinderItems) {
        item.heightState.showLabel = shouldShowCylinderLabel(item);
      }
    }

    viewer.scene.requestRender();

    if (hasMovingItem || cropWaterIsPlaying.value) {
      demoCylinderAnimationId = requestAnimationFrame(animate);
    } else {
      demoCylinderAnimationId = null;
    }
  }

  demoCylinderAnimationId = requestAnimationFrame(animate);
}

function stopDemoCylinderAnimation() {
  if (demoCylinderAnimationId) {
    cancelAnimationFrame(demoCylinderAnimationId);
    demoCylinderAnimationId = null;
  }
}

function getDemoCylinderHeight(seed, date, crop = cropWaterActiveCrop.value) {
  return getDemoCylinderHeightFromValue(getDemoCylinderValue(seed, date, crop));
}

function getDemoCylinderValue(seed, date, crop = cropWaterActiveCrop.value) {
  const seasonalState = getSeasonalCropState(date);
  const cropWeight = Math.max(seasonalState.weights[crop] ?? 0.25, 0.35);

  const daySeed = hashString(`${seed}:${date}:${crop}`);
  const phaseSeed = seededRandom(seed);
  const dayIndex = getDayIndexFromDate(date);
  const seasonalIndex = dayIndex % 365;
  const seasonalCurve =
    0.18 +
    Math.exp(-Math.pow((seasonalIndex - 145) / 58, 2)) * 1.42 +
    Math.sin(seasonalIndex / 10 + phaseSeed * Math.PI * 2) * 0.42;
  const localVariation = 0.42 + seededRandom(daySeed) * 1.12;
  const metricFactor = getDemoMetricFactor();
  const cropFactor = getSeasonalCropWaterFactor(crop);
  const zeroGate = seededRandom(daySeed + hashString(cropWaterActiveMetric.value));
  const zeroRunSeed = hashString(`${seed}:${crop}:${cropWaterActiveMetric.value}:zero-run`);
  const zeroRunOffset = Math.floor(seededRandom(zeroRunSeed) * maxConsecutiveRandomZeroDays);
  const canRandomlyZero =
    ((dayIndex + zeroRunOffset) % (maxConsecutiveRandomZeroDays + 1)) !==
    maxConsecutiveRandomZeroDays;
  const rawValue =
    seasonalCurve *
    localVariation *
    metricFactor *
    cropFactor *
    lerp(0.18, 1.22, cropWeight) *
    lerp(0.72, 1.28, seasonalState.energy);

  if (canRandomlyZero && (zeroGate < 0.08 || rawValue < 0.12)) {
    return 0;
  }

  return Math.min(Math.max(rawValue, 0.15), 4.6);
}

function getSeasonalCropWaterFactor(crop) {
  switch (crop) {
    case "vegetables":
      return 1.08;
    case "corn":
      return 0.96;
    case "wheat":
      return 0.82;
    default:
      return 1;
  }
}

/* function getDemoCylinderHeightFromValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= zeroValueThreshold) return 0;

  const normalizedValue = Math.min(number / visualMaxMetricValue, 1);
  const boostedValue = Math.pow(normalizedValue, cylinderVisualGamma);

  return (
    minNonZeroCylinderHeight +
    boostedValue * (demoMaxCylinderHeight - minNonZeroCylinderHeight)
  );
}
 */
function getDemoCylinderHeightFromValue(value) {
  const v = Number(value) || 0;

  if (v <= 0) return 0;

  const minHeight = 24;
  const maxHeight = demoMaxCylinderHeight;
  const maxValue = 8;
  const normalizedValue = Math.min(v / maxValue, 1);
  const softenedValue = Math.pow(normalizedValue, 0.78);

  return Math.min(
    maxHeight,
    minHeight + softenedValue * (maxHeight - minHeight)
  );
}
function getCylinderTransitionDuration() {
  return cylinderTransitionMs;
}

function updateCylinderLabelRanks() {
  const rankedItems = [...animatedCylinderItems]
    .filter((item) => shouldPrintMetricLabelValue(item.targetValue))
    .sort((a, b) => (b.targetValue || 0) - (a.targetValue || 0));

  for (let i = 0; i < rankedItems.length; i++) {
    rankedItems[i].labelRank = i;
    rankedItems[i].labelLayoutRank = i;
  }

  updateCylinderLabelLayout(rankedItems);
}

function shouldShowCylinderLabel(item) {
  if (!item || !shouldPrintMetricLabelValue(item.targetValue)) return false;
  if (!shouldShowCylinderDisk(item)) return false;

  if (selectedWaterFieldId && String(item.seed) === selectedWaterFieldId) {
    return true;
  }

  const cameraHeight =
    viewer?.camera?.positionCartographic?.height ?? Number.POSITIVE_INFINITY;
  const labelLimit = getCylinderLabelLimit(cameraHeight);

  return (item.labelLayoutRank ?? Number.POSITIVE_INFINITY) < labelLimit;
}

function shouldShowCylinderBody(item) {
  return Number(item?.targetValue) > zeroValueThreshold && Number(item?.currentHeight) > 1;
}

function shouldShowCylinderDisk(item) {
  return shouldShowCylinderBody(item);
}

function refreshCylinderLabelVisibility() {
  updateCylinderLabelRanks();

  for (const item of animatedCylinderItems) {
    item.heightState.showLabel = shouldShowCylinderLabel(item);
  }

  viewer?.scene?.requestRender();
}

function updateCylinderLabelLayout(rankedItems) {
  labelLayoutFrame++;

  if (!viewer?.scene) return;

  const acceptedScreenPoints = [];
  const minDistance = getCylinderLabelPixelDistance();

  for (const item of rankedItems) {
    item.labelLayoutRank = Number.POSITIVE_INFINITY;

    if (!shouldPrintMetricLabelValue(item.targetValue)) continue;

    const worldPosition = Cesium.Cartesian3.fromDegrees(
      item.lon,
      item.lat,
      (item.currentHeight || item.targetHeight || 0) + 24
    );
    const screenPosition = toScreenPosition(worldPosition);

    if (!screenPosition) continue;

    if (selectedWaterFieldId && String(item.seed) === selectedWaterFieldId) {
      item.labelLayoutRank = -1;
      acceptedScreenPoints.push(screenPosition);
      continue;
    }

    const overlaps = acceptedScreenPoints.some((point) => {
      const dx = point.x - screenPosition.x;
      const dy = point.y - screenPosition.y;

      return dx * dx + dy * dy < minDistance * minDistance;
    });

    if (overlaps) continue;

    item.labelLayoutRank = acceptedScreenPoints.length;
    item.labelLayoutFrame = labelLayoutFrame;
    acceptedScreenPoints.push(screenPosition);
  }
}

function getCylinderLabelPixelDistance() {
  const cameraHeight =
    viewer?.camera?.positionCartographic?.height ?? Number.POSITIVE_INFINITY;

  if (cameraHeight > 450000) return 120;
  if (cameraHeight > 180000) return 108;
  if (cameraHeight > 80000) return 94;

  return 78;
}

function getCylinderLabelLimit(cameraHeight) {
  if (cameraHeight > 900000) return 3;
  if (cameraHeight > 450000) return 6;
  if (cameraHeight > 180000) return 10;
  if (cameraHeight > 80000) return 16;

  return 28;
}

function getFeatureCylinderRadius() {
  return cylinderVisualRadius;
}

function getUniqueCylinderFeatures(features) {
  const uniqueFeatures = [];
  const seenObjectIds = new Set();
  const acceptedCenters = [];

  for (let index = 0; index < features.length; index++) {
    const feature = features[index];
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const objectId = getFeatureObjectId(feature, index);

    if (objectId !== null && seenObjectIds.has(objectId)) {
      continue;
    }

    if (isCylinderCenterTooClose(center, acceptedCenters)) {
      continue;
    }

    if (objectId !== null) {
      seenObjectIds.add(objectId);
    }

    acceptedCenters.push(center);
    uniqueFeatures.push(feature);
  }

  return uniqueFeatures;
}

function isCylinderCenterTooClose(center, acceptedCenters) {
  return acceptedCenters.some(
    (acceptedCenter) =>
      getCenterDistanceMeters(center, acceptedCenter) <
      duplicateCylinderCenterDistanceMeters
  );
}

function getCenterDistanceMeters(a, b) {
  const centerLat = (a[1] + b[1]) / 2;
  const lonMeters =
    (a[0] - b[0]) * 111320 * Math.max(Math.cos(Cesium.Math.toRadians(centerLat)), 0.1);
  const latMeters = (a[1] - b[1]) * 110540;

  return Math.hypot(lonMeters, latMeters);
}

function selectCylinderFeaturesForViewport(features) {
  if (features.length <= allCylinderFeatureThreshold) {
    return features;
  }

  const randomSeed = cropWaterViewportCrop.value || cropWaterActiveCrop.value || "all";

  return [...features]
    .map((feature, index) => {
      const objectId = getFeatureObjectId(feature, index);
      const crop = getFeatureCrop(feature);

      return {
        feature,
        score: seededRandom(hashString(`${randomSeed}:${crop}:${objectId}:${index}`)),
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, sampledCylinderFeatureCount)
    .map((item) => item.feature);
}

function getDayIndexFromDate(date) {
  const current = new Date(date);
  const start = new Date(cropWaterTimelineStartDate);
  const diff = current.getTime() - start.getTime();

  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
}

function getDemoMetricFactor() {
  switch (cropWaterActiveMetric.value) {
    case "greenWater":
      return 1.15;
    case "blueWater":
      return 0.88;
    case "irrigationWater":
      return 0.72;
    case "waterFootprint":
      return 1.05;
    default:
      return 1;
  }
}

async function addCylinderLayer() {
  if (!viewer || !viewer.scene) return;

  const requestSeq = ++cylinderRequestSeq;
  const cameraRectangle = viewer.camera.computeViewRectangle();
  if (!cameraRectangle) return;

  let allFeatures = [];
  try {
    const { waterMap, geojson, source } = await loadCylinderWaterData(
      cropWaterActiveCrop.value,
      cropWaterActiveDate.value,
      rectangleToBbox(cameraRectangle)
    );
    currentWaterDataMap = waterMap;
    allFeatures = geojson.features || [];
    console.info("[crop-water-map] parcel cylinder water data applied", {
      crop: cropWaterActiveCrop.value,
      date: cropWaterActiveDate.value,
      metric: cropWaterActiveMetric.value,
      source,
      featureCount: allFeatures.length,
      dataCount: waterMap.size,
      metricStats: getMetricStats(allFeatures),
    });
  } catch (error) {
    console.warn("Parcel water API failed, falling back to WFS features.", error);
    allFeatures = await loadVisibleCylinderFeatures(cameraRectangle);
  }

  if (
    requestSeq !== cylinderRequestSeq ||
    isUnmounted ||
    !cropWaterShowCylinder.value
  ) {
    return;
  }

  const previousCylinderItems = new Map(
    animatedCylinderItems.map((item) => [item.key, item])
  );
  const shouldPlayEntryAnimation = !hasInitializedCylinderLayer;

  removeCylinderLayer();
  stopDemoCylinderAnimation();
  clearVisibleLabels();

  const visibleFeatures = [];

  for (const feature of allFeatures) {
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const point = Cesium.Cartographic.fromDegrees(center[0], center[1]);

    if (
      Cesium.Rectangle.contains(cameraRectangle, point) &&
      isFeatureCenterInMainViewport(center)
    ) {
      visibleFeatures.push(feature);
    }
  }

  const uniqueVisibleFeatures = getUniqueCylinderFeatures(visibleFeatures);
  const uniqueBboxFeatures = getUniqueCylinderFeatures(allFeatures);
  const cylinderFeatureSource = uniqueVisibleFeatures.length
    ? uniqueVisibleFeatures
    : uniqueBboxFeatures;
  const animatedFeatures = selectCylinderFeaturesForViewport(cylinderFeatureSource);
  console.info("[crop-water-map] parcel cylinder render candidates", {
    crop: cropWaterActiveCrop.value,
    date: cropWaterActiveDate.value,
    metric: cropWaterActiveMetric.value,
    apiFeatureCount: allFeatures.length,
    visibleFeatureCount: visibleFeatures.length,
    uniqueVisibleCount: uniqueVisibleFeatures.length,
    uniqueFallbackCount: uniqueBboxFeatures.length,
    animatedFeatureCount: animatedFeatures.length,
    firstFeature: animatedFeatures[0]?.properties,
    firstCenter: animatedFeatures[0] ? getFeatureCenter(animatedFeatures[0]) : null,
  });
  updateViewportCropFromFeatures(animatedFeatures);

  for (let i = 0; i < animatedFeatures.length; i++) {
    const feature = animatedFeatures[i];
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const [lon, lat] = center;
    const objectId = getFeatureObjectId(feature, i);
    const crop = getFeatureCrop(feature);
    const itemKey = getCylinderItemKey(crop, objectId);
    const previousItem = previousCylinderItems.get(itemKey);
    const hasPreviousItem = !!previousItem;
    const shouldAnimateFromGround = shouldPlayEntryAnimation;
    const radius = getFeatureCylinderRadius();
    const targetValue = getFeatureCylinderValue(feature, objectId);
    const waterMixRatio = getFeatureGreenWaterRatio(feature, objectId);
    const rawTargetHeight = getDemoCylinderHeightFromValue(targetValue);
    const previousHeight = previousItem?.currentHeight ?? rawTargetHeight;
    const previousValue = previousItem?.currentValue ?? targetValue;
    const targetHeight = rawTargetHeight;
    const shouldAnimateValueChange =
      hasPreviousItem &&
      (Math.abs(previousHeight - targetHeight) > 0.5 ||
        Math.abs(previousValue - targetValue) > 0.001);
    const shouldAnimateCylinder =
      shouldAnimateFromGround || shouldAnimateValueChange;
    const baseMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(lon, lat, 0)
    );

    const primitive = viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.CylinderGeometry({
            length: demoMaxCylinderHeight,
            topRadius: radius,
            bottomRadius: radius,
            slices: animatedCylinderSlices,
            vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
          }),
        }),
        modelMatrix: getCylinderModelMatrixForHeight(
          baseMatrix,
          demoMaxCylinderHeight,
          shouldAnimateFromGround ? zeroValueThreshold : previousHeight
        ),
        appearance: new Cesium.MaterialAppearance({
          translucent: true,
          closed: true,
          faceForward: true,
          flat: true,
          material: Cesium.Material.fromType("Color", {
            color: getColorByMetric(waterMixRatio),
          }),
        }),
        asynchronous: false,
      })
    );
    primitive.show =
      targetValue > zeroValueThreshold &&
      (shouldAnimateFromGround ? targetHeight : previousHeight) > 1;

    const pulseOffset = seededRandom(hashString(String(objectId))) * Math.PI * 2;
    const heightState = {
      value: shouldAnimateFromGround
        ? 0
        : previousHeight,
      metricValue: shouldAnimateFromGround
        ? 0
        : previousValue,
      pulseOffset,
      waterMixRatio,
      showGlow:
        (shouldAnimateFromGround ? 0 : previousValue) > zeroValueThreshold,
      showLabel: false,
    };
    const topEntity = viewer.entities.add({
      name: `${getMetricLabel()} base`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      show:
        targetValue <= zeroValueThreshold ||
        (targetValue > zeroValueThreshold && heightState.value > 1),
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(
          () => radius,
          false
        ),
        semiMinorAxis: new Cesium.CallbackProperty(
          () => radius,
          false
        ),
        height: 1.2,
        heightReference: Cesium.HeightReference.NONE,
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(
            () => getTopSurfaceColor(heightState),
            false
          )
        ),
        outline: true,
        outlineColor: new Cesium.CallbackProperty(
          () => getColorByMetric(heightState?.waterMixRatio).withAlpha(0.44),
          false
        ),
      },
    });

    const glowEntity = viewer.entities.add({
      name: `${getMetricLabel()} base glow`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      show: new Cesium.CallbackProperty(() => heightState.showGlow, false),
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(
          () => radius,
          false
        ),
        semiMinorAxis: new Cesium.CallbackProperty(
          () => radius,
          false
        ),
        height: 1.6,
        heightReference: Cesium.HeightReference.NONE,
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(
            () => getTopGlowColor(heightState),
            false
          )
        ),
        outline: false,
      },
    });

    const labelState = { item: null };
    const labelEntity = viewer.entities.add({
      name: `${getMetricLabel()} label`,
      show: new Cesium.CallbackProperty(
        () =>
          heightState.showLabel &&
          !!labelState.item &&
          shouldPrintMetricLabelValue(labelState.item.targetValue),
        false
      ),
      position: new Cesium.CallbackProperty(
        () => Cesium.Cartesian3.fromDegrees(lon, lat, heightState.value + 22),
        false
      ),
      label: {
        text: new Cesium.CallbackProperty(
          () => formatVisibleMetricLabelValue(labelState.item?.targetValue),
          false
        ),
        font: "13px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -6),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 200000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    const item = {
      primitive,
      topEntity,
      glowEntity,
      labelEntity,
      feature,
      key: itemKey,
      baseMatrix,
      seed: objectId,
      crop,
      geometryHeight: demoMaxCylinderHeight,
      targetHeight,
      currentHeight: shouldAnimateFromGround
        ? 0
        : previousHeight,
      startHeight: shouldAnimateFromGround
        ? 0
        : previousHeight,
      targetValue,
      currentValue: shouldAnimateFromGround
        ? 0
        : previousValue,
      startValue: shouldAnimateFromGround
        ? 0
        : previousValue,
      labelRank: i,
      lon,
      lat,
      heightState,
      durationMs: getCylinderTransitionDuration(targetValue),
      progress: shouldAnimateCylinder ? 0 : 1,
      hasStarted: !shouldAnimateCylinder,
      startDelayMs: 0,
    };
    labelState.item = item;
    animatedCylinderItems.push(item);
    cylinderEntities.push(primitive);
    cylinderEntities.push(topEntity);
    cylinderEntities.push(glowEntity);
    cylinderEntities.push(labelEntity);
  }

  hasInitializedCylinderLayer = true;
  updateCylinderLabelRanks();

  let lastAnimationTime = performance.now();
  let lastLabelLayoutTime = 0;

  function animate() {
    if (!viewer || !viewer.scene) return;

    const now = performance.now();
    const frameDelta = Math.min(now - lastAnimationTime, 34);
    lastAnimationTime = now;
    let hasAnimatingItem = false;

    for (const item of animatedCylinderItems) {
      if (!item.hasStarted) {
        item.hasStarted = true;
      }

      item.progress = Math.min(
        item.progress + frameDelta / item.durationMs,
        1
      );

      const easedProgress = easeInOutSine(item.progress);
      item.currentHeight = lerp(item.startHeight, item.targetHeight, easedProgress);
      item.currentValue = lerp(item.startValue, item.targetValue, easedProgress);
      item.primitive.modelMatrix = getCylinderModelMatrixForHeight(
        item.baseMatrix,
        item.geometryHeight,
        item.currentHeight
      );
      item.heightState.value = item.currentHeight;
      item.heightState.metricValue = item.currentValue;
      item.heightState.showLabel = shouldShowCylinderLabel(item);
      const shouldShowCylinder = shouldShowCylinderBody(item);
      item.heightState.showGlow = shouldShowCylinder;
      item.primitive.show = shouldShowCylinder;
      item.topEntity.show = shouldShowCylinderDisk(item);

      if (item.progress < 1) {
        hasAnimatingItem = true;
      }
    }

    if (now - lastLabelLayoutTime > 260) {
      lastLabelLayoutTime = now;
      updateCylinderLabelRanks();

      for (const item of animatedCylinderItems) {
        item.heightState.showLabel = shouldShowCylinderLabel(item);
      }
    }

    viewer.scene.requestRender();

    if (hasAnimatingItem) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      animationFrameId = null;
    }
  }

  animate();
}

async function loadVisibleCylinderFeatures(cameraRectangle) {
  const bbox = rectangleToBbox(cameraRectangle);
  const activeLayerNames = getActiveCylinderLayerNames();
  const results = await Promise.allSettled(
    activeLayerNames.map((layerName) =>
      loadLayerGeojson(layerName, bbox)
    )
  );

  const features = results
    .flatMap((result, index) => {
      if (result.status === "fulfilled") {
        return result.value.features || [];
      }

      console.warn(
        `Cylinder WFS layer failed to load: ${activeLayerNames[index]}`,
        result.reason
      );
      return [];
    })
    .filter((feature) => feature.geometry);

  if (features.length > 0) {
    console.info(`Cylinder WFS loaded ${features.length} features.`);
    return features;
  }

  console.warn("Cylinder WFS returned no parcel features in current viewport, trying layer fallback.");
  const fallbackResults = await Promise.allSettled(
    activeLayerNames.map((layerName) =>
      loadLayerGeojson(layerName, null, sampledCylinderFeatureCount)
    )
  );
  const fallbackFeatures = fallbackResults
    .flatMap((result, index) => {
      if (result.status === "fulfilled") {
        return result.value.features || [];
      }

      console.warn(
        `Cylinder WFS fallback layer failed to load: ${activeLayerNames[index]}`,
        result.reason
      );
      return [];
    })
    .filter((feature) => feature.geometry);

  if (fallbackFeatures.length > 0) {
    console.info(`Cylinder WFS fallback loaded ${fallbackFeatures.length} features.`);
    return fallbackFeatures;
  }

  console.warn("Cylinder WFS returned no parcel features.");
  return [];
}

function getActiveCylinderLayerNames() {
  const activeCropName = cropWaterActiveCrop.value;
  const selectedLayers = activeCropWaterDisplayLayers
    .filter((layer) => layer.crop === activeCropName)
    .map((layer) => layer.name);

  return selectedLayers.length ? selectedLayers : cropWaterCylinderLayers();
}

function getCylinderItemKey(crop, objectId) {
  return `${crop || "crop"}:${objectId}`;
}

function isFeatureCenterInMainViewport(center) {
  if (!viewer?.scene || !Array.isArray(center)) return false;

  const position = Cesium.Cartesian3.fromDegrees(center[0], center[1], 0);
  const screenPosition = toScreenPosition(position);
  const canvas = viewer.scene.canvas;
  const width = canvas?.clientWidth || canvas?.width || 1;
  const height = canvas?.clientHeight || canvas?.height || 1;

  if (!screenPosition) return false;

  return (
    screenPosition.x >= -cylinderVisualRadius &&
    screenPosition.x <= width + cylinderVisualRadius &&
    screenPosition.y >= -cylinderVisualRadius &&
    screenPosition.y <= height + cylinderVisualRadius
  );
}

function rectangleToBbox(rectangle) {
  const west = Cesium.Math.toDegrees(rectangle.west);
  const south = Cesium.Math.toDegrees(rectangle.south);
  const east = Cesium.Math.toDegrees(rectangle.east);
  const north = Cesium.Math.toDegrees(rectangle.north);

  return { west, south, east, north };
}

function updateViewportCropFromCamera() {
  if (!viewer?.camera || !cropWaterLayerExtents.size) return;

  const cameraRectangle = viewer.camera.computeViewRectangle();
  if (!cameraRectangle) return;

  const viewport = rectangleToBbox(cameraRectangle);
  const viewportCenter = {
    lon: (viewport.west + viewport.east) / 2,
    lat: (viewport.south + viewport.north) / 2,
  };
  const centeredCrop = getCropContainingPoint(viewportCenter);
  const nextCrop = centeredCrop || getBestOverlappingCrop(viewport);

  if (nextCrop && cropWaterViewportCrop.value !== nextCrop) {
    cropWaterViewportCrop.value = nextCrop;
  }
}

function updateViewportCropFromFeatures(features) {
  if (!viewer?.scene || !Array.isArray(features) || !features.length) return;

  const canvas = viewer.scene.canvas;
  const width = canvas?.clientWidth || canvas?.width || 1;
  const height = canvas?.clientHeight || canvas?.height || 1;
  const centerX = width / 2;
  const centerY = height / 2;
  const cropScores = new Map();

  for (const feature of features) {
    const center = getFeatureCenter(feature);
    const crop = getFeatureCrop(feature);
    if (!center || !crop) continue;

    const screenPosition = toScreenPosition(
      Cesium.Cartesian3.fromDegrees(center[0], center[1], 0)
    );
    if (!screenPosition) continue;

    const normalizedDistance = Math.hypot(
      (screenPosition.x - centerX) / width,
      (screenPosition.y - centerY) / height
    );
    const centerWeight = Math.max(1.4 - normalizedDistance * 2.2, 0.25);
    const areaWeight = Math.sqrt(Math.max(getApproximateGeometryArea(feature), 1));
    const score = centerWeight * Math.min(areaWeight / 1200, 4);

    cropScores.set(crop, (cropScores.get(crop) || 0) + score);
  }

  let bestCrop = null;
  let bestScore = 0;

  for (const [crop, score] of cropScores.entries()) {
    if (score > bestScore) {
      bestCrop = crop;
      bestScore = score;
    }
  }

  if (bestCrop && cropWaterViewportCrop.value !== bestCrop) {
    cropWaterViewportCrop.value = bestCrop;
  }
}

function getCropContainingPoint(point) {
  for (const [crop, extent] of cropWaterLayerExtents.entries()) {
    if (
      point.lon >= extent.west &&
      point.lon <= extent.east &&
      point.lat >= extent.south &&
      point.lat <= extent.north
    ) {
      return crop;
    }
  }

  return null;
}

function getBestOverlappingCrop(viewport) {
  let bestCrop = null;
  let bestScore = 0;

  for (const [crop, extent] of cropWaterLayerExtents.entries()) {
    const west = Math.max(viewport.west, extent.west);
    const east = Math.min(viewport.east, extent.east);
    const south = Math.max(viewport.south, extent.south);
    const north = Math.min(viewport.north, extent.north);
    const score = Math.max(east - west, 0) * Math.max(north - south, 0);

    if (score > bestScore) {
      bestScore = score;
      bestCrop = crop;
    }
  }

  return bestCrop;
}

function buildRandomViewportFeatures(cameraRectangle, count) {
  const features = [];
  const safeCount = Math.min(Math.max(count, 36), 150);
  const canvas = viewer?.scene?.canvas;
  const width = canvas?.clientWidth || canvas?.width || 1;
  const height = canvas?.clientHeight || canvas?.height || 1;

  for (let i = 0; i < safeCount * 3 && features.length < safeCount; i++) {
    const seed = hashString(
      `${cropWaterActiveCrop.value}:${cropWaterActiveDate.value}:${i}:${width}:${height}`
    );
    const screenX = lerp(width * 0.08, width * 0.92, seededRandom(seed));
    const screenY = lerp(height * 0.08, height * 0.56, seededRandom(seed + 17));
    const coordinate = pickGlobeCoordinateFromScreen(screenX, screenY);

    if (!coordinate) continue;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinate,
      },
      properties: {
        objectid: seed,
        sourceLayer: "random_viewport",
      },
    });
  }

  return features;
}

function pickGlobeCoordinateFromScreen(x, y) {
  if (!viewer?.camera || !viewer?.scene?.globe) return null;

  const ray = viewer.camera.getPickRay(new Cesium.Cartesian2(x, y));
  if (!ray) return null;

  const cartesian =
    viewer.scene.globe.pick(ray, viewer.scene) ||
    viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(x, y),
      viewer.scene.globe.ellipsoid
    );
  if (!cartesian) return null;

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

  return [lon, lat];
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getPyramidMaxFeatures() {
  const height = viewer?.camera?.positionCartographic?.height ?? 1000000;

  if (height > 1200000) return 80;
  if (height > 650000) return 140;
  if (height > 300000) return 260;
  if (height > 120000) return 420;
  return 650;
}

function getPyramidGridSize() {
  const height = viewer?.camera?.positionCartographic?.height ?? 1000000;

  if (height > 1200000) return 0.12;
  if (height > 650000) return 0.075;
  if (height > 300000) return 0.04;
  if (height > 120000) return 0.02;
  return 0.01;
}

function applyPyramidFeatureSelection(features) {
  const maxFeatures = getPyramidMaxFeatures();
  const gridSize = getPyramidGridSize();
  const selectedByCell = new Map();

  for (let index = 0; index < features.length; index++) {
    const feature = features[index];
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const objectId = getFeatureObjectId(feature, index);
    const value = getFeatureCylinderValue(feature, objectId);
    const key = `${Math.floor(center[0] / gridSize)}:${Math.floor(center[1] / gridSize)}`;
    const existing = selectedByCell.get(key);

    if (!existing || value > existing.value) {
      selectedByCell.set(key, { feature, value });
    }
  }

  return Array.from(selectedByCell.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, maxFeatures)
    .map((item) => item.feature);
}

function getAnimatedCylinderModelMatrix(baseMatrix, targetHeight, progress) {
  const scaleZ = Math.max(progress, 0.0001);
  const currentHeight = targetHeight * scaleZ;
  const translation = Cesium.Matrix4.fromTranslation(
    new Cesium.Cartesian3(0, 0, currentHeight / 2)
  );
  const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(1, 1, scaleZ));
  const localMatrix = Cesium.Matrix4.multiply(
    translation,
    scale,
    new Cesium.Matrix4()
  );

  return Cesium.Matrix4.multiply(baseMatrix, localMatrix, new Cesium.Matrix4());
}

function getCylinderModelMatrixForHeight(baseMatrix, geometryHeight, displayHeight) {
  const safeGeometryHeight = Math.max(Number(geometryHeight) || 1, 1);
  const safeDisplayHeight = Math.max(Number(displayHeight) || 0, 0.01);
  const scaleZ = safeDisplayHeight / safeGeometryHeight;
  const translation = Cesium.Matrix4.fromTranslation(
    new Cesium.Cartesian3(0, 0, safeDisplayHeight / 2)
  );
  const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(1, 1, scaleZ));
  const localMatrix = Cesium.Matrix4.multiply(
    translation,
    scale,
    new Cesium.Matrix4()
  );

  return Cesium.Matrix4.multiply(baseMatrix, localMatrix, new Cesium.Matrix4());
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function removeCylinderLayer() {
  if (!viewer || !viewer.scene) return;

  stopDemoCylinderAnimation();

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  for (const item of cylinderEntities) {
    if (!item) continue;

    if (item instanceof Cesium.Primitive) {
      viewer.scene.primitives.remove(item);
    } else {
      viewer.entities.remove(item);
    }
  }

  cylinderEntities = [];
  animatedCylinderItems = [];
  demoCylinderItems = [];
  clearVisibleLabels();
}

function enableCameraLabelRefresh() {
  if (!viewer || cameraMoveEndRemove) return;

  cameraMoveEndRemove = viewer.camera.moveEnd.addEventListener(() => {
    if (!cropWaterShowCylinder.value) {
      updateViewportCropFromCamera();
      return;
    }

    if (cylinderRefreshTimer) {
      clearTimeout(cylinderRefreshTimer);
    }

    cylinderRefreshTimer = setTimeout(() => {
      cylinderRefreshTimer = null;
      addCylinderLayer();
    }, 260);
  });
}

/* function updateSeasonalVisualization() {
  if (!viewer) return;

  const seasonalState = getSeasonalCropState(cropWaterActiveDate.value);

  resetCropWaterLayerDisplay();

  if (cropWaterIsPlaying.value) {
    if (!cropWaterLockViewport.value && !seasonalOrbitTarget) {
      initializeSeasonalOrbitFromCurrentView(seasonalState);
    }
    viewer.scene.requestRender();
    return;
  }

  viewer.scene.requestRender();
} */
function updateSeasonalVisualization() {
  if (!viewer) return;

  updateSceneEnvironmentByDate();

  const seasonalState = getSeasonalCropState(cropWaterActiveDate.value);

  resetCropWaterLayerDisplay();

  if (cropWaterIsPlaying.value) {
    if (!cropWaterLockViewport.value && !seasonalOrbitTarget) {
      initializeSeasonalOrbitFromCurrentView(seasonalState);
    }
    viewer.scene.requestRender();
    return;
  }

  viewer.scene.requestRender();
}
function updateSceneEnvironmentByDate() {
  if (!viewer) return;

  const date = new Date(cropWaterActiveDate.value);
  if (!Number.isFinite(date.getTime())) return;

  // 固定到当地下午，避免夜晚太暗
  date.setHours(14, 0, 0, 0);

  viewer.clock.currentTime = Cesium.JulianDate.fromDate(date);

  const month = date.getMonth() + 1;

  if (month >= 6 && month <= 8) {
    viewer.scene.globe.brightness = 1.08;
  } else if (month >= 12 || month <= 2) {
    viewer.scene.globe.brightness = 0.88;
  } else {
    viewer.scene.globe.brightness = 1.0;
  }

  viewer.scene.requestRender();
}
function resetCropWaterLayerDisplay() {
  const activeCropName = cropWaterActiveCrop.value;

  for (const item of cropWaterImageryLayers) {
    item.imageryLayer.show = item.crop === activeCropName;
    item.imageryLayer.alpha = 0.9;
    item.imageryLayer.brightness = 1;
    item.imageryLayer.contrast = 1.05;
  }
}

function startSeasonalOrbitFromCurrentView() {
  if (!viewer || !cropWaterIsPlaying.value) return;

  console.info("[crop-water-map] startSeasonalOrbitFromCurrentView", {
    locked: cropWaterLockViewport.value,
    activeCrop: cropWaterActiveCrop.value,
    activeDate: cropWaterActiveDate.value,
  });

  if (typeof viewer.camera.cancelFlight === "function") {
    viewer.camera.cancelFlight();
  }

  const seasonalState = getSeasonalCropState(cropWaterActiveDate.value);
  initializeSeasonalOrbitFromCurrentView(seasonalState);
  stopSeasonalOrbit(false);
  startSeasonalOrbit();
}

function initializeSeasonalOrbitFromCurrentView(seasonalState) {
  if (!viewer?.camera) return;

  const cameraPosition = viewer.camera.positionCartographic;
  const cameraRectangle = viewer.camera.computeViewRectangle();
  if (!cameraPosition) return;

  const lon = Cesium.Math.toDegrees(cameraPosition.longitude);
  const lat = Cesium.Math.toDegrees(cameraPosition.latitude);
  const bbox = cameraRectangle ? rectangleToBbox(cameraRectangle) : null;
  const fallbackSpan = getCurrentCameraRouteSpan();

  seasonalOrbitTarget = {
    lon,
    lat,
    west: bbox?.west ?? lon - fallbackSpan.lon,
    east: bbox?.east ?? lon + fallbackSpan.lon,
    south: bbox?.south ?? lat - fallbackSpan.lat,
    north: bbox?.north ?? lat + fallbackSpan.lat,
    focusCrops: seasonalState?.focusCrops ?? [],
    activeCrop: seasonalState?.activeCrop,
  };
  seasonalOrbitCurrent = { lon, lat };
  seasonalOrbitHeading = viewer.camera.heading;
  seasonalOrbitPitchCurrent = viewer.camera.pitch;
  seasonalOrbitRollCurrent = viewer.camera.roll;
  seasonalOrbitHeight = cameraPosition.height;
  seasonalOrbitRoute = buildSeasonalOrbitRoute(seasonalOrbitTarget);
  seasonalOrbitRouteIndex = 0;
}

function startSeasonalOrbit() {
  if (!viewer || seasonalOrbitFrameId || !cropWaterIsPlaying.value) return;

  console.info("[crop-water-map] startSeasonalOrbit", {
    hasTarget: !!seasonalOrbitTarget,
    routeLength: seasonalOrbitRoute.length,
  });

  if (cropWaterShowCylinder.value && !animatedCylinderItems.length) {
    addCylinderLayer();
  }

  if (!seasonalOrbitTarget) {
    const seasonalState = getSeasonalCropState(cropWaterActiveDate.value);
    const center = getSeasonalFocusCenter(seasonalState);
    if (!center) return;

    seasonalOrbitTarget = {
      lon: center.lon,
      lat: center.lat,
      west: center.west,
      east: center.east,
      south: center.south,
      north: center.north,
      focusCrops: seasonalState.focusCrops ?? [],
      activeCrop: seasonalState.activeCrop,
    };
    seasonalOrbitCurrent = {
      lon: seasonalOrbitTarget.lon,
      lat: seasonalOrbitTarget.lat,
    };
    seasonalOrbitHeading = Cesium.Math.toRadians(seasonalState.heading ?? 0);
    seasonalOrbitPitchCurrent = viewer.camera.pitch;
    seasonalOrbitRollCurrent = viewer.camera.roll;
    seasonalOrbitHeight = viewer.camera.positionCartographic?.height ?? seasonalFocusCameraHeight;
    seasonalOrbitRoute = buildSeasonalOrbitRoute(seasonalOrbitTarget);
    seasonalOrbitRouteIndex = 0;
  }

  if (!seasonalOrbitCurrent) {
    seasonalOrbitRoute = seasonalOrbitRoute.length
      ? seasonalOrbitRoute
      : buildSeasonalOrbitRoute(seasonalOrbitTarget);
    seasonalOrbitCurrent = {
      lon: seasonalOrbitTarget.lon,
      lat: seasonalOrbitTarget.lat,
    };
  }

  seasonalOrbitLastTime = performance.now();
  lastOrbitCylinderRefreshTime = 0;

  const orbit = () => {
    if (!viewer || !cropWaterIsPlaying.value || !seasonalOrbitTarget) {
      seasonalOrbitFrameId = null;
      return;
    }

    const now = performance.now();
    const deltaSeconds = Math.min((now - seasonalOrbitLastTime) / 1000, 0.08);
    seasonalOrbitLastTime = now;
    if (!seasonalOrbitRoute.length) {
      seasonalOrbitRoute = buildSeasonalOrbitRoute(seasonalOrbitTarget);
      seasonalOrbitRouteIndex = 0;
    }

    const sweepTarget = seasonalOrbitRoute[seasonalOrbitRouteIndex] || {
      lon: seasonalOrbitTarget.lon,
      lat: seasonalOrbitTarget.lat,
    };
    seasonalOrbitCurrent = movePointAtConstantSpeed(
      seasonalOrbitCurrent,
      sweepTarget,
      seasonalMoveSpeed * deltaSeconds
    );
    if (
      Math.hypot(
        sweepTarget.lon - seasonalOrbitCurrent.lon,
        sweepTarget.lat - seasonalOrbitCurrent.lat
    ) < seasonalMoveSpeed * Math.max(deltaSeconds, 1)
    ) {
      if (seasonalOrbitRouteIndex < seasonalOrbitRoute.length - 1) {
        seasonalOrbitRouteIndex++;
      } else {
        seasonalOrbitRoute.push(
          getForwardSeasonalRoutePoint(
            seasonalOrbitRoute[seasonalOrbitRoute.length - 1] ||
              seasonalOrbitCurrent
          )
        );
        seasonalOrbitRouteIndex++;
      }
    }
    seasonalOrbitHeading += seasonalOrbitHeadingSpeed * deltaSeconds;

    const destination = Cesium.Cartesian3.fromDegrees(
      seasonalOrbitCurrent.lon,
      seasonalOrbitCurrent.lat,
      seasonalOrbitHeight ??
        viewer.camera.positionCartographic?.height ??
        seasonalFocusCameraHeight
    );

    viewer.camera.setView({
      destination,
      orientation: {
        heading: seasonalOrbitHeading,
        pitch: seasonalOrbitPitchCurrent ?? viewer.camera.pitch,
        roll: seasonalOrbitRollCurrent ?? viewer.camera.roll,
      },
    });
    updateViewportCropFromCamera();

    if (
      cropWaterShowCylinder.value &&
      now - lastOrbitCylinderRefreshTime > orbitCylinderRefreshMs
    ) {
      lastOrbitCylinderRefreshTime = now;
      addCylinderLayer();
    }

    viewer.scene.requestRender();

    seasonalOrbitFrameId = requestAnimationFrame(orbit);
  };

  seasonalOrbitFrameId = requestAnimationFrame(orbit);
}

function buildSeasonalOrbitRoute(target) {
  if (!target) return [];

  const firstPoint = getForwardSeasonalRoutePoint(target);
  const secondPoint = getForwardSeasonalRoutePoint(firstPoint);
  const thirdPoint = getForwardSeasonalRoutePoint(secondPoint);

  return [firstPoint, secondPoint, thirdPoint];
}

function getForwardSeasonalRoutePoint(origin) {
  if (!origin) return null;

  const lonSpan = Number.isFinite(origin.east - origin.west)
    ? Math.abs(origin.east - origin.west)
    : 0;
  const latSpan = Number.isFinite(origin.north - origin.south)
    ? Math.abs(origin.north - origin.south)
    : 0;
  const fallbackSpan = getCurrentCameraRouteSpan();
  const routeStep = clamp(
    0.006,
    Math.min(lonSpan || fallbackSpan.lon, latSpan || fallbackSpan.lat) * 0.24,
    0.02
  );
  const heading = seasonalOrbitHeading || viewer?.camera?.heading || 0;
  const latRadians = Cesium.Math.toRadians(origin.lat);
  const longitudeScale = Math.max(Math.cos(latRadians), 0.35);

  return {
    lon: origin.lon + (Math.sin(heading) * routeStep) / longitudeScale,
    lat: origin.lat + Math.cos(heading) * routeStep,
  };
}

function getCurrentCameraRouteSpan() {
  const height = viewer?.camera?.positionCartographic?.height ?? 8000;
  const baseSpan = clamp(0.006, height / 110000000, 0.028);

  return {
    lon: baseSpan,
    lat: baseSpan * 0.62,
  };
}

function stopSeasonalOrbit(releaseCamera = true) {
  if (seasonalOrbitFrameId) {
    cancelAnimationFrame(seasonalOrbitFrameId);
    seasonalOrbitFrameId = null;
  }

  if (releaseCamera && viewer?.camera) {
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    viewer.scene.requestRender();
  }
}

function movePointAtConstantSpeed(current, target, maxStep) {
  if (!current || !target) return target;

  const lonDelta = target.lon - current.lon;
  const latDelta = target.lat - current.lat;
  const distance = Math.hypot(lonDelta, latDelta);

  if (!Number.isFinite(distance) || distance <= maxStep || distance === 0) {
    return { lon: target.lon, lat: target.lat };
  }

  const ratio = maxStep / distance;

  return {
    lon: current.lon + lonDelta * ratio,
    lat: current.lat + latDelta * ratio,
  };
}

function getSeasonalFocusCenter(seasonalState) {
  if (!seasonalState?.focusCrops?.length) return null;

  if (seasonalState.activeCrop) {
    const denseCenter = cropWaterDenseFocusCenters.get(seasonalState.activeCrop);
    if (denseCenter) {
      return denseCenter;
    }
  }

  const extent = getCropUnionExtent(seasonalState.focusCrops);
  if (!extent) return null;

  return {
    ...extent,
    lon: (extent.west + extent.east) / 2,
    lat: (extent.south + extent.north) / 2,
  };
}

function getCropUnionExtent(crops) {
  const extent = {
    west: Number.POSITIVE_INFINITY,
    south: Number.POSITIVE_INFINITY,
    east: Number.NEGATIVE_INFINITY,
    north: Number.NEGATIVE_INFINITY,
  };

  for (const crop of crops) {
    const cropExtent = cropWaterLayerExtents.get(crop);
    if (!cropExtent) continue;

    extent.west = Math.min(extent.west, cropExtent.west);
    extent.south = Math.min(extent.south, cropExtent.south);
    extent.east = Math.max(extent.east, cropExtent.east);
    extent.north = Math.max(extent.north, cropExtent.north);
  }

  if (![extent.west, extent.south, extent.east, extent.north].every(Number.isFinite)) {
    return null;
  }

  const lonPadding = Math.max((extent.east - extent.west) * 0.14, 0.08);
  const latPadding = Math.max((extent.north - extent.south) * 0.14, 0.06);

  return {
    west: extent.west - lonPadding,
    south: extent.south - latPadding,
    east: extent.east + lonPadding,
    north: extent.north + latPadding,
  };
}

function getSeasonalCropState(date) {
  const time = new Date(date).getTime();
  const dateTime = (value) => new Date(value).getTime();
  const makeWeights = (activeCrop, strength) => ({
    wheat: activeCrop === "wheat" ? strength : 0.02,
    corn: activeCrop === "corn" ? strength : 0.02,
    vegetables: activeCrop === "vegetables" ? strength : 0.02,
  });

  if (time < dateTime("2025-05-01")) {
    const progress = smoothDateProgress(time, "2024-10-05", "2025-05-01");
    const springPeak = Math.exp(-Math.pow((progress - 0.78) / 0.22, 2));

    return {
      weights: makeWeights("wheat", lerp(0.45, 1.1, springPeak)),
      energy: lerp(0.46, 0.98, springPeak),
      focusKey: "wheat-2024-2025",
      focusCrops: ["wheat"],
      activeCrop: "wheat",
      heading: 8,
    };
  }

  if (time < dateTime("2025-05-10")) {
    const progress = smoothDateProgress(time, "2025-05-01", "2025-05-10");

    return {
      weights: makeWeights("vegetables", lerp(0.7, 0.95, progress)),
      energy: lerp(0.78, 0.94, progress),
      focusKey: "vegetables-2025",
      focusCrops: ["vegetables"],
      activeCrop: "vegetables",
      heading: 16,
    };
  }

  if (time < dateTime("2025-09-26")) {
    const progress = smoothDateProgress(time, "2025-05-10", "2025-09-25");

    return {
      weights: makeWeights("corn", lerp(0.72, 1.12, progress)),
      energy: lerp(0.82, 1.0, progress),
      focusKey: "corn-2025",
      focusCrops: ["corn"],
      activeCrop: "corn",
      heading: 18,
    };
  }

  const progress = smoothDateProgress(time, "2025-09-26", "2025-10-05");

  return {
    weights: makeWeights("corn", lerp(0.82, 0.62, progress)),
    energy: lerp(0.76, 0.62, progress),
    focusKey: "corn-harvest-2025",
    focusCrops: ["corn"],
    activeCrop: "corn",
    heading: 20,
  };
}

function smoothDateProgress(time, startDate, endDate) {
  return smoothStep(0, 1, clamp01(
    (time - new Date(startDate).getTime()) /
      Math.max(new Date(endDate).getTime() - new Date(startDate).getTime(), 1)
  ));
}

function smoothStep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / Math.max(edge1 - edge0, 1e-6));

  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return Math.min(Math.max(Number(value) || 0, 0), 1);
}

function clamp(min, value, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function disableCameraLabelRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (cylinderRefreshTimer) {
    clearTimeout(cylinderRefreshTimer);
    cylinderRefreshTimer = null;
  }

  if (cameraMoveEndRemove) {
    cameraMoveEndRemove();
    cameraMoveEndRemove = null;
  }
}

function clearVisibleLabels() {
  if (!viewer) return;

  for (const labelEntity of visibleLabelEntities) {
    viewer.entities.remove(labelEntity);
  }

  visibleLabelEntities = [];
}

function toScreenPosition(worldPosition) {
  if (!viewer || !viewer.scene || !worldPosition) return null;

  if (
    Cesium.SceneTransforms &&
    typeof Cesium.SceneTransforms.wgs84ToWindowCoordinates === "function"
  ) {
    return Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      viewer.scene,
      worldPosition
    );
  }

  if (typeof viewer.scene.cartesianToCanvasCoordinates === "function") {
    return viewer.scene.cartesianToCanvasCoordinates(worldPosition);
  }

  return null;
}

function getFeatureCylinderValue(feature, objectId) {
  const waterMatch = findWaterDataByObjectIds(
    [
      objectId,
      feature.properties?.OBJECTID,
      feature.properties?.objectid,
      feature.properties?.field_id,
      feature.properties?.FID_1,
      feature.properties?.FID,
    ]
      .map((value) => normalizeFeatureId(value))
      .filter((value) => value !== null)
  );
  const apiValue = getMetricValueFromWaterData(waterMatch?.waterData);

  if (Number.isFinite(apiValue)) {
    return apiValue;
  }

  const featureValue = getMetricValueFromWaterData(feature.properties);

  if (Number.isFinite(featureValue)) {
    return featureValue;
  }

  return 0;
}

function getMetricValueFromWaterData(waterData) {
  if (!waterData) return undefined;

  if (cropWaterActiveMetric.value === "waterFootprint") {
    return toFiniteNumber(
      waterData.eta ??
        waterData.eta_mm ??
        waterData.dailyWater ??
        waterData.totalWater
    );
  }

  if (cropWaterActiveMetric.value === "blueWater") {
    return toFiniteNumber(waterData.blueWater ?? waterData.blue_water_mm);
  }

  if (cropWaterActiveMetric.value === "greenWater") {
    return toFiniteNumber(waterData.greenWater ?? waterData.green_water_mm);
  }

  return toFiniteNumber(waterData[cropWaterActiveMetric.value]);
}

function getMetricStats(features) {
  const values = (features || [])
    .map((feature, index) =>
      getMetricValueFromWaterData(feature.properties) ??
      getFeatureCylinderValue(feature, getFeatureObjectId(feature, index))
    )
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return {
      count: 0,
      min: null,
      max: null,
      avg: null,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((total, value) => total + value, 0);

  return {
    count: values.length,
    min,
    max,
    avg: sum / values.length,
  };
}

function getRandomWaterValue(feature, objectId) {
  const seedSource = [
    feature.properties?.sourceLayer,
    objectId,
    feature.properties?.OBJECTID,
    feature.properties?.objectid,
    feature.properties?.field_id,
    feature.properties?.FID_1,
    feature.properties?.FID,
  ]
    .filter((value) => value !== undefined && value !== null)
    .join(":");
  const seed = hashString(seedSource || JSON.stringify(feature.geometry?.coordinates?.[0] || []));
  const random = seededRandom(seed);

  if (cropWaterActiveMetric.value === "greenWater") {
    return 0.8 + random * 2.4;
  }

  if (cropWaterActiveMetric.value === "blueWater") {
    return 0.45 + random * 1.8;
  }

  if (cropWaterActiveMetric.value === "irrigationWater") {
    return 0.35 + random * 1.6;
  }

  if (cropWaterActiveMetric.value === "waterFootprint") {
    return 0.8 + random * 2.6;
  }

  return 0.6 + random * 2.2;
}

function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function getColorByMetric(greenWaterRatio = 0.5) {
  const blue = new Cesium.Color(42 / 255, 135 / 255, 235 / 255, 0.64);
  const green = new Cesium.Color(42 / 255, 196 / 255, 112 / 255, 0.64);

  if (cropWaterActiveMetric.value === "greenWater") {
    return green;
  }

  if (
    cropWaterActiveMetric.value === "blueWater" ||
    cropWaterActiveMetric.value === "irrigationWater"
  ) {
    return blue;
  }

  if (
    cropWaterActiveMetric.value === "waterFootprint" ||
    cropWaterActiveMetric.value === "totalWater"
  ) {
    return mixCesiumColor(blue, green, amplifyMixRatio(greenWaterRatio)).withAlpha(0.68);
  }

  return mixCesiumColor(blue, green, 0.5).withAlpha(0.64);
}

function amplifyMixRatio(ratio) {
  const t = Math.min(Math.max(Number(ratio) || 0, 0), 1);
  const stretched = Math.min(Math.max((t - 0.5) * 1.8 + 0.5, 0), 1);

  if (stretched < 0.5) {
    return Math.pow(stretched * 2, 1.45) * 0.5;
  }

  return 1 - Math.pow((1 - stretched) * 2, 1.45) * 0.5;
}

function getFeatureGreenWaterRatio(feature, objectId) {
  const waterData = getFeatureWaterDataByObjectIds([
    objectId,
    feature?.properties?.OBJECTID,
    feature?.properties?.objectid,
    feature?.properties?.field_id,
    feature?.properties?.FID_1,
    feature?.properties?.FID,
  ]
    .map((value) => normalizeFeatureId(value))
    .filter((value) => value !== null));
  const blue = toFiniteNumber(
    waterData?.blueWater ??
      feature?.properties?.blueWater ??
      feature?.properties?.blue_water_mm
  );
  const green = toFiniteNumber(
    waterData?.greenWater ??
      feature?.properties?.greenWater ??
      feature?.properties?.green_water_mm
  );
  const total = blue + green;

  if (total > 0) {
    return green / total;
  }

  return getFallbackGreenWaterRatio(feature, objectId);
}

function getFallbackGreenWaterRatio(feature, objectId) {
  const crop = getFeatureCrop(feature);
  const cropBaseRatio = {
    wheat: 0.58,
    corn: 0.48,
    vegetables: 0.52,
  }[crop] ?? 0.5;
  const seed = hashString(
    [
      objectId,
      crop,
      cropWaterActiveDate.value,
      feature?.properties?.sourceLayer,
    ].join(":")
  );
  const localVariation = (seededRandom(seed) - 0.5) * 0.24;
  const seasonalVariation =
    Math.sin(getDayIndexFromDate(cropWaterActiveDate.value) / 17 + seededRandom(seed + 11) * 6.28) *
    0.04;

  return Math.min(Math.max(cropBaseRatio + localVariation + seasonalVariation, 0.18), 0.82);
}

function mixCesiumColor(fromColor, toColor, ratio) {
  const t = Math.min(Math.max(Number(ratio) || 0, 0), 1);

  return new Cesium.Color(
    lerp(fromColor.red, toColor.red, t),
    lerp(fromColor.green, toColor.green, t),
    lerp(fromColor.blue, toColor.blue, t),
    lerp(fromColor.alpha, toColor.alpha, t)
  );
}

function getTopSurfaceColor(heightState) {
  const pulse = getPulseValue(heightState);
  const alpha = heightState?.showGlow ? 0.18 + pulse * 0.08 : 0.12;

  return getColorByMetric(heightState?.waterMixRatio).withAlpha(alpha);
}

function getTopGlowColor(heightState) {
  const pulse = getPulseValue(heightState);
  const alpha = heightState?.showGlow ? 0.04 + pulse * 0.06 : 0;

  return getColorByMetric(heightState?.waterMixRatio).withAlpha(alpha);
}

function getPulsedTopRadius(radius, heightState, strength) {
  const pulse = getPulseValue(heightState);
  const activeBoost = heightState?.showGlow ? pulse * strength : 0;

  return radius * (1 + activeBoost);
}

function getPulseValue(heightState) {
  const now = performance.now ? performance.now() : Date.now();
  const offset = heightState?.pulseOffset || 0;

  return (Math.sin(now / 720 + offset) + 1) / 2;
}

function formatMetricLabelValue(value) {
  const number = Number(value);
  const formattedValue = Number.isFinite(number) ? number.toFixed(2) : "--";

  return `${formattedValue} mm`;
}

function formatVisibleMetricLabelValue(value) {
  const number = Number(value);

  if (!shouldPrintMetricLabelValue(number)) {
    return "";
  }

  return formatMetricLabelValue(number);
}

function shouldPrintMetricLabelValue(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= labelValueThreshold;
}

function getMetricLabel() {
  const labels = {
    dailyWater: "Daily water",
    totalWater: "Total Water",
    blueWater: "Total blue water",
    greenWater: "Total green water",
    waterFootprint: "Total Water",
    irrigationWater: "Irrigation water",
  };

  return labels[cropWaterActiveMetric.value] || "Water requirement";
}

function getFeatureCrop(feature) {
  const sourceLayer = feature?.properties?.sourceLayer;
  const cropFromLayer = activeCropWaterDisplayLayers.find(
    (layer) => layer.name === sourceLayer
  )?.crop;

  return (
    cropFromLayer ||
    feature?.properties?.crop ||
    feature?.properties?.crop_type ||
    cropWaterActiveCrop.value
  );
}

function getFeatureObjectId(feature, fallbackIndex = 0) {
  return normalizeFeatureId(
    feature.properties?.OBJECTID ??
      feature.properties?.objectid ??
      feature.properties?.field_id ??
      feature.properties?.FID_1 ??
      feature.properties?.FID ??
      fallbackIndex + 1
  );
}

function normalizeFeatureId(value) {
  if (value === undefined || value === null || value === "unknown") return null;

  const text = String(value).trim();
  if (!text) return null;

  const number = Number(text);
  return Number.isFinite(number) ? number : text;
}

function getEntityProperty(entity, fieldName) {
  if (!entity.properties) return "unknown";

  const prop = entity.properties[fieldName];
  if (!prop) return "unknown";

  const value = prop.getValue ? prop.getValue(Cesium.JulianDate.now()) : prop;

  return value ?? "unknown";
}

function getEntityObjectId(entity) {
  const upperObjectId = getEntityProperty(entity, "OBJECTID");
  if (upperObjectId !== "unknown") return upperObjectId;

  const lowerObjectId = getEntityProperty(entity, "objectid");
  if (lowerObjectId !== "unknown") return lowerObjectId;

  const fieldId = getEntityProperty(entity, "field_id");
  if (fieldId !== "unknown") return fieldId;

  const fid1 = getEntityProperty(entity, "FID_1");
  if (fid1 !== "unknown") return fid1;

  return getEntityProperty(entity, "FID");
}

function getEntityObjectIdCandidates(entity, objectId) {
  const candidates = [
    objectId,
    getEntityProperty(entity, "OBJECTID"),
    getEntityProperty(entity, "objectid"),
    getEntityProperty(entity, "field_id"),
    getEntityProperty(entity, "FID_1"),
    getEntityProperty(entity, "FID"),
  ];

  return Array.from(
    new Set(
      candidates
        .map((value) => normalizeFeatureId(value))
        .filter((value) => value !== null)
    )
  );
}

function findWaterDataByObjectIds(objectIds) {
  for (const objectId of objectIds) {
    const waterData = currentWaterDataMap.get(objectId);

    if (waterData) {
      return {
        objectId,
        waterData,
      };
    }
  }

  return null;
}

function getWaterDataByEntity(entity, objectId) {
  const waterData = getFeatureWaterDataByObjectIds(
    getEntityObjectIdCandidates(entity, objectId)
  );

  if (!waterData) {
    return {
      dailyWater: null,
      totalWater: null,
      blueWater: null,
      greenWater: null,
      waterFootprint: null,
      irrigationWater: null,
    };
  }

  return {
    dailyWater: waterData.dailyWater,
    totalWater: waterData.totalWater,
    blueWater: waterData.blueWater,
    greenWater: waterData.greenWater,
    waterFootprint: waterData.waterFootprint,
    irrigationWater: waterData.irrigationWater,
  };
}

function getFeatureWaterDataByObjectIds(objectIds) {
  const apiWaterMatch = findWaterDataByObjectIds(objectIds);

  if (apiWaterMatch?.waterData) {
    return apiWaterMatch.waterData;
  }

  if (!cachedGeojson) return null;

  const feature = cachedGeojson.features.find((item) => {
    const featureObjectId = getFeatureObjectId(item);

    return objectIds.includes(featureObjectId);
  });

  if (!feature) return null;

  return {
    dailyWater: toFiniteNumber(
      feature.properties?.dailyWater ??
        feature.properties?.eta ??
        feature.properties?.eta_mm ??
        toFiniteNumber(feature.properties?.greenWater ?? feature.properties?.green_water_mm) +
          toFiniteNumber(feature.properties?.blueWater ?? feature.properties?.blue_water_mm)
    ),
    totalWater: toFiniteNumber(
      feature.properties?.totalWater ??
        feature.properties?.eta ??
        feature.properties?.eta_mm ??
        toFiniteNumber(feature.properties?.green_water_mm) +
          toFiniteNumber(feature.properties?.blue_water_mm)
    ),
    blueWater: toFiniteNumber(
      feature.properties?.blueWater ?? feature.properties?.blue_water_mm
    ),
    greenWater: toFiniteNumber(
      feature.properties?.greenWater ?? feature.properties?.green_water_mm
    ),
    waterFootprint: toFiniteNumber(
      feature.properties?.waterFootprint ??
        feature.properties?.eta ??
        feature.properties?.eta_mm ??
        feature.properties?.water_footprint_mm
    ),
    irrigationWater: toFiniteNumber(
      feature.properties?.irrigationWater ?? feature.properties?.irrigation_use_mm
    ),
  };
}

function refreshSelectedFieldInfo() {
  if (!selectedHighlight) return;

  const objectId = getEntityObjectId(selectedHighlight);
  const area = getEntityProperty(selectedHighlight, "Shape_Area");
  const length = getEntityProperty(selectedHighlight, "Shape_Leng");
  const data = getWaterDataByEntity(selectedHighlight, objectId);

  emit("select-field", {
    objectId,
    area: formatNumber(area),
    length: formatNumber(length),
    ...data,
  });
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : value;
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getFeatureCenter(feature) {
  if (!feature?.geometry) return null;

  const polygonCenter = getPointInsideGeometry(feature.geometry);
  if (polygonCenter) return polygonCenter;

  return getAverageCoordinateCenter(feature.geometry.coordinates);
}

function getAverageCoordinateCenter(coordinates) {
  let lonSum = 0;
  let latSum = 0;
  let count = 0;

  eachCoordinate(coordinates, (lon, lat) => {
    lonSum += lon;
    latSum += lat;
    count++;
  });

  if (count === 0) return null;

  const lon = lonSum / count;
  const lat = latSum / count;

  return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
}

function getPointInsideGeometry(geometry) {
  if (!geometry?.coordinates) return null;

  if (geometry.type === "Polygon") {
    return getPointInsidePolygon(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates
      .map((polygon) => ({
        polygon,
        bounds: getPolygonBounds(polygon),
      }))
      .filter((item) => item.bounds)
      .sort((a, b) => getBoundsArea(b.bounds) - getBoundsArea(a.bounds));

    for (const item of polygons) {
      const point = getPointInsidePolygon(item.polygon, item.bounds);
      if (point) return point;
    }
  }

  return null;
}

function getPointInsidePolygon(polygon, bounds = getPolygonBounds(polygon)) {
  if (!bounds) return null;

  const center = [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2];
  if (isPointInPolygon(center, polygon)) return center;

  const averageCenter = getAverageCoordinateCenter(polygon);
  if (averageCenter && isPointInPolygon(averageCenter, polygon)) {
    return averageCenter;
  }

  const samples = [5, 9, 15, 25];
  for (const sampleCount of samples) {
    const point = findInteriorGridPoint(polygon, bounds, sampleCount);
    if (point) return point;
  }

  return null;
}

function findInteriorGridPoint(polygon, bounds, sampleCount) {
  const center = [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2];
  let bestPoint = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let y = 1; y < sampleCount; y++) {
    for (let x = 1; x < sampleCount; x++) {
      const point = [
        bounds.west + ((bounds.east - bounds.west) * x) / sampleCount,
        bounds.south + ((bounds.north - bounds.south) * y) / sampleCount,
      ];

      if (!isPointInPolygon(point, polygon)) continue;

      const distance = Math.hypot(point[0] - center[0], point[1] - center[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = point;
      }
    }
  }

  return bestPoint;
}

function getPolygonBounds(polygon) {
  const outerRing = polygon?.[0];
  if (!Array.isArray(outerRing) || !outerRing.length) return null;

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const point of outerRing) {
    const lon = Number(point?.[0]);
    const lat = Number(point?.[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

    west = Math.min(west, lon);
    south = Math.min(south, lat);
    east = Math.max(east, lon);
    north = Math.max(north, lat);
  }

  if (![west, south, east, north].every(Number.isFinite)) return null;

  return { west, south, east, north };
}

function getBoundsArea(bounds) {
  return Math.max(bounds.east - bounds.west, 0) * Math.max(bounds.north - bounds.south, 0);
}

function isPointInPolygon(point, polygon) {
  const outerRing = polygon?.[0];
  if (!isPointInRing(point, outerRing)) return false;

  for (let i = 1; i < polygon.length; i++) {
    if (isPointInRing(point, polygon[i])) return false;
  }

  return true;
}

function isPointInRing(point, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false;

  const [lon, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i]?.[0]);
    const yi = Number(ring[i]?.[1]);
    const xj = Number(ring[j]?.[0]);
    const yj = Number(ring[j]?.[1]);

    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;

    const edgeHeight = yj - yi;
    if (Math.abs(edgeHeight) < 1e-12) continue;

    const intersects =
      (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / edgeHeight + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function getApproximateGeometryArea(feature) {
  if (!feature?.geometry) return 0;

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  eachCoordinate(feature.geometry.coordinates, (lon, lat) => {
    west = Math.min(west, lon);
    south = Math.min(south, lat);
    east = Math.max(east, lon);
    north = Math.max(north, lat);
  });

  if (
    !Number.isFinite(west) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(north)
  ) {
    return 0;
  }

  const centerLat = (south + north) / 2;
  const widthMeters =
    Math.abs(east - west) * 111320 * Math.max(Math.cos(Cesium.Math.toRadians(centerLat)), 0.1);
  const heightMeters = Math.abs(north - south) * 110540;

  return widthMeters * heightMeters;
}

function eachCoordinate(value, callback) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    callback(value[0], value[1]);
    return;
  }

  for (const child of value) {
    eachCoordinate(child, callback);
  }
}
</script>

<style scoped>
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 64%;
  overflow: hidden;
}

.sun-direction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  height: 64%;
  pointer-events: none;
  mix-blend-mode: soft-light;
  opacity: 0.9;
  transition: background 1.4s linear;
}

:deep(.cesium-widget-credits) {
  display: none !important;
}

.season-environment-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 64%;
  z-index: 99999;
  pointer-events: none;
  transition: background 1.2s linear, opacity 1.2s linear;
}

.crop-growth-overlay {
  position: absolute;
  right: 34px;
  bottom: calc(36% + 24px);
  z-index: 100000;
  width: 112px;
  height: 112px;
  pointer-events: none;
  --growth-progress: 0;
  --growth-main-height: 48px;
  --growth-main-top: 18px;
  --growth-side-height: 30px;
  --growth-side-opacity: 0;
  --growth-leaf-scale: 1;
  --growth-head-opacity: 0;
  --growth-head-scale: 0.72;
  --growth-bloom-opacity: 0;
  --growth-maturity: 0;
  filter:
    drop-shadow(0 8px 12px rgba(0, 0, 0, 0.32))
    drop-shadow(0 0 14px rgba(170, 236, 105, 0.32));
  animation: cropFloat 2.6s ease-in-out infinite;
}

.growth-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.growth-svg-crop {
  display: none;
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform:
    translateY(calc((1 - var(--growth-progress)) * 8px))
    scale(calc(0.76 + var(--growth-progress) * 0.24));
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}

.growth-crop-cotton .growth-svg-cotton,
.growth-crop-corn .growth-svg-corn,
.growth-crop-rice .growth-svg-rice,
.growth-crop-wheat .growth-svg-wheat {
  display: block;
}

.svg-stem,
.svg-panicle-line {
  fill: none;
  stroke: #65c75b;
  stroke-width: 5.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.svg-side-stem {
  opacity: var(--growth-side-opacity);
}

.svg-leaf,
.svg-head,
.svg-head path,
.svg-head ellipse,
.svg-head circle {
  transform-box: fill-box;
  transform-origin: 50% 50%;
}

.svg-leaf {
  fill: url("#unused");
  fill: #70d665;
  transform: scale(var(--growth-leaf-scale));
}

.svg-head {
  opacity: var(--growth-head-opacity);
  transform: scale(var(--growth-head-scale));
}

.growth-stage-seedling .svg-head,
.growth-stage-seedling .svg-side-stem {
  opacity: 0;
}

.growth-stage-seedling .svg-leaf {
  transform: scale(0.72);
}

.growth-stage-dormancy .growth-svg {
  opacity: 0.62;
  filter: drop-shadow(0 0 12px rgba(145, 205, 255, 0.22));
}

.growth-svg-cotton .svg-stem {
  stroke: #5fc65c;
}

.growth-svg-cotton .svg-leaf {
  fill: #69d160;
}

.growth-svg-cotton .svg-cotton-boll {
  opacity: var(--growth-bloom-opacity);
  transform: scale(calc(0.55 + var(--growth-bloom-opacity) * 0.55));
}

.growth-svg-cotton .svg-cotton-boll circle {
  fill: #fff8dd;
  stroke: rgba(210, 244, 188, 0.82);
  stroke-width: 1.8;
}

.growth-svg-corn .svg-stem {
  stroke: #73c24a;
  stroke-width: 6;
}

.growth-svg-corn .svg-leaf {
  fill: #67c84b;
}

.growth-svg-corn .svg-corn-husk {
  fill: #6fb84d;
  stroke: rgba(44, 115, 47, 0.35);
  stroke-width: 1.2;
  opacity: var(--growth-head-opacity);
}

.growth-svg-corn .svg-corn-ear {
  transform-origin: 48px 78px;
}

.growth-svg-corn .svg-corn-cob {
  fill: #f3ba36;
  stroke: #d08c22;
  stroke-width: 2;
}

.growth-svg-corn .svg-kernel {
  fill: #ffe278;
  stroke: rgba(164, 105, 23, 0.26);
  stroke-width: 0.7;
}

.growth-svg-rice .svg-stem,
.growth-svg-rice .svg-panicle-line {
  stroke: #7ac76a;
  stroke-width: 3.5;
}

.growth-svg-rice .svg-leaf {
  fill: #78c96f;
}

.growth-svg-rice .svg-rice-panicle ellipse {
  fill: #d4b852;
  stroke: #9c7a28;
  stroke-width: 1;
  transform: rotate(20deg);
}

.growth-svg-wheat .svg-stem,
.growth-svg-wheat .svg-panicle-line {
  stroke: #c59232;
  stroke-width: 4;
}

.growth-svg-wheat .svg-leaf,
.growth-svg-wheat .svg-wheat-head path:not(.svg-panicle-line) {
  fill: #d9a83a;
}

.growth-stage-maturity .svg-leaf,
.growth-stage-ripening .svg-leaf,
.growth-stage-grain-filling .svg-leaf {
  fill: rgb(
    calc(112 + var(--growth-maturity) * 108),
    calc(214 - var(--growth-maturity) * 42),
    calc(96 - var(--growth-maturity) * 48)
  );
}

.growth-stage-ripening.growth-crop-rice .svg-leaf {
  fill: #79bd67;
}

.growth-part {
  position: absolute;
  display: block;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease,
    background 0.35s ease,
    height 0.35s ease,
    width 0.35s ease;
}

.growth-part::before,
.growth-part::after {
  content: "";
  position: absolute;
  display: block;
}

.growth-stem {
  width: 7px;
  border-radius: 999px;
  background: linear-gradient(180deg, #d7ff72, #5ecb57);
  transform-origin: bottom center;
}

.growth-stem-main {
  left: 35px;
  top: var(--growth-main-top);
  height: var(--growth-main-height);
  transform: rotate(18deg);
}

.growth-stem-side {
  left: 25px;
  top: 30px;
  height: var(--growth-side-height);
  opacity: var(--growth-side-opacity);
  transform: rotate(-16deg);
}

.growth-leaf {
  width: 29px;
  height: 17px;
  border-radius: 100% 0 100% 0;
  background: linear-gradient(135deg, #e8ff7b, #6fda61 55%, #2ea84d);
  box-shadow: inset 4px 0 8px rgba(255, 255, 255, 0.25);
}

.growth-leaf-left {
  left: 17px;
  top: 40px;
  transform: rotate(24deg) scale(var(--growth-leaf-scale));
  transform-origin: right center;
}

.growth-leaf-right {
  left: 39px;
  top: 30px;
  transform: rotate(-54deg) scale(var(--growth-leaf-scale));
  transform-origin: left center;
}

.growth-head {
  left: 36px;
  top: 8px;
  width: 16px;
  height: 24px;
  border-radius: 999px 999px 4px 4px;
  background: linear-gradient(180deg, #f8dc62, #c99120);
  opacity: var(--growth-head-opacity);
  transform: scale(var(--growth-head-scale));
  transform-origin: bottom center;
}

.growth-bloom {
  right: 9px;
  top: 14px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #ffd34d;
  box-shadow: 0 0 14px rgba(255, 211, 77, 0.8);
  opacity: var(--growth-bloom-opacity);
  transform: scale(calc(0.45 + var(--growth-bloom-opacity) * 0.72));
}

.growth-stage-seedling .growth-stem-main {
  height: var(--growth-main-height);
  top: var(--growth-main-top);
}

.growth-stage-seedling .growth-leaf-right,
.growth-stage-seedling .growth-stem-side,
.growth-stage-seedling .growth-head {
  opacity: calc(var(--growth-side-opacity) * 0.8);
}

.growth-stage-flowering .growth-bloom,
.growth-stage-tasseling .growth-bloom,
.growth-stage-heading .growth-bloom {
  opacity: max(0.35, var(--growth-bloom-opacity));
  transform: scale(calc(0.72 + var(--growth-bloom-opacity) * 0.4));
}

.growth-stage-maturity .growth-leaf,
.growth-stage-ripening .growth-leaf,
.growth-stage-grain-filling .growth-leaf {
  background: linear-gradient(
    135deg,
    rgb(
      calc(232 + var(--growth-maturity) * 23),
      calc(255 - var(--growth-maturity) * 22),
      calc(123 - var(--growth-maturity) * 18)
    ),
    rgb(
      calc(111 + var(--growth-maturity) * 106),
      calc(218 - var(--growth-maturity) * 45),
      calc(97 - var(--growth-maturity) * 60)
    ) 55%,
    rgb(
      calc(46 + var(--growth-maturity) * 110),
      calc(168 - var(--growth-maturity) * 46),
      calc(77 - var(--growth-maturity) * 44)
    )
  );
}

.growth-stage-ripening.growth-crop-rice .growth-leaf {
  background: linear-gradient(135deg, #d9ef8a, #77bd67);
}

.growth-stage-dormancy {
  opacity: 0.62;
  filter:
    drop-shadow(0 8px 12px rgba(0, 0, 0, 0.28))
    drop-shadow(0 0 14px rgba(145, 205, 255, 0.2));
}

.growth-stage-dormancy .growth-leaf,
.growth-stage-dormancy .growth-stem {
  background: linear-gradient(135deg, #c9e9ff, #78a8d2);
}

.growth-crop-cotton .growth-stem-main {
  left: 36px;
  top: calc(68px - var(--growth-main-height));
  width: 6px;
  height: var(--growth-main-height);
  background: linear-gradient(180deg, #d7ff7a, #54b84d);
  transform: rotate(16deg);
}

.growth-crop-cotton .growth-stem-side {
  left: 32px;
  top: calc(64px - var(--growth-side-height));
  width: 5px;
  height: var(--growth-side-height);
  opacity: var(--growth-side-opacity);
  background: linear-gradient(180deg, #c5f66e, #4aa248);
  transform: rotate(-24deg);
}

.growth-crop-cotton .growth-leaf-left {
  left: 18px;
  top: 43px;
  width: 29px;
  height: 16px;
  background: linear-gradient(135deg, #dfff77, #5fc65c 58%, #238a45);
  transform: rotate(22deg) scale(var(--growth-leaf-scale));
  transform-origin: right center;
}

.growth-crop-cotton .growth-leaf-right {
  left: 38px;
  top: 37px;
  width: 28px;
  height: 15px;
  background: linear-gradient(135deg, #e8ff8c, #6ad064 58%, #2d994b);
  transform: rotate(-38deg) scale(var(--growth-leaf-scale));
  transform-origin: left center;
}

.growth-crop-cotton .growth-head {
  left: 29px;
  top: 13px;
  width: 22px;
  height: 20px;
  border-radius: 50%;
  opacity: var(--growth-bloom-opacity);
  background: #fff9e8;
  box-shadow:
    -8px 3px 0 -2px #f3ffe0,
    8px 3px 0 -2px #f3ffe0,
    0 9px 0 -3px #e5f7d4,
    0 0 16px rgba(255, 255, 230, 0.86);
  transform: scale(calc(0.55 + var(--growth-bloom-opacity) * 0.55));
  transform-origin: center;
}

.growth-crop-cotton .growth-head::before {
  left: 7px;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.86);
}

.growth-crop-cotton .growth-bloom {
  right: 21px;
  top: 28px;
  width: 8px;
  height: 8px;
  background: #f7e8bc;
  opacity: calc(var(--growth-bloom-opacity) * 0.8);
  box-shadow: 0 0 10px rgba(255, 245, 214, 0.62);
}

.growth-crop-corn .growth-stem-main {
  left: 34px;
  top: var(--growth-main-top);
  width: 10px;
  height: var(--growth-main-height);
  background: linear-gradient(180deg, #e2ff76, #63b842);
  transform: rotate(0deg);
}

.growth-crop-corn .growth-leaf-left {
  left: 9px;
  top: 42px;
  width: 42px;
  height: 16px;
  border-radius: 90% 0 90% 0;
  background: linear-gradient(135deg, #d6fb74, #5dbb3f 60%, #287b36);
  transform: rotate(18deg) scale(var(--growth-leaf-scale));
  transform-origin: right center;
}

.growth-crop-corn .growth-leaf-right {
  left: 37px;
  top: 30px;
  width: 42px;
  height: 16px;
  border-radius: 0 90% 0 90%;
  background: linear-gradient(45deg, #e3ff87, #6fc34c 58%, #2b8540);
  transform: rotate(-44deg) scale(var(--growth-leaf-scale));
  transform-origin: left center;
}

.growth-crop-corn .growth-head {
  left: 29px;
  top: calc(var(--growth-main-top) - 2px);
  width: 21px;
  height: 36px;
  border-radius: 45% 45% 42% 42%;
  opacity: var(--growth-head-opacity);
  background:
    radial-gradient(circle at 30% 22%, #fff18c 0 2px, transparent 3px),
    radial-gradient(circle at 65% 34%, #ffd65c 0 2px, transparent 3px),
    radial-gradient(circle at 38% 52%, #ffd65c 0 2px, transparent 3px),
    radial-gradient(circle at 68% 68%, #d99422 0 2px, transparent 3px),
    linear-gradient(180deg, #ffe977, #d98a20);
  box-shadow:
    inset 4px 0 6px rgba(255, 255, 255, 0.24),
    0 0 12px rgba(255, 206, 68, 0.45);
  transform: scale(var(--growth-head-scale)) rotate(-4deg);
}

.growth-crop-corn .growth-head::before,
.growth-crop-corn .growth-head::after {
  bottom: -5px;
  width: 11px;
  height: 25px;
  border-radius: 90% 0 90% 0;
  background: rgba(108, 180, 68, 0.82);
}

.growth-crop-corn .growth-head::before {
  left: -6px;
  transform: rotate(30deg);
}

.growth-crop-corn .growth-head::after {
  right: -6px;
  transform: rotate(-50deg);
}

.growth-crop-corn .growth-bloom {
  display: none;
}

.growth-crop-rice .growth-stem {
  width: 3px;
  height: var(--growth-main-height);
  background: linear-gradient(180deg, #dffb84, #75c469);
}

.growth-crop-rice .growth-stem-main {
  left: 36px;
  top: var(--growth-main-top);
  transform: rotate(-8deg);
}

.growth-crop-rice .growth-stem-side {
  left: 43px;
  top: calc(var(--growth-main-top) + 2px);
  opacity: var(--growth-side-opacity);
  transform: rotate(10deg);
}

.growth-crop-rice .growth-leaf-left {
  left: 24px;
  top: 48px;
  width: 24px;
  height: 7px;
  border-radius: 100% 0 100% 0;
  background: linear-gradient(135deg, #dfff82, #6fc56b);
  opacity: 0.78;
  transform: rotate(34deg) scale(calc(0.72 + var(--growth-progress) * 0.28));
  transform-origin: right center;
}

.growth-crop-rice .growth-leaf-right {
  left: 39px;
  top: 45px;
  width: 24px;
  height: 7px;
  border-radius: 0 100% 0 100%;
  background: linear-gradient(45deg, #e6ff92, #76c96f);
  opacity: 0.78;
  transform: rotate(-52deg) scale(calc(0.72 + var(--growth-progress) * 0.28));
  transform-origin: left center;
}

.growth-crop-rice .growth-head {
  left: 38px;
  top: calc(var(--growth-main-top) + 7px);
  width: 11px;
  height: 34px;
  border-radius: 999px;
  opacity: var(--growth-head-opacity);
  background:
    radial-gradient(ellipse at 50% 12%, #f6dc74 0 2px, transparent 3px),
    radial-gradient(ellipse at 48% 30%, #e0ca64 0 2px, transparent 3px),
    radial-gradient(ellipse at 52% 48%, #ccb551 0 2px, transparent 3px),
    radial-gradient(ellipse at 46% 66%, #b99b3d 0 2px, transparent 3px),
    radial-gradient(ellipse at 50% 84%, #a88631 0 2px, transparent 3px);
  transform: rotate(32deg) scale(var(--growth-head-scale));
  transform-origin: top center;
}

.growth-crop-rice .growth-head::before {
  left: 5px;
  top: -4px;
  width: 2px;
  height: 34px;
  border-radius: 999px;
  background: rgba(133, 111, 43, 0.82);
  transform: rotate(-6deg);
}

.growth-crop-rice .growth-head::after {
  left: -7px;
  top: 4px;
  width: 10px;
  height: 28px;
  border-radius: 999px;
  background:
    radial-gradient(ellipse at 50% 20%, #ead06a 0 2px, transparent 3px),
    radial-gradient(ellipse at 50% 45%, #cdb45a 0 2px, transparent 3px),
    radial-gradient(ellipse at 50% 70%, #a88631 0 2px, transparent 3px);
  transform: rotate(-15deg);
}

.growth-crop-rice .growth-bloom {
  display: none;
}

.growth-crop-wheat .growth-stem-main {
  left: 35px;
  top: var(--growth-main-top);
  height: var(--growth-main-height);
  width: 5px;
  background: linear-gradient(180deg, #f7d76e, #a97824);
  transform: rotate(0deg);
}

.growth-crop-wheat .growth-leaf {
  background: linear-gradient(135deg, #f8d971, #bd8e2e);
}

.growth-crop-wheat .growth-head {
  left: 29px;
  top: calc(var(--growth-main-top) - 3px);
  width: 22px;
  height: 38px;
  opacity: var(--growth-head-opacity);
  background:
    radial-gradient(ellipse at 28% 12%, #ffe99a 0 3px, transparent 4px),
    radial-gradient(ellipse at 70% 23%, #e2b74f 0 3px, transparent 4px),
    radial-gradient(ellipse at 27% 38%, #f7d76e 0 3px, transparent 4px),
    radial-gradient(ellipse at 72% 52%, #c8902e 0 3px, transparent 4px),
    radial-gradient(ellipse at 30% 68%, #e5b64a 0 3px, transparent 4px),
    linear-gradient(180deg, #f4d36e, #9c6d1f);
  transform: rotate(-8deg) scale(var(--growth-head-scale));
}

.growth-crop-wheat .growth-head::before,
.growth-crop-wheat .growth-head::after {
  top: 4px;
  width: 1.5px;
  height: 38px;
  border-radius: 999px;
  background: rgba(255, 236, 157, 0.72);
}

.growth-crop-wheat .growth-head::before {
  left: 6px;
  transform: rotate(-28deg);
}

.growth-crop-wheat .growth-head::after {
  right: 6px;
  transform: rotate(28deg);
}

.growth-crop-wheat .growth-bloom {
  display: none;
}

.crop-growth-overlay.growth-stage-seedling .growth-stem-main {
  left: 36px;
  top: 38px;
  width: 5px;
  height: 30px;
  transform: rotate(0deg);
}

.crop-growth-overlay.growth-stage-seedling .growth-stem-side,
.crop-growth-overlay.growth-stage-seedling .growth-head,
.crop-growth-overlay.growth-stage-seedling .growth-bloom {
  opacity: 0;
}

.crop-growth-overlay.growth-stage-seedling .growth-leaf-left {
  left: 21px;
  top: 44px;
  width: 25px;
  height: 13px;
  transform: rotate(22deg) scale(0.92);
  transform-origin: right center;
}

.crop-growth-overlay.growth-stage-seedling .growth-leaf-right {
  left: 36px;
  top: 39px;
  width: 25px;
  height: 13px;
  transform: rotate(-42deg) scale(0.92);
  transform-origin: left center;
}

.crop-growth-overlay.growth-crop-cotton.growth-stage-seedling .growth-leaf-left,
.crop-growth-overlay.growth-crop-cotton.growth-stage-seedling .growth-leaf-right {
  background: linear-gradient(135deg, #ddff82, #5fc65c 58%, #268c45);
}

@keyframes cropFloat {
  0% {
    transform: translateY(0px) scale(1);
  }

  50% {
    transform: translateY(-5px) scale(1.08);
  }

  100% {
    transform: translateY(0px) scale(1);
  }
}
</style>
