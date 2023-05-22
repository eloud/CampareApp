const fs = require('fs');
const XLSX = require('xlsx');
const XlsxPopulate = require('xlsx-populate');
const prompt = require('prompt-sync')({sigint: true});


function CreatExcel(...args) {

  const workbook = XLSX.utils.book_new();

  for (let i = 0; i < (args.length-1); i++) {
    const data = args[i];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const sheetName = args[args.length-1][i];

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    worksheet['!cols'] = [];
    for (let j = range.s.c; j <= range.e.c; j++) {
      worksheet['!cols'][j] = { wch: 22 };
    }
  }
  let name = prompt('Enter le nom de fichier excel a créer: ');   

  name+='.xlsx'
  fs.access(name, fs.constants.F_OK, (err) => {
    if (err) {

      XLSX.writeFile(workbook, name);
      console.log('Excel était bien créer');
      console.log('inside create excel')
    } else {

      const override = prompt('Vous voulez remplacer le fichier existant: O/N');
      const yesRegex = /^(yes|y|oui|o|ok)$/i;
      if( yesRegex.test(override)){

        XLSX.writeFile(workbook, name);
        console.log('Excel était bien remplacer');
      }else {

        console.log('Erreur de la génération du fichier excel')
      }
    }
  });
}

module.exports = { CreatExcel }
