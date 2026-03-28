<script setup lang="ts">
import type { NodeItem } from '../types';

defineProps<{
  nodes: NodeItem[];
  deletingId: number | null;
  probingId: number | null;
  deployingId: number | null;
  editingId: number | null;
  lastFeedback: string;
}>();

const emit = defineEmits<{
  edit: [node: NodeItem];
  remove: [id: number];
  probe: [id: number];
  deploy: [id: number];
}>();
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Fleet</p>
      <h2>服务器节点</h2>
      <span v-if="lastFeedback" class="badge badge-wide">{{ lastFeedback }}</span>
    </div>

    <div v-if="nodes.length === 0" class="empty-state">
      先接入第一台服务器，然后选择一个协议模板去部署。
    </div>

    <div v-else class="server-grid">
      <article v-for="node in nodes" :key="node.id" class="server-card">
        <div class="server-head">
          <div>
            <h3>{{ node.name }}</h3>
            <p class="server-address mono">{{ node.host }}:{{ node.sshPort }}</p>
          </div>
          <span :class="['status-pill', `status-${node.deploymentStatus}`]">
            {{ node.deploymentStatus }}
          </span>
        </div>

        <dl class="meta-list">
          <div>
            <dt>协议模板</dt>
            <dd>{{ node.protocolProfileName || '未绑定' }}</dd>
          </div>
          <div>
            <dt>控制地址</dt>
            <dd class="mono">{{ node.grpcHost }}:{{ node.grpcPort }}</dd>
          </div>
          <div>
            <dt>Inbound</dt>
            <dd>{{ node.inboundTag }}</dd>
          </div>
          <div>
            <dt>认证</dt>
            <dd>{{ node.authType === 'password' ? '密码' : '私钥' }}</dd>
          </div>
          <div>
            <dt>凭据状态</dt>
            <dd>
              {{ node.authType === 'password' ? (node.hasPassword ? '已保存密码' : '未保存') : (node.hasPrivateKey ? '已保存私钥' : '未保存') }}
            </dd>
          </div>
          <div>
            <dt>最近部署</dt>
            <dd>{{ node.lastDeployedAt ? new Date(node.lastDeployedAt).toLocaleString() : '-' }}</dd>
          </div>
        </dl>

        <p class="server-message">{{ node.statusMessage || '等待部署反馈' }}</p>

        <div class="card-actions">
          <button class="ghost-button" type="button" @click="emit('edit', node)">
            {{ editingId === node.id ? '编辑中' : '编辑' }}
          </button>
          <button
            class="ghost-button"
            type="button"
            :disabled="probingId === node.id"
            @click="emit('probe', node.id)"
          >
            {{ probingId === node.id ? '验证中...' : '验证凭据' }}
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="deployingId === node.id"
            @click="emit('deploy', node.id)"
          >
            {{ deployingId === node.id ? '部署中...' : '部署模板' }}
          </button>
          <button
            class="danger-button"
            type="button"
            :disabled="deletingId === node.id"
            @click="emit('remove', node.id)"
          >
            {{ deletingId === node.id ? '删除中...' : '删除' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
