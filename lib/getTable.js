const fs = require('fs');
const { resolve } = require('path');
const pdfParse = require('pdf-parse'); // Handle pdf files

/**
 * Extracts the table information into a pdf.
 * @param {string} start - Where to start getting the data.
 * @returns {Promise<{code: string[], categoryDescription: string[]}>} a promise with a no formated object containing the table column data.
 * @author Joaquim Gregório <https://github.com/JoaquimGregorio>
 */
async function extractTableData(start) {
  try {
    // Reading pdf in root folder
    const pdfFile = fs.readFileSync(
      resolve(
        __dirname,
        '..',
        'padrao-tiss_componente-organizacional_202111.pdf'
      )
    );

    const table = {};

    // The table data is between 'Descrição da categoria' and 'Fonte:' (default for all tables)
    const data = await pdfParse(pdfFile);
    const text = data.text
      .split(start)
      .at(1)
      .split('Descrição da categoria')
      .at(1)
      .split('Fonte:')
      .at(0)
      .split(' ')
      .map((value) => value.replace('\n', '')) // removing break lines
      .join(' '); // joining in a single string

    table.code = text.match(/[0-9]+/g); // getting the numbers ('Código' column)

    table.categoryDescription = text // getting description ('Descrição da categoria' column)
      .match(/[a-zA-ZçÇãÃáÁàÀâÂõÕóôÔéÉêúÚûÛíÍ\,\(\)\-\–\ ]+/g)
      .map((value) => value.trim());

    // Returning an unparsed table
    return table;
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get the table by its number, parsing the data returned by extractTableData function.
 * @param {30 | 31 | 32} tableNumber - Which table to get: 30, 31 or 32
 * @returns {Promise<{code: string[], categoryDescription: string[]}>} a promise with the table column data.
 * @author Joaquim Gregório <https://github.com/JoaquimGregorio>
 */
async function getTable(tableNumber) {
  try {
    if (tableNumber === 30) {
      const table = await extractTableData(
        'Quadro 30 – Tabela de tipo de demandante'
      );

      // Removing all empty strings (parsing as falsy values)
      table.categoryDescription = table.categoryDescription.filter(
        (value) => !!value
      );
      return table;
    }

    if (tableNumber === 31) {
      const table = await extractTableData(
        'Quadro 31 – Tabela de categoria do Padrão TISS'
      );

      table.code = table.code.filter((value) => value !== '2021');

      // How this table is bigger and takes more than one page to be shown, we
      // have to parse all the page numbers and footer text, removing it and
      // keeping only the table data in the table object
      for (let i = 0; i < table.code.length; i++) {
        // Condition to remove the page numbers
        if (
          (table.code[i] === '116' ||
            table.code[i] === '117' ||
            table.code[i] === '118' ||
            table.code[i] === '119') &&
          // this condition removes the non-sequential numbers that are the page numbers
          Number(table.code[i - 1]) + 1 !== Number(table.code[i])
        ) {
          table.code.splice(i, 1);
        }
      }

      // Removing footer text
      table.categoryDescription = table.categoryDescription.filter(
        (value) =>
          !value.includes('Padrão TISS - Componente Organizacional') && !!value
      );

      return table;
    }

    if (tableNumber === 32) {
      const table = await extractTableData(
        'Quadro 32 – Tabela de tipo de solicitação'
      );

      // Removing empty strings
      table.categoryDescription = table.categoryDescription.filter(
        (value) => !!value
      );

      // This table cannot be getted by using 'Fonte:' text to get the data
      // table, then we must specify the number of lines to be getted in each
      // column
      table.code.length = 3;
      table.categoryDescription.length = 3;

      return table;
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = getTable;
