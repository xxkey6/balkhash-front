<template>
  <div ref="cesiumRef" class="map-container"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import useMapStore from "@/stores/map";
import waterTexture from "@/assets/water.png";

const Cesium = window.Cesium;
const store = useMapStore();
const {
  cropWaterShowCylinder,
  cropWaterActiveMetric,
  cropWaterActiveDate,
  cropWaterActiveCrop,
} = storeToRefs(store);

const emit = defineEmits(["select-field"]);

const cesiumRef = ref(null);

const workspace = "xianhai";
const layerName = "xianhai:1_2_Output";
const geoserverBase =
  process.env.VUE_APP_CROP_GEOSERVER_BASE || "http://localhost:8080/geoserver";
const waterApiBase =
  process.env.VUE_APP_CROP_WATER_API_BASE || "http://localhost:5000";

const wfsUrl =
  `${geoserverBase}/${workspace}/ows?` +
  "service=WFS&version=1.0.0&request=GetFeature" +
  `&typeName=${layerName}` +
  "&outputFormat=application/json" +
  "&srsName=EPSG:4326";

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
let labelItems = [];
let waterRequestSeq = 0;
let currentWaterDataMap = new Map();
let isUnmounted = false;
let waterReloadTimer = null;

const maxAnimatedCylinders = 90;
const maxVisibleLabels = 220;
const fullLabelDisplayThreshold = 120;
const animatedCylinderSlices = 18;
const staticCylinderSlices = 12;
const minLabelPixelDistance = 28;

onMounted(async () => {
  if (!Cesium) {
    console.error("Cesium is not loaded.");
    return;
  }

  try {
    viewer = await initCesium();
    if (isUnmounted) return;

    await flyToLayerExtentFast();
    if (isUnmounted) return;

    const geojson = await loadGeojson();
    if (isUnmounted) return;

    cachedGeojson = geojson;

    await addStyledGeojson(geojson);
    if (isUnmounted) return;

    enableClickInfo();
    enableCameraLabelRefresh();
    await reloadWaterData();
  } catch (error) {
    console.error("Crop water map failed to initialize.", error);
  }
});

watch(
  () => [cropWaterShowCylinder.value, cropWaterActiveMetric.value],
  () => {
    if (!viewer || !cachedGeojson) return;

    if (cropWaterShowCylinder.value) {
      addCylinderLayer();
    } else {
      removeCylinderLayer();
    }
  }
);

watch(
  () => [cropWaterActiveCrop.value, cropWaterActiveDate.value],
  () => {
    scheduleReloadWaterData();
  }
);

onBeforeUnmount(() => {
  isUnmounted = true;
  waterRequestSeq++;
  if (waterReloadTimer) {
    clearTimeout(waterReloadTimer);
    waterReloadTimer = null;
  }
  removeCylinderLayer();
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
  viewerInstance.scene.postProcessStages.fxaa.enabled = true;
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
  const rawLayerName = layerName.split(":")[1];
  let targetLayer = null;

  for (const layer of layers) {
    const nameNode = layer.getElementsByTagName("Name")[0];
    if (!nameNode) continue;

    const name = nameNode.textContent;

    if (name === layerName || name === rawLayerName) {
      targetLayer = layer;
      break;
    }
  }

  if (!targetLayer) return;

  const bboxNode = targetLayer.getElementsByTagName("LatLonBoundingBox")[0];
  if (!bboxNode) return;

  const west = Number(bboxNode.getAttribute("minx"));
  const south = Number(bboxNode.getAttribute("miny"));
  const east = Number(bboxNode.getAttribute("maxx"));
  const north = Number(bboxNode.getAttribute("maxy"));

  if (![west, south, east, north].every(Number.isFinite)) return;

  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
    duration: 1.2,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-75),
      roll: 0,
    },
  });
}

