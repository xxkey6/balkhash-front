<template>
  <div class="field-panel">
    <div class="panel-header">
      <div>
        <div class="title">Field Details</div>
        <div class="subtitle">Information</div>
      </div>

      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="section">
      <div class="row">
        <span>ID</span>
        <b>{{ field.objectId }}</b>
      </div>

      <div class="row">
        <span>Area</span>
        <b>{{ field.area }} m²</b>
      </div>

      <div class="row">
        <span>Length</span>
        <b>{{ field.length }} m</b>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="row highlight">
        <span>Daily ETa</span>
        <b>{{ formatValue(field.dailyWater) }} mm</b>
      </div>

      <div class="row green">
        <span>Green Water</span>
        <b>{{ formatValue(field.greenWater) }} mm</b>
      </div>

      <div class="row blue">
        <span>Blue Water</span>
        <b>{{ formatValue(field.blueWater) }} mm</b>
      </div>

    </div>
  </div>
</template>

<script setup>
defineProps({
  field: {
    type: Object,
    required: true,
  },
});

defineEmits(["close"]);

function formatValue(value) {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return "--";
  }

  return num.toFixed(2);
}
</script>

<style scoped>
.field-panel {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 310px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 193, 7, 0.45);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
  color: #f8fafc;
  z-index: 20;
  backdrop-filter: blur(8px);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
}

.subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: #94a3b8;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 193, 7, 0.45);
  background: rgba(255, 193, 7, 0.12);
  color: #ffc107;
  font-size: 20px;
  line-height: 24px;
  cursor: pointer;
}

.close-btn:hover {
  background: rgba(255, 193, 7, 0.25);
  color: #ffffff;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.row span {
  color: #cbd5e1;
}

.row b {
  color: #ffc107;
  font-size: 14px;
  text-align: right;
}

.row.highlight {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.28);
}

.row.highlight b {
  font-size: 16px;
  color: #fbbf24;
}

.row.blue b {
  color: #38bdf8;
}

.row.green b {
  color: #22c55e;
}

.row.purple {
  display: none;
}

.divider {
  height: 1px;
  margin: 14px 0;
  background: rgba(148, 163, 184, 0.22);
}
</style>
