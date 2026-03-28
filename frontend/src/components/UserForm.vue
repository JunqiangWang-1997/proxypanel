<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { NodeItem, UserPayload } from '../types';

const props = defineProps<{
  nodes: NodeItem[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: UserPayload];
}>();

const form = reactive({
  email: '',
  nodeId: 0,
  uuid: '',
  flow: '',
  level: 0,
  remark: ''
});

watch(
  () => props.nodes,
  (nodes) => {
    if (!form.nodeId && nodes.length > 0) {
      form.nodeId = nodes[0].id;
    }
  },
  { immediate: true }
);

const selectedNode = computed(() => props.nodes.find((node) => node.id === form.nodeId) ?? null);

const submitForm = (): void => {
  emit('submit', {
    email: form.email,
    nodeId: form.nodeId,
    uuid: form.uuid || undefined,
    flow: form.flow || undefined,
    level: form.level,
    remark: form.remark || undefined
  });
};
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Create User</p>
      <h2>添加用户</h2>
      <span v-if="selectedNode" class="badge">
        {{ selectedNode.name }} / {{ selectedNode.inboundTag }}
      </span>
    </div>

    <form class="user-form" @submit.prevent="submitForm">
      <label>
        <span>邮箱</span>
        <input v-model.trim="form.email" type="email" placeholder="user@example.com" required />
      </label>

      <label>
        <span>节点</span>
        <select v-model.number="form.nodeId" required>
          <option v-for="node in props.nodes" :key="node.id" :value="node.id">
            {{ node.name }} ({{ node.grpcHost }}:{{ node.grpcPort }})
          </option>
        </select>
      </label>

      <label>
        <span>UUID</span>
        <input
          v-model.trim="form.uuid"
          type="text"
          placeholder="留空自动生成"
        />
      </label>

      <label>
        <span>Flow</span>
        <input
          v-model.trim="form.flow"
          type="text"
          placeholder="xtls-rprx-vision"
        />
      </label>

      <label>
        <span>Level</span>
        <input v-model.number="form.level" type="number" min="0" max="255" />
      </label>

      <label>
        <span>备注</span>
        <input v-model.trim="form.remark" type="text" placeholder="可选备注" />
      </label>

      <button class="primary-button" type="submit" :disabled="props.submitting || props.nodes.length === 0">
        {{ props.submitting ? '提交中...' : '添加用户' }}
      </button>
    </form>
  </section>
</template>

