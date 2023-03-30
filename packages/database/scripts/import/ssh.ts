import tunnel from "tunnel-ssh";
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
    this.server = await new Promise<Server>((resolve, reject) => {
      const tnl = tunnel(
        {
          host: this.sshConfig.sshIp,
          dstPort: this.sshConfig.dstPort, // using the same port as db
          localPort: this.sshConfig.localPort,  // using the same port as db
          username: this.sshConfig.sshUsername,
          password: this.sshConfig.sshPassword,
        },
        async (error: Error, srv: Server) => {
          resolve(srv);
        }
      );

      tnl.on("error", function (err) {
        console.error("SSH connection error:", err);
        process.exit(1);
      });
    });
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
