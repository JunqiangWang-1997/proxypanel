import type { CreateProtocolProfileInput } from '../types/models.js';

const vlessTcpTemplate = `{
  "log": {
    "loglevel": "warning"
  },
  "api": {
    "services": ["HandlerService", "LoggerService", "StatsService", "ReflectionService"],
    "tag": "api"
  },
  "stats": {},
  "policy": {
    "levels": {
      "0": {
        "statsUserUplink": true,
        "statsUserDownlink": true
      }
    },
    "system": {
      "statsInboundUplink": true,
      "statsInboundDownlink": true
    }
  },
  "inbounds": [
    {
      "listen": "::",
      "port": {{API_PORT}},
      "protocol": "dokodemo-door",
      "settings": {
        "address": "127.0.0.1"
      },
      "tag": "api"
    },
    {
      "listen": "::",
      "port": {{LISTEN_PORT}},
      "protocol": "vless",
      "settings": {
        "clients": [],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp"
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "quic"]
      },
      "tag": "{{INBOUND_TAG}}"
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "blocked"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "inboundTag": ["api"],
        "outboundTag": "api"
      }
    ]
  }
}`;

const vmessWsTemplate = `{
  "log": {
    "loglevel": "warning"
  },
  "api": {
    "services": ["HandlerService", "LoggerService", "StatsService", "ReflectionService"],
    "tag": "api"
  },
  "stats": {},
  "policy": {
    "levels": {
      "0": {
        "statsUserUplink": true,
        "statsUserDownlink": true
      }
    }
  },
  "inbounds": [
    {
      "listen": "::",
      "port": {{API_PORT}},
      "protocol": "dokodemo-door",
      "settings": {
        "address": "127.0.0.1"
      },
      "tag": "api"
    },
    {
      "listen": "::",
      "port": {{LISTEN_PORT}},
      "protocol": "vmess",
      "settings": {
        "clients": []
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "/{{INBOUND_TAG}}"
        }
      },
      "tag": "{{INBOUND_TAG}}"
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "inboundTag": ["api"],
        "outboundTag": "api"
      }
    ]
  }
}`;

export const defaultProtocolProfiles: CreateProtocolProfileInput[] = [
  {
    name: 'VLESS TCP Baseline',
    slug: 'vless-tcp-baseline',
    coreType: 'vless',
    transport: 'tcp',
    security: 'none',
    listenPort: 443,
    inboundTag: 'main-inbound',
    flow: '',
    supportsGrpcUsers: true,
    xrayConfigTemplate: vlessTcpTemplate,
    installScript: ''
  },
  {
    name: 'VMess WS Baseline',
    slug: 'vmess-ws-baseline',
    coreType: 'vmess',
    transport: 'ws',
    security: 'none',
    listenPort: 8080,
    inboundTag: 'vmess-ws',
    flow: '',
    supportsGrpcUsers: false,
    xrayConfigTemplate: vmessWsTemplate,
    installScript: ''
  }
];
