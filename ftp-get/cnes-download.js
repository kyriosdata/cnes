const FtpClient = require("./ftp-client");

const FTP_DIR = "/cnes/";
const FTP_FILE = "BASE_DE_DADOS_CNES_202102.ZIP";

async function main() {
  try {
    const cliente = new FtpClient();
    const lidos = await cliente.get(FTP_FILE, FTP_DIR);
    cliente.close();
    console.log(lidos);
  } catch (erro) {
    console.log("\nERRO:");
    console.log(erro);
  }
}

main();
