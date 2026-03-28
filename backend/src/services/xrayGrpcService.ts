import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import protobuf from 'protobufjs';
import type { NodeRecord } from '../types/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distProtoRoot = path.resolve(__dirname, '../proto');
const sourceProtoRoot = path.resolve(__dirname, '../../src/proto');
const protoRootDir = fs.existsSync(distProtoRoot) ? distProtoRoot : sourceProtoRoot;

const packageDefinition = protoLoader.loadSync(path.join(protoRootDir, 'app/proxyman/command/command.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [protoRootDir]
});

const grpcProto = grpc.loadPackageDefinition(packageDefinition) as Record<string, any>;
const HandlerService = grpcProto.xray.app.proxyman.command.HandlerService;

const protoRoot = new protobuf.Root();
protoRoot.resolvePath = (_origin, target) => path.resolve(protoRootDir, target);
protoRoot.loadSync([
  path.join(protoRootDir, 'app/proxyman/command/command.proto'),
  path.join(protoRootDir, 'proxy/vless/account.proto')
]);
protoRoot.resolveAll();
const VlessAccount = protoRoot.lookupType('xray.proxy.vless.Account');
const AddUserOperation = protoRoot.lookupType('xray.app.proxyman.command.AddUserOperation');
const RemoveUserOperation = protoRoot.lookupType('xray.app.proxyman.command.RemoveUserOperation');

type GrpcCallback = (error: grpc.ServiceError | null, response: unknown) => void;

interface HandlerServiceClient extends grpc.Client {
  AlterInbound(
    request: { tag: string; operation: { type: string; value: Buffer } },
    callback: GrpcCallback
  ): void;

  ListInbounds(
    request: { is_only_tags: boolean },
    callback: GrpcCallback
  ): void;
}

interface XrayUserPayload {
  email: string;
  uuid: string;
  level: number;
  flow: string;
}

export class XrayGrpcService {
  private createClient(node: NodeRecord): HandlerServiceClient {
    const address = `${node.grpcHost}:${node.grpcPort}`;
    const credentials = node.tlsEnabled
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();

    return new HandlerService(address, credentials) as HandlerServiceClient;
  }

  private async alterInbound(
    node: NodeRecord,
    operationType: string,
    payload: Uint8Array
  ): Promise<void> {
    const client = this.createClient(node);

    await new Promise<void>((resolve, reject) => {
      client.AlterInbound(
        {
          tag: node.inboundTag,
          operation: {
            type: operationType,
            value: Buffer.from(payload)
          }
        },
        (error) => {
          client.close();

          if (error) {
            reject(new Error(`Xray gRPC error: ${error.message}`));
            return;
          }

          resolve();
        }
      );
    });
  }

  async addUser(node: NodeRecord, payload: XrayUserPayload): Promise<void> {
    if (node.protocol !== 'vless') {
      throw new Error(`Unsupported protocol for gRPC addUser: ${node.protocol}`);
    }

    const accountBytes = VlessAccount.encode(
      VlessAccount.create({
        id: payload.uuid,
        flow: payload.flow
      })
    ).finish();

    const operationBytes = AddUserOperation.encode(
      AddUserOperation.create({
        user: {
          level: payload.level,
          email: payload.email,
          account: {
            type: 'xray.proxy.vless.Account',
            value: accountBytes
          }
        }
      })
    ).finish();

    await this.alterInbound(node, 'xray.app.proxyman.command.AddUserOperation', operationBytes);
  }

  async removeUser(node: NodeRecord, email: string): Promise<void> {
    const operationBytes = RemoveUserOperation.encode(
      RemoveUserOperation.create({
        email
      })
    ).finish();

    await this.alterInbound(node, 'xray.app.proxyman.command.RemoveUserOperation', operationBytes);
  }

  async ping(node: NodeRecord): Promise<{ ok: true; checkedAt: string }> {
    const client = this.createClient(node);

    await new Promise<void>((resolve, reject) => {
      client.ListInbounds(
        {
          is_only_tags: true
        },
        (error) => {
          client.close();

          if (error) {
            reject(new Error(`Xray gRPC error: ${error.message}`));
            return;
          }

          resolve();
        }
      );
    });

    return {
      ok: true,
      checkedAt: new Date().toISOString()
    };
  }
}
