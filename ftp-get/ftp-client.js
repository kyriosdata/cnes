const Client = require("ftp");
const fs = require("fs");
const log = require("single-line-log").stdout;

/**
 * Servidor a ser utilizado, caso nenhum seja
 * fornecido ao construtor ou ao método 'get'.
 */
const FTP_SERVER = "ftp.datasus.gov.br";

class FtpClient {
  /**
   * Cria instância de acesso a servidor de FTP. Arquivos
   * podem ser baixados pelo método 'get'. O servidor
   * correspondente pode ser definido e reutilizado por
   * meio do construtor ou ser fornecido a cada
   * arquivo a ser baixado.
   *
   * Após a instância não ser mais necessária ela deve
   * ser fechada (método 'close').
   *
   * @param {boolean} progressBar Indica se barra de progressão (console) deve ser exibida (padrão) ou não.
   * @param {string} server Servidor de ftp. Se não fornecido é assumido 'ftp.datasus.gov.br'.
   */
  constructor(progressBar = true, server = FTP_SERVER) {
    this.client = new Client();
    this.server = server;
    this.progressBar = progressBar;
  }

  showProgressBar(exibir) {
    this.progressBar = !!exibir;
  }

  /**
   * Obtém o tamanho em bytes do arquivo indicado e disponível no servidor de FTP.
   * @param {string} file Nome do arquivo a ser obtido.
   * @param {string} dir Diretório a partir da raiz do servidor FTP onde se encontra o arquivo.
   * @param {string} server Servidor (host) para o qual a conexão será estabelecida.
   * @returns Promise<number> Promise com a indicação da quantidade de bytes do arquivo.
   */
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

  /**
   * Obtém arquivo de servidor de FTP. O arquivo obtido é persistido
   * no destino indicado (se não fornecido, então no diretório corrente será
   * criado arquivo de mesmo nome daquele baixado).
   *
   * Se não for fornecido um diretório, então assume-se que o arquivo encontra-se na raiz do servidor de FTP.
   *
   * @param {string} file Nome do arquivo a ser baixado.
   * @param {string} dir Diretório no qual se encontro o arquivo a ser baixado.
   * @param {string} destino Local de destino do arquivo obtido. Se não fornecido, o nome do arquivo baixado será empregado no diretório corrente.
   * @param {string} server Servidor de FTP do qual o arquivo será baixado.
   * @returns Promise<number> indicando a quantidade de bytes obtidos.
   */
  async get(file, dir = "", destino = file, server = this.server) {
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

module.exports = FtpClient;
