<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { NodeItem, NodePayload } from '../types';

const props = defineProps<{
  editingNode: NodeItem | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: NodePayload, id: number | null];
  cancel: [];
}>();

const blankForm = (): NodePayload => ({
  name: '',
  grpcHost: '127.0.0.1',
  grpcPort: 10085,
  inboundTag: 'main-inbound',
  protocol: 'vless',
  tlsEnabled: false,
  enabled: true
});

const form = reactive<NodePayload>(blankForm());

watch(
  () => props.editingNode,
  (node) => {
    Object.assign(form, node ? {
      name: node.name,
      grpcHost: node.grpcHost,
      grpcPort: node.grpcPort,
      inboundTag: node.inboundTag,
      protocol: node.protocol,
      tlsEnabled: node.tlsEnabled,
      enabled: node.enabled
    } : blankForm());
  },
  { immediate: true }
);

const isEditing = computed(() => props.editingNode !== null);

const submitForm = (): void => {
  emit('submit', { ...form }, props.editingNode?.id ?? null);

  if (!isEditing.value) {
    Object.assign(form, blankForm());
  }
};

const cancelEdit = (): void => {
  Object.assign(form, blankForm());
  emit('cancel');
};
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Nodes</p>
      <h2>{{ isEditing ? '编辑节点' : '新增节点' }}</h2>
    </div>

    <form class="user-form" @submit.prevent="submitForm">
      <label>
        <span>名称</span>
        <input v-model.trim="form.name" type="text" placeholder="Tokyo-01" required />
      </label>

      <label>
        <span>gRPC Host</span>
        <input v-model.trim="form.grpcHost" type="text" placeholder="127.0.0.1" required />
      </label>

      <label>
        <span>gRPC Port</span>
        <input v-model.number="form.grpcPort" type="number" min="1" max="65535" required />
      </label>

      <label>
        <span>Inbound Tag</span>
        <input v-model.trim="form.inboundTag" type="text" placeholder="main-inbound" required />
      </label>

      <label>
        <span>协议</span>
        <input v-model.trim="form.protocol" type="text" placeholder="vless" required />
      </label>

      <label class="toggle-row">
        <span>TLS</span>
        <input v-model="form.tlsEnabled" type="checkbox" />
      </label>

      <label class="toggle-row">
        <span>启用</span>
        <input v-model="form.enabled" type="checkbox" />
      </label>

      <div class="form-actions">
        <button class="primary-button" type="submit" :disabled="props.submitting">
          {{ props.submitting ? '提交中...' : (isEditing ? '保存节点' : '添加节点') }}
        </button>
        <button
          v-if="isEditing"
          class="ghost-button"
          type="button"
          :disabled="props.submitting"
          @click="cancelEdit"
        >
          取消
        </button>
      </div>
    </form>
  </section>
</template>

