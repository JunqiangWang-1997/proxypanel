<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createNode, deleteNode, deployNode, fetchNodes, pingNode, updateNode } from './api/nodes';
import {
  createProtocolProfile,
  deleteProtocolProfile,
  fetchProtocolProfiles,
  updateProtocolProfile
} from './api/protocolProfiles';
import { createUser, deleteUser, fetchUsers } from './api/users';
import NodeForm from './components/NodeForm.vue';
import NodeTable from './components/NodeTable.vue';
import ProtocolProfileForm from './components/ProtocolProfileForm.vue';
import ProtocolProfileTable from './components/ProtocolProfileTable.vue';
import UserForm from './components/UserForm.vue';
import UserTable from './components/UserTable.vue';
import type {
  NodeItem,
  NodePayload,
  ProtocolProfileItem,
  ProtocolProfilePayload,
  UserItem,
  UserPayload
} from './types';

const nodes = ref<NodeItem[]>([]);
const profiles = ref<ProtocolProfileItem[]>([]);
const users = ref<UserItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const feedbackMessage = ref('');

const userSubmitting = ref(false);
const nodeSubmitting = ref(false);
const profileSubmitting = ref(false);

const deletingUserId = ref<number | null>(null);
const deletingNodeId = ref<number | null>(null);
const deletingProfileId = ref<number | null>(null);
const probingNodeId = ref<number | null>(null);
const deployingNodeId = ref<number | null>(null);

const editingNode = ref<NodeItem | null>(null);
const editingProfile = ref<ProtocolProfileItem | null>(null);

const profileMap = computed(() => new Map(profiles.value.map((profile) => [profile.id, profile])));
const grpcManageableNodes = computed(() =>
  nodes.value.filter((node) => {
    const profile = node.protocolProfileId ? profileMap.value.get(node.protocolProfileId) : null;

    return (
      node.enabled &&
      ['online', 'imported'].includes(node.deploymentStatus) &&
      node.protocol === 'vless' &&
      Boolean(profile?.supportsGrpcUsers)
    );
  })
);

const loadDashboard = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [nodeList, profileList, userList] = await Promise.all([
      fetchNodes(),
      fetchProtocolProfiles(),
      fetchUsers()
    ]);

    nodes.value = nodeList;
    profiles.value = profileList;
    users.value = userList;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

const refreshNodes = async (): Promise<void> => {
  nodes.value = await fetchNodes();
};

const handleCreateUser = async (payload: UserPayload): Promise<void> => {
  userSubmitting.value = true;
  errorMessage.value = '';

  try {
    users.value = await createUser(payload);
    feedbackMessage.value = '用户已经下发到选中节点。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建失败';
  } finally {
    userSubmitting.value = false;
  }
};

const handleDeleteUser = async (id: number): Promise<void> => {
  deletingUserId.value = id;
  errorMessage.value = '';

  try {
    users.value = await deleteUser(id);
    feedbackMessage.value = '用户已删除。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败';
  } finally {
    deletingUserId.value = null;
  }
};

const handleNodeSubmit = async (payload: NodePayload, id: number | null): Promise<void> => {
  nodeSubmitting.value = true;
  errorMessage.value = '';

  try {
    nodes.value = id === null ? await createNode(payload) : await updateNode(id, payload);
    editingNode.value = null;
    feedbackMessage.value = id === null ? '节点已保存，可以先验证凭据再部署。' : '节点配置已更新。';
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
    feedbackMessage.value = '节点已删除。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '节点删除失败';
  } finally {
    deletingNodeId.value = null;
  }
};

