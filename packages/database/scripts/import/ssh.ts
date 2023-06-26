import {createTunnel} from "tunnel-ssh";
import * as ssh2 from 'ssh2';

import { Server } from "net";

export interface ISshConfig {
  sshIp: string;
  sshUsername: string;
  sshPassword: string;
  dstPort: number,
  localPort: number,
}

export class SshHelper {
  sshConfig: ISshConfig;
  server?: Server;
  client?: ssh2.Client;

  constructor(config: ISshConfig) {
    this.sshConfig = config;
  }

  /**
 * Starts the tunnel to remove server.
 * Alternative is to use ssh -L <localPort>:localhost:<dstPort> <username>:<password>@<host>
 * For simplicity we are using equally mapped port.
 * @returns Promise<void>
 */
  async startSshTunnel(): Promise<void> {
    const tunnelOptions = {
      autoClose:true
    };
    const serverOptions = {
      port: this.sshConfig.localPort
    };
    const sshOptions = {
      host: this.sshConfig.sshIp,
      port: 22,
      username: this.sshConfig.sshUsername,
      password: this.sshConfig.sshPassword,
    };
    const forwardOptions = {
      srcAddr:'127.0.0.1',
      srcPort: this.sshConfig.localPort,  // using the same port as db
      dstAddr:'127.0.0.1',
      dstPort: this.sshConfig.dstPort, // using the same port as db
    };

    try{
      ([this.server, this.client] = await  createTunnel(tunnelOptions, serverOptions,  sshOptions, forwardOptions))
    } catch(e) {
      console.warn(e)
    }

  };

  /**
   * Closes the ssh tunnel
   * @returns Promise<void>
   */
  end(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        return resolve();
      }
      this.server.close();
      resolve()
    });
  }
}
