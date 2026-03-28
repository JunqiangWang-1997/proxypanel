<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { ProtocolProfileItem, ProtocolProfilePayload } from '../types';

const props = defineProps<{
  editingProfile: ProtocolProfileItem | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: ProtocolProfilePayload, id: number | null];
  cancel: [];
}>();

const blankForm = (): ProtocolProfilePayload => ({
  name: '',
  slug: '',
  coreType: 'vless',
  transport: 'tcp',
  security: 'none',
  listenPort: 443,
  inboundTag: 'main-inbound',
  flow: '',
  supportsGrpcUsers: true,
  xrayConfigTemplate: `{
  "inbounds": [],
  "outbounds": []
}`,
  installScript: ''
});

const form = reactive<ProtocolProfilePayload>(blankForm());

watch(
  () => props.editingProfile,
  (profile) => {
    Object.assign(
      form,
      profile
        ? {
            name: profile.name,
            slug: profile.slug,
            coreType: profile.coreType,
            transport: profile.transport,
            security: profile.security,
            listenPort: profile.listenPort,
            inboundTag: profile.inboundTag,
            flow: profile.flow ?? '',
            supportsGrpcUsers: profile.supportsGrpcUsers,
            xrayConfigTemplate: profile.xrayConfigTemplate,
            installScript: profile.installScript ?? ''
          }
        : blankForm()
    );
  },
  { immediate: true }
);

const isEditing = computed(() => props.editingProfile !== null);

watch(
  () => form.name,
  (name) => {
    if (isEditing.value || form.slug.trim().length > 0) {
      return;
    }

    form.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
);

const submitForm = (): void => {
  emit('submit', { ...form }, props.editingProfile?.id ?? null);

  if (!isEditing.value) {
    Object.assign(form, blankForm());
  }
};
</script>

<template>
  <section class="panel card">
    <div class="panel-head">
      <p class="eyebrow">Profiles</p>
      <h2>{{ isEditing ? '编辑协议模板' : '协议模板工单' }}</h2>
      <p class="panel-copy">协议模板决定远端生成什么 Xray 配置。你可以直接改 JSON，而不是被页面写死。</p>
    </div>

    <form class="control-form" @submit.prevent="submitForm">
      <div class="field-grid two">
        <label>
          <span>模板名称</span>
          <input v-model.trim="form.name" type="text" placeholder="VLESS TCP Baseline" required />
        </label>

        <label>
          <span>Slug</span>
          <input v-model.trim="form.slug" type="text" placeholder="vless-tcp-baseline" required />
        </label>
      </div>

      <div class="field-grid three">
        <label>
          <span>核心协议</span>
          <input v-model.trim="form.coreType" type="text" placeholder="vless" required />
        </label>

        <label>
          <span>传输层</span>
          <input v-model.trim="form.transport" type="text" placeholder="tcp / ws / grpc" required />
        </label>

        <label>
          <span>安全层</span>
          <input v-model.trim="form.security" type="text" placeholder="none / tls / reality" required />
        </label>
      </div>

      <div class="field-grid three">
        <label>
          <span>监听端口</span>
          <input v-model.number="form.listenPort" type="number" min="1" max="65535" required />
        </label>

        <label>
          <span>Inbound Tag</span>
          <input v-model.trim="form.inboundTag" type="text" required />
        </label>

        <label>
          <span>Flow</span>
          <input v-model.trim="form.flow" type="text" placeholder="xtls-rprx-vision" />
        </label>
      </div>

      <label class="toggle-row">
        <span>支持面板通过 gRPC 管理用户</span>
        <input v-model="form.supportsGrpcUsers" type="checkbox" />
      </label>

      <label>
        <span>Xray 配置模板</span>
        <textarea v-model="form.xrayConfigTemplate" rows="14" spellcheck="false" required />
      </label>

      <label>
        <span>部署后附加脚本</span>
        <textarea
          v-model="form.installScript"
          rows="6"
          placeholder="可选。写会在远端安装配置后执行的 shell 片段。"
          spellcheck="false"
        />
      </label>

      <div class="form-actions">
        <button class="primary-button" type="submit" :disabled="props.submitting">
          {{ props.submitting ? '提交中...' : (isEditing ? '保存模板' : '创建模板') }}
        </button>
        <button
          v-if="isEditing"
          class="ghost-button"
          type="button"
          :disabled="props.submitting"
          @click="emit('cancel')"
        >
          取消
        </button>
      </div>
    </form>
  </section>
</template>
