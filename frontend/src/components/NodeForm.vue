<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { NodeItem, NodePayload, ProtocolProfileItem } from '../types';

const props = defineProps<{
  editingNode: NodeItem | null;
  profiles: ProtocolProfileItem[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: NodePayload, id: number | null];
  cancel: [];
}>();

const blankForm = (): NodePayload => ({
  name: '',
  host: '',
  sshPort: 22,
  sshUser: 'root',
  authType: 'privateKey',
  password: '',
  privateKey: '',
  protocolProfileId: props.profiles[0]?.id,
  grpcPort: 10085,
  inboundTag: 'main-inbound',
  tlsEnabled: false,
  enabled: true
});

const form = reactive<NodePayload>(blankForm());

watch(
  () => props.profiles,
  (profiles) => {
    if (!form.protocolProfileId && profiles.length > 0) {
      form.protocolProfileId = profiles[0].id;
    }
  },
  { immediate: true }
);

watch(
  () => props.editingNode,
  (node) => {
    if (!node) {
      Object.assign(form, blankForm());
      return;
    }

    Object.assign(form, {
      name: node.name,
      host: node.host,
      sshPort: node.sshPort,
      sshUser: node.sshUser,
      authType: node.authType,
      password: '',
      privateKey: '',
      protocolProfileId: node.protocolProfileId ?? props.profiles[0]?.id,
      grpcPort: node.grpcPort,
      inboundTag: node.inboundTag,
      tlsEnabled: node.tlsEnabled,
      enabled: node.enabled
    });
  },
  { immediate: true }
);

const isEditing = computed(() => props.editingNode !== null);
const selectedProfile = computed(
  () => props.profiles.find((profile) => profile.id === form.protocolProfileId) ?? null
);

watch(selectedProfile, (profile) => {
  if (!profile || isEditing.value) {
    return;
  }

  if (!form.inboundTag) {
    form.inboundTag = profile.inboundTag;
  }
});

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
      <p class="eyebrow">Servers</p>
      <h2>{{ isEditing ? '编辑服务器节点' : '接入新服务器' }}</h2>
      <p class="panel-copy">填服务器地址和 root 凭据，面板会按所选模板去远端安装并接管 Xray。</p>
    </div>

    <form class="control-form" @submit.prevent="submitForm">
      <label>
        <span>节点名称</span>
        <input v-model.trim="form.name" type="text" placeholder="hk-edge-01" required />
      </label>

      <label>
        <span>服务器 IP / 域名</span>
        <input v-model.trim="form.host" type="text" placeholder="203.0.113.10" required />
      </label>

      <div class="field-grid two">
        <label>
          <span>SSH 端口</span>
          <input v-model.number="form.sshPort" type="number" min="1" max="65535" required />
        </label>

        <label>
          <span>SSH 用户</span>
          <input v-model.trim="form.sshUser" type="text" placeholder="root" required />
        </label>
      </div>

      <div class="field-grid two">
        <label>
          <span>认证方式</span>
          <select v-model="form.authType">
            <option value="privateKey">SSH 私钥</option>
            <option value="password">SSH 密码</option>
          </select>
        </label>

        <label>
          <span>协议模板</span>
          <select v-model.number="form.protocolProfileId" required>
            <option v-for="profile in props.profiles" :key="profile.id" :value="profile.id">
              {{ profile.name }} / {{ profile.coreType }}
            </option>
          </select>
        </label>
      </div>

      <label v-if="form.authType === 'password'">
        <span>Root 密码</span>
        <textarea
          v-model="form.password"
          rows="4"
          :placeholder="isEditing ? '留空表示沿用已保存密码' : '输入服务器密码'"
          :required="!isEditing"
        />
      </label>

      <label v-else>
        <span>SSH 私钥</span>
        <textarea
          v-model="form.privateKey"
          rows="7"
          :placeholder="isEditing ? '留空表示沿用已保存私钥' : '粘贴 OPENSSH / PEM 私钥'"
          :required="!isEditing"
        />
      </label>

      <div class="field-grid two">
        <label>
          <span>控制端口</span>
          <input v-model.number="form.grpcPort" type="number" min="1" max="65535" required />
        </label>

        <label>
          <span>Inbound Tag</span>
          <input v-model.trim="form.inboundTag" type="text" required />
        </label>
      </div>

      <div v-if="selectedProfile" class="inline-note">
        <strong>{{ selectedProfile.name }}</strong>
        <span>{{ selectedProfile.coreType }} / {{ selectedProfile.transport }} / {{ selectedProfile.security }}</span>
      </div>

      <label class="toggle-row">
        <span>启用节点</span>
        <input v-model="form.enabled" type="checkbox" />
      </label>

      <div class="form-actions">
        <button class="primary-button" type="submit" :disabled="props.submitting || props.profiles.length === 0">
          {{ props.submitting ? '提交中...' : (isEditing ? '保存节点' : '保存并待部署') }}
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