async function loadGeojson() {
  const response = await fetch(wfsUrl);

  if (!response.ok) {
    throw new Error(`WFS request failed: ${response.status}`);
  }

  const geojson = await response.json();

  if (!geojson.features || geojson.features.length === 0) {
    throw new Error("WFS returned no field features.");
  }

  return geojson;
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

async function loadWaterData(crop, dateStr) {
  const response = await fetch(
    `${waterApiBase}/api/water/${crop}/${dateStr}`
  );

  if (!response.ok) {
    throw new Error(`water request failed: ${response.status}`);
  }

  const data = await response.json();
  const waterMap = new Map();

  for (const feature of data.features || []) {
    const props = feature.properties || {};
    const objectid = Number(
      props.objectid ?? props.OBJECTID ?? props.field_id
    );

    if (!Number.isFinite(objectid)) continue;

    const blueWater = toFiniteNumber(props.blueWater ?? props.blue_water_mm);
    const greenWater = toFiniteNumber(props.greenWater ?? props.green_water_mm);
    const waterFootprint = toFiniteNumber(
      props.waterFootprint ?? props.water_footprint_mm
    );
    const irrigationWater = toFiniteNumber(
      props.irrigationWater ?? props.irrigation_use_mm
    );
    const dailyWater = toFiniteNumber(
      props.dailyWater ?? props.eta ?? greenWater + blueWater
    );
    const totalWater = toFiniteNumber(
      props.totalWater ?? greenWater + blueWater
    );

    waterMap.set(objectid, {
      cropType: props.crop_type ?? props.crop,
      dailyWater,
      blueWater,
      greenWater,
      waterFootprint,
      irrigationWater,
      totalWater,
    });
  }

  return waterMap;
}

async function reloadWaterData() {
  if (!viewer || !cachedGeojson) return;

  const requestSeq = ++waterRequestSeq;

  try {
    const waterMap = await loadWaterData(
      cropWaterActiveCrop.value,
      cropWaterActiveDate.value
    );

    if (requestSeq !== waterRequestSeq || isUnmounted) return;

    currentWaterDataMap = waterMap;
    mergeWaterDataToGeojson(cachedGeojson, waterMap);
    refreshSelectedFieldInfo();

    if (cropWaterShowCylinder.value) {
      addCylinderLayer();
    }
  } catch (error) {
    if (requestSeq === waterRequestSeq) {
      console.warn("Crop water data failed to load.", error);
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
    const objectid = Number(
      props.OBJECTID ?? props.objectid ?? props.field_id
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

  clickHandler.setInputAction((click) => {
    const picked = viewer.scene.pick(click.position);

    if (!picked || !picked.id) {
      clearSelectedField();
      return;
    }

    const entity = picked.id;
    if (!entity.polygon) {
      clearSelectedField();
      return;
    }

    resetSelectedStyle();
    highlightSelectedEntity(entity);

    const objectId = getEntityObjectId(entity);
    const area = getEntityProperty(entity, "Shape_Area");
    const length = getEntityProperty(entity, "Shape_Leng");
    const data = getWaterDataByEntity(entity, objectId);

    emit("select-field", {
      objectId,
      area: formatNumber(area),
      length: formatNumber(length),
      ...data,
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
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
  resetSelectedStyle();
  emit("select-field", null);
}

defineExpose({
  clearSelectedField,
});

function addCylinderLayer() {
  if (!viewer || !viewer.scene || !cachedGeojson) return;

  removeCylinderLayer();

  const cameraRectangle = viewer.camera.computeViewRectangle();
  if (!cameraRectangle) return;

  const allFeatures = cachedGeojson.features.filter((feature) => feature.geometry);
  labelItems = buildLabelItems(allFeatures);

  const animatedFeatures = [];
  const staticFeatures = [];

  for (const feature of allFeatures) {
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const point = Cesium.Cartographic.fromDegrees(center[0], center[1]);

    if (Cesium.Rectangle.contains(cameraRectangle, point)) {
      animatedFeatures.push(feature);
    } else {
      staticFeatures.push(feature);
    }
  }

  if (animatedFeatures.length > maxAnimatedCylinders) {
    staticFeatures.push(...animatedFeatures.splice(maxAnimatedCylinders));
  }

  const animationStartTime = performance.now();
  const riseSpeedPerMs = 0.012;
  const radius = 38;

  for (let i = 0; i < animatedFeatures.length; i++) {
    const feature = animatedFeatures[i];
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const [lon, lat] = center;
    const objectId = getFeatureObjectId(feature, i);
    const value = getFeatureCylinderValue(feature, objectId);
    const targetHeight = getCylinderHeight(value);
    const baseMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(lon, lat, 0)
    );

    let primitive = null;
    if (targetHeight > 0) {
      primitive = viewer.scene.primitives.add(
        new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.CylinderGeometry({
            length: targetHeight,
            topRadius: radius,
            bottomRadius: radius,
            slices: animatedCylinderSlices,
            vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
          }),
          }),
          modelMatrix: getAnimatedCylinderModelMatrix(baseMatrix, targetHeight, 0),
          appearance: new Cesium.MaterialAppearance({
            translucent: true,
            closed: true,
            faceForward: true,
            flat: true,
            material: Cesium.Material.fromType("Color", {
              color: getColorByMetric(),
            }),
          }),
          asynchronous: false,
        })
      );
    }

    const heightState = { value: 0 };
    const topEntity = viewer.entities.add({
      name: `${getMetricLabel()} surface`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      show: true,
      ellipse: {
        semiMajorAxis: radius,
        semiMinorAxis: radius,
        height:
          targetHeight > 0
            ? new Cesium.CallbackProperty(() => heightState.value + 1.2, false)
            : 1.2,
        heightReference: Cesium.HeightReference.NONE,
        material: new Cesium.ImageMaterialProperty({
          image: waterTexture,
          transparent: true,
          color: getColorByMetric(),
          repeat: new Cesium.Cartesian2(1.0, 1.0),
        }),
        outline: true,
        outlineColor: getColorByMetric().withAlpha(0.8),
      },
    });

    const valueLabel = null;

    if (primitive) {
      animatedCylinderItems.push({
        primitive,
        topEntity,
        valueLabel,
        baseMatrix,
        targetHeight,
        lon,
        lat,
        heightState,
      });
      cylinderEntities.push(primitive);
    }
    cylinderEntities.push(topEntity);
  }

  const staticCylinderInstances = [];
  const staticTopInstances = [];

  for (let i = 0; i < staticFeatures.length; i++) {
    const feature = staticFeatures[i];
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const [lon, lat] = center;
    const objectId = getFeatureObjectId(feature, i);
    const value = getFeatureCylinderValue(feature, objectId);
    const height = getCylinderHeight(value);
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(lon, lat, height / 2)
    );
    if (height > 0) {
      staticCylinderInstances.push(
        new Cesium.GeometryInstance({
          geometry: new Cesium.CylinderGeometry({
            length: height,
            topRadius: radius,
            bottomRadius: radius,
            slices: staticCylinderSlices,
            vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
          }),
          modelMatrix,
        })
      );
    }

    staticTopInstances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.EllipseGeometry({
          center: Cesium.Cartesian3.fromDegrees(lon, lat),
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          height: Math.max(height, 0) + 1.2,
          vertexFormat:
            Cesium.MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
        }),
      })
    );

  }

  if (staticCylinderInstances.length > 0) {
    const staticCylinderPrimitive = viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: staticCylinderInstances,
        appearance: new Cesium.MaterialAppearance({
          translucent: true,
          closed: true,
          faceForward: true,
          flat: true,
          material: Cesium.Material.fromType("Color", {
            color: getColorByMetric(),
          }),
        }),
        asynchronous: true,
      })
    );

    cylinderEntities.push(staticCylinderPrimitive);
  }

  if (staticTopInstances.length > 0) {
    const staticTopPrimitive = viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: staticTopInstances,
        appearance: new Cesium.MaterialAppearance({
          translucent: true,
          closed: false,
          faceForward: true,
          flat: true,
          material: new Cesium.Material({
            fabric: {
              type: "Image",
              uniforms: {
                image: waterTexture,
                color: getColorByMetric(),
                repeat: new Cesium.Cartesian2(1.0, 1.0),
              },
            },
          }),
        }),
        asynchronous: true,
      })
    );

    cylinderEntities.push(staticTopPrimitive);
  }

  function animate() {
    if (!viewer || !viewer.scene) return;

    const elapsed = performance.now() - animationStartTime;
    let hasAnimatingItem = false;

    for (const item of animatedCylinderItems) {
      const itemDuration = Math.max(item.targetHeight / riseSpeedPerMs, 1);
      const progress = Math.min(elapsed / itemDuration, 1);
      const currentHeight = item.targetHeight * progress;

      item.primitive.modelMatrix = getAnimatedCylinderModelMatrix(
        item.baseMatrix,
        item.targetHeight,
        progress
      );

      item.topEntity.show = true;
      item.heightState.value = currentHeight;

      if (progress < 1) {
        hasAnimatingItem = true;
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
  refreshVisibleLabels();
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

function removeCylinderLayer() {
  if (!viewer || !viewer.scene) return;

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
  labelItems = [];
  clearVisibleLabels();
}

function enableCameraLabelRefresh() {
  if (!viewer || cameraMoveEndRemove) return;

  cameraMoveEndRemove = viewer.camera.moveEnd.addEventListener(() => {
    if (!cropWaterShowCylinder.value || !cachedGeojson) return;

    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refreshVisibleLabels();
    }, 16);
  });
}

function disableCameraLabelRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
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

function refreshVisibleLabels() {
  if (!viewer || !cachedGeojson || !cropWaterShowCylinder.value) {
    clearVisibleLabels();
    return;
  }

  const cameraRectangle = viewer.camera.computeViewRectangle();
  if (!cameraRectangle) return;

  clearVisibleLabels();

  const inViewLabelItems = [];
  for (const item of labelItems) {
    const point = Cesium.Cartographic.fromDegrees(item.lon, item.lat);
    if (!Cesium.Rectangle.contains(cameraRectangle, point)) continue;
    inViewLabelItems.push(item);
  }

  const addLabelEntity = (item) => {
    const worldPosition = Cesium.Cartesian3.fromDegrees(
      item.lon,
      item.lat,
      item.height + 18
    );
    const labelEntity = viewer.entities.add({
      name: `${getMetricLabel()} label`,
      position: worldPosition,
      label: {
        text: formatMetricLabelValue(item.value),
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -8),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
        disableDepthTestDistance: 0,
      },
    });
    visibleLabelEntities.push(labelEntity);
    return worldPosition;
  };

  if (inViewLabelItems.length <= fullLabelDisplayThreshold) {
    for (const item of inViewLabelItems) {
      addLabelEntity(item);
    }
    viewer.scene.requestRender();
    return;
  }

  let visibleCount = 0;
  const acceptedScreenPoints = [];
  const sortedLabelItems = [...inViewLabelItems].sort((a, b) => b.value - a.value);

  for (const item of sortedLabelItems) {
    if (visibleCount >= maxVisibleLabels) break;
    const worldPosition = Cesium.Cartesian3.fromDegrees(item.lon, item.lat, item.height + 18);
    const screenPosition = toScreenPosition(worldPosition);
    if (!screenPosition) continue;

    let isOverlapped = false;
    for (const acceptedPoint of acceptedScreenPoints) {
      const dx = acceptedPoint.x - screenPosition.x;
      const dy = acceptedPoint.y - screenPosition.y;
      if (dx * dx + dy * dy < minLabelPixelDistance * minLabelPixelDistance) {
        isOverlapped = true;
        break;
      }
    }
    if (isOverlapped) continue;

    addLabelEntity(item);
    acceptedScreenPoints.push({
      x: screenPosition.x,
      y: screenPosition.y,
    });
    visibleCount++;
  }

  viewer.scene.requestRender();
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

function buildLabelItems(features) {
  const items = [];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const center = getFeatureCenter(feature);
    if (!center) continue;

    const objectId = getFeatureObjectId(feature, i);
    const value = getFeatureCylinderValue(feature, objectId);
    const height = getCylinderHeight(value);

    items.push({
      lon: center[0],
      lat: center[1],
      value,
      height,
    });
  }

  return items;
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
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
  );
  const apiValue = Number(waterMatch?.waterData?.[cropWaterActiveMetric.value]);

  if (Number.isFinite(apiValue)) {
    return apiValue;
  }

  const featureValue = Number(feature.properties?.[cropWaterActiveMetric.value]);

  if (Number.isFinite(featureValue)) {
    return featureValue;
  }

  return 0;
}

