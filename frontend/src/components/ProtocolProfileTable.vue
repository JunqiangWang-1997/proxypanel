<script setup lang="ts">
import type { ProtocolProfileItem } from '../types';

defineProps<{
  profiles: ProtocolProfileItem[];
  deletingId: number | null;
  editingId: number | null;
}>();

const emit = defineEmits<{
  edit: [profile: ProtocolProfileItem];
  remove: [id: number];
}>();
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Catalog</p>
      <h2>协议模板列表</h2>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>Slug</th>
            <th>协议</th>
            <th>监听</th>
            <th>用户管理</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="profile in profiles" :key="profile.id">
            <td>{{ profile.name }}</td>
            <td class="mono">{{ profile.slug }}</td>
            <td>{{ profile.coreType }} / {{ profile.transport }} / {{ profile.security }}</td>
            <td>{{ profile.listenPort }} / {{ profile.inboundTag }}</td>
            <td>
              <span :class="profile.supportsGrpcUsers ? 'status-live' : 'status-muted'">
                {{ profile.supportsGrpcUsers ? '可由面板下发用户' : '仅部署模板' }}
              </span>
            </td>
            <td class="table-actions">
              <button class="ghost-button" type="button" @click="emit('edit', profile)">
                {{ editingId === profile.id ? '编辑中' : '编辑' }}
              </button>
              <button
                class="danger-button"
                type="button"
                :disabled="deletingId === profile.id"
                @click="emit('remove', profile.id)"
              >
                {{ deletingId === profile.id ? '删除中...' : '删除' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
