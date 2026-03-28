import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { NodeRecord, ProtocolProfileRecord } from '../types/models.js';

interface CommandResult {
  stdout: string;
  stderr: string;
}

interface DeployNodeResult {
  checkedAt: string;
  renderedConfig: string;
  remoteOutput: string;
}

const DEFAULT_API_PORT = 10085;

const runCommand = async (command: string, args: string[]): Promise<CommandResult> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, ['-V'], { stdio: 'ignore' });

    child.once('error', reject);
    child.once('exit', () => resolve());
  }).catch((error) => {
    throw new Error(`${command} is required on the backend host: ${error instanceof Error ? error.message : 'spawn failed'}`);
  });

  return await new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.once('error', (error) => {
      reject(error);
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }

      reject(new Error((stderr || stdout || `${command} exited with code ${code}`).trim()));
    });
  });
};

const buildRemoteScript = (remoteConfigPath: string, remoteProfileScript: string): string => `#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

install_package() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y "$@"
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    dnf install -y "$@"
    return
  fi

  if command -v yum >/dev/null 2>&1; then
    yum install -y "$@"
    return
  fi

  echo "No supported package manager found on target server" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || install_package curl
command -v unzip >/dev/null 2>&1 || install_package unzip
command -v systemctl >/dev/null 2>&1 || { echo "systemctl is required"; exit 1; }

if [ ! -x /usr/local/bin/xray ]; then
  bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install -u root
fi

install -d -m 755 /usr/local/etc/xray
install -m 600 "${remoteConfigPath}" /usr/local/etc/xray/config.json

${remoteProfileScript.trim() || 'true'}

systemctl enable xray >/dev/null 2>&1 || true
systemctl restart xray
systemctl is-active --quiet xray

rm -f "${remoteConfigPath}" "$0"
`;

const renderTemplate = (
  template: string,
  input: {
    apiPort: number;
    inboundTag: string;
    listenPort: number;
    nodeHost: string;
  }
): string => {
  return template
    .replaceAll('{{API_PORT}}', String(input.apiPort))
    .replaceAll('{{INBOUND_TAG}}', input.inboundTag)
    .replaceAll('{{LISTEN_PORT}}', String(input.listenPort))
    .replaceAll('{{NODE_HOST}}', input.nodeHost);
};

export class NodeDeploymentService {
  private async ensurePasswordTool(node: NodeRecord): Promise<void> {
    if (node.authType !== 'password') {
      return;
    }

    if (!node.password) {
      throw new Error('Password authentication selected, but no password was stored for this node');
    }

    await runCommand('sshpass', ['-V']).catch(() => {
      throw new Error('Password deployment requires sshpass to be installed on the backend host');
    });
  }

  private buildBaseSshArgs(node: NodeRecord, keyPath?: string): string[] {
    const args = [
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      '-o',
      'ConnectTimeout=12'
    ];

    if (node.authType === 'privateKey' && keyPath) {
      args.push('-i', keyPath);
    }

    return args;
  }

  private async runSsh(node: NodeRecord, sshArgs: string[]): Promise<CommandResult> {
    if (node.authType === 'password') {
      await this.ensurePasswordTool(node);

      return runCommand('sshpass', ['-p', node.password ?? '', 'ssh', ...sshArgs]);
    }

    return runCommand('ssh', sshArgs);
  }

  private async runScp(node: NodeRecord, scpArgs: string[]): Promise<CommandResult> {
    if (node.authType === 'password') {
      await this.ensurePasswordTool(node);

      return runCommand('sshpass', ['-p', node.password ?? '', 'scp', ...scpArgs]);
    }

    return runCommand('scp', scpArgs);
  }

  async probe(node: NodeRecord): Promise<{ ok: true; checkedAt: string; output: string }> {
    let tempDir = '';
    let keyPath: string | undefined;

    try {
      if (node.authType === 'privateKey') {
        if (!node.privateKey) {
          throw new Error('Private-key authentication selected, but no private key was stored for this node');
        }

        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proxypanel-ssh-'));
        keyPath = path.join(tempDir, 'id_rsa');
        await fs.writeFile(keyPath, node.privateKey, { mode: 0o600 });
      }

      const sshArgs = [
        ...this.buildBaseSshArgs(node, keyPath),
        '-p',
        String(node.sshPort),
        `${node.sshUser}@${node.host}`,
        'printf proxypanel-ok'
      ];
      const result = await this.runSsh(node, sshArgs);

      return {
        ok: true,
        checkedAt: new Date().toISOString(),
        output: result.stdout || result.stderr || 'SSH probe ok'
      };
    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    }
  }

  async deploy(node: NodeRecord, profile: ProtocolProfileRecord): Promise<DeployNodeResult> {
    let tempDir = '';
    let keyPath: string | undefined;

    try {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proxypanel-deploy-'));

      if (node.authType === 'privateKey') {
        if (!node.privateKey) {
          throw new Error('Private-key authentication selected, but no private key was stored for this node');
        }

        keyPath = path.join(tempDir, 'id_rsa');
        await fs.writeFile(keyPath, node.privateKey, { mode: 0o600 });
      }

      const apiPort = node.grpcPort || DEFAULT_API_PORT;
      const renderedConfig = renderTemplate(profile.xrayConfigTemplate, {
        apiPort,
        inboundTag: node.inboundTag || profile.inboundTag,
        listenPort: profile.listenPort,
        nodeHost: node.host
      });

      const configPath = path.join(tempDir, 'config.json');
      const scriptPath = path.join(tempDir, 'install.sh');
      const remoteConfigPath = `/tmp/proxypanel-config-${node.id}-${Date.now()}.json`;
      const remoteScriptPath = `/tmp/proxypanel-install-${node.id}-${Date.now()}.sh`;

      await fs.writeFile(configPath, renderedConfig, 'utf8');
      await fs.writeFile(scriptPath, buildRemoteScript(remoteConfigPath, profile.installScript ?? ''), {
        mode: 0o700
      });

      const scpBaseArgs = [
        ...this.buildBaseSshArgs(node, keyPath),
        '-P',
        String(node.sshPort)
      ];

      await this.runScp(node, [
        ...scpBaseArgs,
        configPath,
        `${node.sshUser}@${node.host}:${remoteConfigPath}`
      ]);

      await this.runScp(node, [
        ...scpBaseArgs,
        scriptPath,
        `${node.sshUser}@${node.host}:${remoteScriptPath}`
      ]);

      const sshResult = await this.runSsh(node, [
        ...this.buildBaseSshArgs(node, keyPath),
        '-p',
        String(node.sshPort),
        `${node.sshUser}@${node.host}`,
        'bash',
        remoteScriptPath
      ]);

      return {
        checkedAt: new Date().toISOString(),
        renderedConfig,
        remoteOutput: [sshResult.stdout, sshResult.stderr].filter(Boolean).join('\n')
      };
    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    }
  }
}