function getHeightScale() {
  switch (cropWaterActiveMetric.value) {
    case "dailyWater":
      return 280;
    case "blueWater":
      return 95;
    case "greenWater":
      return 95;
    case "irrigationWater":
      return 80;
    case "totalWater":
      return 60;
    case "waterFootprint":
      return 0.85;
    default:
      return 60;
  }
}

function getCylinderHeight(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  const scaledValue = Math.pow(numericValue, 1.35);
  const stretchedHeight = scaledValue * getHeightScale() * 0.42 * 2.3;
  const minNonZeroHeight = 95;

  return Math.min(Math.max(stretchedHeight, minNonZeroHeight), 3200);
}

function getColorByMetric() {
  const defaultBlue = new Cesium.Color(44 / 255, 111 / 255, 156 / 255, 0.95);

  if (cropWaterActiveMetric.value === "greenWater") {
    return new Cesium.Color(34 / 255, 197 / 255, 94 / 255, 0.95);
  }

  if (cropWaterActiveMetric.value === "waterFootprint") {
    return new Cesium.Color(245 / 255, 158 / 255, 11 / 255, 0.95);
  }

  if (cropWaterActiveMetric.value === "irrigationWater") {
    return new Cesium.Color(56 / 255, 189 / 255, 248 / 255, 0.95);
  }

  return defaultBlue;
}

