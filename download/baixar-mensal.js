const Client = require("ftp");
const fs = require("fs");
const log = require("single-line-log").stdout;

const FTP_DATASUS = "ftp.datasus.gov.br";
const DIR = "/cnes/";
const BASE = "BASE_DE_DADOS_CNES_202102.ZIP";

var c = new Client();
c.on("ready", function () {
  c.size(DIR + BASE, function (err, tamanho) {
    if (err) throw err;

    const TOTAL_BYTES = tamanho;
    let acumulador = 0;

    console.log(`Tamanho em bytes do arquivo: ${tamanho}`);
    c.get("/cnes/" + BASE, function (err, stream) {
      if (err) throw err;

      stream.on("data", (chunk) => {
        acumulador += chunk.length;
        const percentual = (acumulador * 100.0) / TOTAL_BYTES;
        log(`${percentual.toFixed(2)}%`);
      });

      stream.once("close", function () {
        c.end();
      });

      stream.pipe(fs.createWriteStream(BASE));
    });
  });
});

// c.on("ready", function () {
//   c.get("/cnes/" + BASE, function (err, stream) {
//     if (err) throw err;

//     stream.on("data", (chunk) => {
//       console.log("received ", chunk.length);
//     });

//     stream.once("close", function () {
//       c.end();
//     });

//     stream.pipe(fs.createWriteStream(BASE));
//   });
// });

c.connect({ host: FTP_DATASUS });
