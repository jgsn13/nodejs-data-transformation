const fs = require('fs');
const { resolve } = require('path');

const archiver = require('archiver'); // To zip files

const getTable = require('./lib/getTable');

/**
 * Extract all table data into a string formated as csv.
 * @param {Array<{code: string, categoryDescription: string}>} table - table array containing the csv data.
 * @returns {string} a string containing the csv data.
 * @author Joaquim Gregório <https://github.com/JoaquimGregorio>
 */
function extractAsCSV(table) {
  const header = ['Código, Descrição da categoria'];
  const rows = table.map((row) => `${row.code}, ${row.categoryDescription}`);
  return header.concat(rows).join('\n');
}

/**
 * Write table into a csv file.
 * @param {30 | 31 | 32} tableNumber - number of the table to be extracted as csv: 30, 31 or 32.
 * @author Joaquim Gregório <https://github.com/JoaquimGregorio>
 */
async function writeCSVFile(tableNumber) {
  // Parsing file name
  const filename =
    tableNumber === 30
      ? 'Tabela de tipo de demandante.csv'
      : tableNumber === 31
      ? 'Tabela de Categoria do Padrão TISS.csv'
      : 'Tabela de Tipo de Solicitação.csv';

  const data = await getTable(tableNumber);
  const table = [];

  // Putting code and categoryDescription columns into objects, then, pushing it into an array
  for (let i = 0; i < data.code.length; i++) {
    const row = {
      code: data.code[i],
      categoryDescription: data.categoryDescription[i],
    };

    table.push(row);
  }

  // Writing csv file
  fs.writeFile(
    // save it in csv/ folder in root directory
    resolve(__dirname, 'csv', filename),
    extractAsCSV(table),
    (err) => {
      if (err) {
        console.log('Error writing to csv file', err);
      } else {
        console.log(`Saved as ${filename}`);
      }
    }
  );
}

/**
 * Zip all csv files.
 * @param {string} name - Zip file name.
 * @param {number} level - Sets the compression level.
 * @author Joaquim Gregório <https://github.com/JoaquimGregorio>
 */
async function zipCVSFiles(name, level) {
  try {
    const output = fs.createWriteStream(resolve(__dirname, `${name}.zip`));
    const archive = archiver('zip', {
      gzip: true,
      zlib: { level },
    });

    archive.on('error', function (err) {
      throw err;
    });

    // Pipe archive data to the output file.
    archive.pipe(output);

    // Append files
    archive.file(resolve(__dirname, 'csv/Tabela de tipo de demandante.csv'), {
      name: 'Tabela de tipo de demandante.csv',
    });
    archive.file(
      resolve(__dirname, 'csv/Tabela de Categoria do Padrão TISS.csv'),
      { name: 'Tabela de Categoria do Padrão TISS.csv' }
    );
    archive.file(resolve(__dirname, 'csv/Tabela de Tipo de Solicitação.csv'), {
      name: 'Tabela de Tipo de Solicitação.csv',
    });

    // Save zip file.
    await archive.finalize();
    console.log(`Zip ${name} saved successfully!`);
  } catch (err) {
    console.log(err);
  }
}

// Writing all tables into csvs files
(async function run() {
  for (let i = 30; i <= 32; i++) {
    await writeCSVFile(i);
  }

  zipCVSFiles('Teste_Joaquim_Gregorio', 9);
})();