function formatMetricLabelValue(value) {
  const number = Number(value);
  const formattedValue = Number.isFinite(number) ? number.toFixed(2) : "--";

  return `${formattedValue} mm`;
}

function getMetricLabel() {
  const labels = {
    dailyWater: "Daily water",
    totalWater: "Total water",
    blueWater: "Total blue water",
    greenWater: "Total green water",
    waterFootprint: "Water footprint",
    irrigationWater: "Irrigation water",
  };

  return labels[cropWaterActiveMetric.value] || "Water requirement";
}

function getFeatureObjectId(feature, fallbackIndex = 0) {
  return Number(
    feature.properties?.OBJECTID ??
      feature.properties?.objectid ??
      feature.properties?.field_id ??
      feature.properties?.FID_1 ??
      feature.properties?.FID ??
      fallbackIndex + 1
  );
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
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
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
        toFiniteNumber(feature.properties?.greenWater ?? feature.properties?.green_water_mm) +
          toFiniteNumber(feature.properties?.blueWater ?? feature.properties?.blue_water_mm)
    ),
    totalWater: toFiniteNumber(
      feature.properties?.totalWater ??
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
      feature.properties?.waterFootprint ?? feature.properties?.water_footprint_mm
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

  let lonSum = 0;
  let latSum = 0;
  let count = 0;

  eachCoordinate(feature.geometry.coordinates, (lon, lat) => {
    lonSum += lon;
    latSum += lat;
    count++;
  });

  if (count === 0) return null;

  const lon = lonSum / count;
  const lat = latSum / count;

  return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
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

:deep(.cesium-widget-credits) {
  display: none !important;
}
</style>
