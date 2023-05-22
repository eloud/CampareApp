const fs = require('fs');  
const path = require('path');  


function compareFoldersNoFileContent(base, custom) {

  const customCartridgeName = custom.split('/').pop();
  const baseCart = base +"/cartridge";
  const customCart = custom +"/cartridge";
  
  let allCustomFilesWithTheirPaths = getFilePaths(customCart,customCart);

  allCustomFilesWithTheirPaths = allCustomFilesWithTheirPaths.filter(file => {
    const unmanagedFolders = file.path.split('/')[1];


    if(file.path.split('/')[3]){
      if(file.path.split('/')[3] == 'fonts'){
        return false;
      }
    }

    if (!unmanagedFolders || unmanagedFolders == 'static' || unmanagedFolders == 'templates' 
        ) {
      return false;
    }
    return true;
  });
  


  const allBaseFilesWithTheirPaths = getFilePaths(baseCart,baseCart);


  const unique2 = allCustomFilesWithTheirPaths.filter(customFile => {
    const isUnique = !allBaseFilesWithTheirPaths.some(baseFile => {
      return baseFile.name === customFile.name && baseFile.path === customFile.path;
    });
    return isUnique;
  });
 
  const newUnique2 = unique2.map(file => ({ 
    name: file.name,
    cartridgeName: customCartridgeName,
    filePath: file.path,
  }));


  const comFiles = allBaseFilesWithTheirPaths.filter( baseFile => {
    const isCommon = allCustomFilesWithTheirPaths.some( customFile=> {
      return baseFile.name === customFile.name && baseFile.path === customFile.path;
    });
    return isCommon;
  });
 
  const commonFiles = comFiles.map(file => ({
    name: file.name,
    cartridgeName: customCartridgeName,
    filePath: file.path,
  }));


  return {newUnique2,commonFiles};
}



 
function globalComparaison(folderData) {
  const {newUnique2, commonFiles} = folderData;
  let data = {};

  for (var i = 0; i < newUnique2.length; i++) {
    let fileName = newUnique2[i].name;
    let cartridgeName = newUnique2[i].cartridgeName;
    let filePath =  newUnique2[i].filePath;
    if (data[fileName]) {
      data[fileName][cartridgeName] = 'Ajout';
    } else {
      data[fileName] = {
        folder: filePath,
        files: fileName,
        app_storefront_base: '    ',
        [cartridgeName]: 'Ajout'
      };
    }
  }

  for (var i = 0; i < commonFiles.length; i++) {
    let fileName = commonFiles[i].name;
    let cartridgeName = commonFiles[i].cartridgeName;
    let filePath =  commonFiles[i].filePath;

    if (data[fileName]) {
        if(data[fileName]['app_storefront_base'] == ""){
          data[fileName][cartridgeName] = 'ajout';
        }else {
          data[fileName][cartridgeName] = 'modification';

        }
        // data[fileName]['app_storefront_base'] = 'Existant';
    } else {
      data[fileName] = {
        folder: filePath,
        files: fileName,
        app_storefront_base: 'Existant',
        [cartridgeName]: 'modification'
      };
    }
  }


  const dataArray = Object.values(data);

  dataArray.sort((a, b) => {
    const folderA = a.folder.toLowerCase();
    const folderB = b.folder.toLowerCase();
    const fileA = a.files.toLowerCase();
    const fileB = b.files.toLowerCase();

    if (folderA < folderB) return -1;
    if (folderA > folderB) return 1;
    if (fileA < fileB) return -1;
    if (fileA > fileB) return 1;
    return 0;
  });

  return Object.values(dataArray);

}


function getFilePaths(folderPath, globalCartridgePath) {

  let filePaths = [];

  fs.readdirSync(folderPath).forEach((file) => {

    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {

      let editedPath = filePath.replace(/\\/g, '/');
      let lastSlashIndex = editedPath.lastIndexOf("/");
      let relativePath = editedPath.substring(0, lastSlashIndex);

      filePaths.push({name : file, path : relativePath.replace(globalCartridgePath, "")});

    } else if (stat.isDirectory()) {

      filePaths = filePaths.concat(getFilePaths(filePath,globalCartridgePath));
    }
  });

  return filePaths;
}


module.exports = {compareFoldersNoFileContent, globalComparaison}
