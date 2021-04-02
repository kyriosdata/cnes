const Client = require("ftp");
const fs = require("fs");
const log = require("single-line-log").stdout;

/**
 * Servidor a ser utilizado, caso nenhum seja
 * fornecido ao construtor ou ao método 'get'.
 */
const FTP_SERVER = "ftp.datasus.gov.br";

const FTP_DIR = "/cnes/";
const FTP_FILE = "BASE_DE_DADOS_CNES_202102.ZIP";

class FtpClient {
  /**
   * Cria instância de acesso a servidor de FTP. Arquivos
   * podem ser baixados pelo método 'get'. O servidor
   * correspondente pode ser definido e reutilizado por
   * meio do construtor ou ser fornecido a cada
   * arquivo a ser baixado.
   *
   * @param {string} server Servidor de ftp. Se não fornecido é assumido 'ftp.datasus.gov.br'.
   * @param {boolean} progressBar Indica se barra de progressão (console) deve ser exibida (padrão) ou não.
   */
  constructor(progressBar = true, server = FTP_SERVER) {
    this.client = new Client();
    this.server = server;
    this.progressBar = progressBar;
  }

  showProgressBar(exibir) {
    this.progressBar = !!exibir;
  }

  size(file, dir = "", server = this.server) {
    return new Promise((resolve, reject) => {
      this.client.on("ready", () => {
        this.client.size(dir + file, (sizeErr, tamanho) => {
          if (sizeErr) {
            reject(sizeErr);
          }

          resolve(tamanho);
        });
      });

      this.client.connect({ host: server });
    });
  }

  async get(file, dir = "", destino = "ftp.file", server = this.server) {
    const totalBytes = await this.size(file, dir, server);

    return new Promise((resolve, reject) => {
      this.client.on("ready", async () => {
        this.client.get(dir + file, (getErr, stream) => {
          if (getErr) {
            reject(getErr);
          }

          let lidosBytes = 0;
          stream.on("data", (chunk) => {
            if (this.progressBar) {
              lidosBytes += chunk.length;
              const percentual = (lidosBytes * 100.0) / totalBytes;
              log(`${percentual.toFixed(2)}%`);
            }
          });

          stream.once("close", function () {
            resolve(lidosBytes);
          });

          stream.pipe(fs.createWriteStream(destino));
        });
      });

      this.client.connect({ host: server });
    });
  }

  close() {
    this.client.end();
  }
}

async function main() {
  try {
    const cliente = new FtpClient();
    const lidos = await cliente.get(FTP_FILE, FTP_DIR, "x.ftp");
    cliente.close();
    console.log(lidos);
  } catch (erro) {
    console.log("\nERRO:");
    console.log(erro);
  }
}

main();