const handleProbeNode = async (id: number): Promise<void> => {
  probingNodeId.value = id;
  errorMessage.value = '';

  try {
    const result = await pingNode(id);
    const target = nodes.value.find((node) => node.id === id);
    feedbackMessage.value = `${target?.name ?? `Node ${id}`} SSH 验证成功：${result.output}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '节点验证失败';
  } finally {
    probingNodeId.value = null;
  }
};

const handleDeployNode = async (id: number): Promise<void> => {
  deployingNodeId.value = id;
  errorMessage.value = '';

  try {
    const result = await deployNode(id);
    await refreshNodes();
    feedbackMessage.value = `部署完成：${result.grpcEndpoint}`;
  } catch (error) {
    await refreshNodes().catch(() => undefined);
    errorMessage.value = error instanceof Error ? error.message : '节点部署失败';
  } finally {
    deployingNodeId.value = null;
  }
};

const handleProfileSubmit = async (payload: ProtocolProfilePayload, id: number | null): Promise<void> => {
  profileSubmitting.value = true;
  errorMessage.value = '';

  try {
    profiles.value = id === null
      ? await createProtocolProfile(payload)
      : await updateProtocolProfile(id, payload);
    editingProfile.value = null;
    feedbackMessage.value = id === null ? '协议模板已创建。' : '协议模板已更新。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '协议模板保存失败';
  } finally {
    profileSubmitting.value = false;
  }
};

const handleDeleteProfile = async (id: number): Promise<void> => {
  deletingProfileId.value = id;
  errorMessage.value = '';

  try {
    profiles.value = await deleteProtocolProfile(id);
    if (editingProfile.value?.id === id) {
      editingProfile.value = null;
    }
    feedbackMessage.value = '协议模板已删除。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '协议模板删除失败';
  } finally {
    deletingProfileId.value = null;
  }
};

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <main class="shell">
    <section class="hero card">
      <div class="hero-copy">
        <p class="eyebrow">ProxyPanel Reframed</p>
        <h1>先定义协议模板，再让后端自己 SSH 上服务器部署。</h1>
        <p>
          这个版本不再要求你手填远端 gRPC 细节。页面里填服务器地址、root 和密码或私钥，
          后端按模板生成 Xray 配置、部署到节点，再把纳管状态回写到这里。
        </p>
      </div>
      <div class="hero-stats">
        <article>
          <span>协议模板</span>
          <strong>{{ profiles.length }}</strong>
        </article>
        <article>
          <span>服务器</span>
          <strong>{{ nodes.length }}</strong>
        </article>
        <article>
          <span>在线节点</span>
          <strong>{{ nodes.filter((node) => node.deploymentStatus === 'online').length }}</strong>
        </article>
      </div>
    </section>

    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="message">正在加载模板、节点和用户数据...</p>
    <p v-else-if="feedbackMessage" class="message success">{{ feedbackMessage }}</p>

    <section class="dashboard">
      <div class="stack">
        <ProtocolProfileForm
          :editing-profile="editingProfile"
          :submitting="profileSubmitting"
          @submit="handleProfileSubmit"
          @cancel="editingProfile = null"
        />
        <NodeForm
          :editing-node="editingNode"
          :profiles="profiles"
          :submitting="nodeSubmitting"
          @submit="handleNodeSubmit"
          @cancel="editingNode = null"
        />
      </div>

      <div class="stack">
        <ProtocolProfileTable
          :profiles="profiles"
          :deleting-id="deletingProfileId"
          :editing-id="editingProfile?.id ?? null"
          @edit="editingProfile = $event"
          @remove="handleDeleteProfile"
        />
        <NodeTable
          :nodes="nodes"
          :deleting-id="deletingNodeId"
          :probing-id="probingNodeId"
          :deploying-id="deployingNodeId"
          :editing-id="editingNode?.id ?? null"
          :last-feedback="feedbackMessage"
          @edit="editingNode = $event"
          @remove="handleDeleteNode"
          @probe="handleProbeNode"
          @deploy="handleDeployNode"
        />
      </div>
    </section>

    <section class="dashboard bottom-grid">
      <div class="stack">
        <UserForm :nodes="grpcManageableNodes" :submitting="userSubmitting" @submit="handleCreateUser" />
      </div>
      <div class="stack">
        <UserTable :users="users" :deleting-id="deletingUserId" @remove="handleDeleteUser" />
      </div>
    </section>
  </main>
</template>
