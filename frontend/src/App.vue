<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createNode, deleteNode, fetchNodes, pingNode, updateNode } from './api/nodes';
import { createUser, deleteUser, fetchUsers } from './api/users';
import NodeForm from './components/NodeForm.vue';
import NodeTable from './components/NodeTable.vue';
import UserForm from './components/UserForm.vue';
import UserTable from './components/UserTable.vue';
import type { NodeItem, NodePayload, UserItem, UserPayload } from './types';

const nodes = ref<NodeItem[]>([]);
const users = ref<UserItem[]>([]);
const loading = ref(true);
const submitting = ref(false);
const nodeSubmitting = ref(false);
const deletingId = ref<number | null>(null);
const deletingNodeId = ref<number | null>(null);
const pingingNodeId = ref<number | null>(null);
const editingNode = ref<NodeItem | null>(null);
const errorMessage = ref('');
const pingMessage = ref('');

const enabledNodes = computed(() => nodes.value.filter((node) => node.enabled));

const loadDashboard = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = '';
  pingMessage.value = '';

  try {
    const [nodeList, userList] = await Promise.all([fetchNodes(), fetchUsers()]);
    nodes.value = nodeList;
    users.value = userList;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

const handleCreateUser = async (payload: UserPayload): Promise<void> => {
  submitting.value = true;
  errorMessage.value = '';

  try {
    users.value = await createUser(payload);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建失败';
  } finally {
    submitting.value = false;
  }
};

const handleDeleteUser = async (id: number): Promise<void> => {
  deletingId.value = id;
  errorMessage.value = '';

  try {
    users.value = await deleteUser(id);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败';
  } finally {
    deletingId.value = null;
  }
};

const handleNodeSubmit = async (payload: NodePayload, id: number | null): Promise<void> => {
  nodeSubmitting.value = true;
  errorMessage.value = '';

  try {
    nodes.value = id === null
      ? await createNode(payload)
      : await updateNode(id, payload);

    editingNode.value = null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '节点保存失败';
  } finally {
    nodeSubmitting.value = false;
  }
};

const handleDeleteNode = async (id: number): Promise<void> => {
  deletingNodeId.value = id;
  errorMessage.value = '';

  try {
    nodes.value = await deleteNode(id);
    if (editingNode.value?.id === id) {
      editingNode.value = null;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '节点删除失败';
  } finally {
    deletingNodeId.value = null;
  }
};

const handlePingNode = async (id: number): Promise<void> => {
  pingingNodeId.value = id;
  errorMessage.value = '';
  pingMessage.value = '';

  try {
    const result = await pingNode(id);
    const target = nodes.value.find((node) => node.id === id);
    pingMessage.value = `${target?.name ?? `Node ${id}`} ping ok @ ${new Date(result.checkedAt).toLocaleTimeString()}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '节点检测失败';
  } finally {
    pingingNodeId.value = null;
  }
};

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <main class="shell">
    <section class="hero card">
      <div>
        <p class="eyebrow">ProxyPanel Starter</p>
        <h1>前后端分离的机场面板起步项目</h1>
      </div>
      <div class="hero-stats">
        <article>
          <span>节点</span>
          <strong>{{ nodes.length }}</strong>
        </article>
        <article>
          <span>用户</span>
          <strong>{{ users.length }}</strong>
        </article>
      </div>
    </section>

    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="message">正在加载面板数据...</p>

    <section class="dashboard">
      <div class="stack">
        <NodeForm
          :editing-node="editingNode"
          :submitting="nodeSubmitting"
          @submit="handleNodeSubmit"
          @cancel="editingNode = null"
        />
        <UserForm :nodes="enabledNodes" :submitting="submitting" @submit="handleCreateUser" />
      </div>
      <div class="stack">
        <NodeTable
          :nodes="nodes"
          :deleting-id="deletingNodeId"
          :pinging-id="pingingNodeId"
          :editing-id="editingNode?.id ?? null"
          :last-ping-message="pingMessage"
          @edit="editingNode = $event"
          @remove="handleDeleteNode"
          @ping="handlePingNode"
        />
        <UserTable :users="users" :deleting-id="deletingId" @remove="handleDeleteUser" />
      </div>
    </section>
  </main>
</template>
