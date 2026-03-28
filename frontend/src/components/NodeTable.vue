<script setup lang="ts">
import type { NodeItem } from '../types';

defineProps<{
  nodes: NodeItem[];
  deletingId: number | null;
  pingingId: number | null;
  editingId: number | null;
  lastPingMessage: string;
}>();

const emit = defineEmits<{
  edit: [node: NodeItem];
  remove: [id: number];
  ping: [id: number];
}>();
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Transport</p>
      <h2>节点列表</h2>
      <span v-if="lastPingMessage" class="badge">{{ lastPingMessage }}</span>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>地址</th>
            <th>Tag</th>
            <th>协议</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in nodes" :key="node.id">
            <td>{{ node.id }}</td>
            <td>{{ node.name }}</td>
            <td class="mono">{{ node.grpcHost }}:{{ node.grpcPort }}</td>
            <td>{{ node.inboundTag }}</td>
            <td>{{ node.protocol }}</td>
            <td>
              <span :class="node.enabled ? 'status-live' : 'status-muted'">
                {{ node.enabled ? 'enabled' : 'disabled' }}
              </span>
            </td>
            <td class="table-actions">
              <button class="ghost-button" type="button" @click="emit('edit', node)">
                {{ editingId === node.id ? '编辑中' : '编辑' }}
              </button>
              <button
                class="ghost-button"
                type="button"
                :disabled="pingingId === node.id"
                @click="emit('ping', node.id)"
              >
                {{ pingingId === node.id ? '检测中...' : 'Ping' }}
              </button>
              <button
                class="danger-button"
                type="button"
                :disabled="deletingId === node.id"
                @click="emit('remove', node.id)"
              >
                {{ deletingId === node.id ? '删除中...' : '删除' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
