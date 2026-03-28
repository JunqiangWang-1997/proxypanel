<script setup lang="ts">
import type { UserItem } from '../types';

defineProps<{
  users: UserItem[];
  deletingId: number | null;
}>();

const emit = defineEmits<{
  remove: [id: number];
}>();
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Users</p>
      <h2>用户列表</h2>
    </div>

    <div v-if="users.length === 0" class="empty-state">
      还没有用户，先创建第一个用户。
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>邮箱</th>
            <th>UUID</th>
            <th>节点</th>
            <th>Flow</th>
            <th>备注</th>
            <th>创建时间</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.email }}</td>
            <td class="mono">{{ user.uuid }}</td>
            <td>{{ user.nodeName }}</td>
            <td>{{ user.flow || '-' }}</td>
            <td>{{ user.remark || '-' }}</td>
            <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
            <td>
              <button
                class="danger-button"
                type="button"
                :disabled="deletingId === user.id"
                @click="emit('remove', user.id)"
              >
                {{ deletingId === user.id ? '删除中...' : '删除' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

