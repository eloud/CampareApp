const config=require('../config');  
const tConfig=require('../tConfig');  
const _ = require('lodash'); 

const CompareControllers = require('./CompareControllers');  
const CompareScripts = require('./CompareScripts');  
const diffCartridge = require('./DiffCartridge');
const CompareFolder = require('./CompareFolder');  
const excel=require('./ExcelManipulation'); 

function OrganiseSheet(Sheet,column){

  let editedSheet = []
  let folderName = '';
  Sheet.forEach(cart=>{
    let newFolder = false;
    if(cart[column] != folderName){
      folderName = cart[column];
      newFolder = true;
    }
    if(newFolder){
      editedSheet.push({[column]:folderName})
      editedSheet.push({...cart,[column]:''})
    }else{
      editedSheet.push({...cart,[column]:''})
    }
  })

  return editedSheet;
}

function main() {

    const basePath = tConfig.oldBaseCartridges;
    const newSFRA = tConfig.newBaseCartridges;
    const storefrontCustomCartsPaths = tConfig.storefrontCartridges;
    const bmCustomCartsPaths = tConfig.bmCartridges;


    const combinedResults = {
      newUnique2: [],
      commonFiles: []
    };
  
    if (storefrontCustomCartsPaths.length == 0) {
      const diffs = [];
    
      for (const [key, value] of Object.entries(basePath)) {
        for (const [key2, value2] of Object.entries(newSFRA)) {
          if (key === key2) {
            const Diff = diffCartridge.DiffCart((value+'/cartridge'),(value2+'/cartridge'), key);
            if(Diff.length != 0){
              diffs.push(Diff);
            }
          }
        }
      }
      
      const combinedControllers = [];
      const combinedScripts = [];

      const diffsFlat = diffs.flat();
    
      for (const [key, value] of Object.entries(basePath)) {
        let x = CompareControllers.methodsModificationSimple(value, newSFRA[key], diffsFlat);
        let y = CompareScripts.methodsModificationSimple(value, newSFRA[key], diffsFlat);

        combinedControllers.push(...x);
        combinedScripts.push(...y);

      }

      const editedCombinedControllers = OrganiseSheet(combinedControllers,"cartridge");
      const editedCombinedScripts = OrganiseSheet(combinedScripts,"cartridge");

      const sheetOrder = [];

      for (let i = 0; i < diffs.length; i++) {
        sheetOrder.push(diffs[i][0].cartridge);
        for (let j = 0; j < diffs[i].length; j++) {
          _.unset(diffs[i][j], 'cartridge');
        }
        diffs[i] = OrganiseSheet(diffs[i], 'Folders');
      }

      sheetOrder.push("Controllers", "Scripts");
      excel.CreatExcel(...diffs, editedCombinedControllers, editedCombinedScripts, sheetOrder);    
    }
    
    else {

    const DiffSf = diffCartridge.DiffCart((basePath.app_storefront_base+'/cartridge'),(newSFRA.app_storefront_base+'/cartridge'));
    const DiffSfra = OrganiseSheet(DiffSf,"Folders");

    const DiffBm = diffCartridge.DiffCart((basePath.bm_app_storefront_base+'/cartridge'),(newSFRA.bm_app_storefront_base+'/cartridge'));
    const DiffBsMn = OrganiseSheet(DiffBm,"Folders");


      storefrontCustomCartsPaths.forEach((path) => {
  
        const resultFolders = CompareFolder.compareFoldersNoFileContent(basePath.app_storefront_base, path);
    
        combinedResults.newUnique2 = combinedResults.newUnique2.concat(resultFolders.newUnique2);
        combinedResults.commonFiles = combinedResults.commonFiles.concat(resultFolders.commonFiles);

      });

      const CartoFront = CompareFolder.globalComparaison(combinedResults);
      const editedCartoFront = OrganiseSheet(CartoFront,'folder');
  
      const combinedControllers = CompareControllers.methodsModification(basePath.app_storefront_base, newSFRA.app_storefront_base, storefrontCustomCartsPaths, combinedResults);
      const EditedCombinedControllers = OrganiseSheet(combinedControllers,'cartridges');

      const combinedScripts = CompareScripts.methodsModification(basePath.app_storefront_base,newSFRA.app_storefront_base, storefrontCustomCartsPaths, combinedResults);
      const EditedCombinedScripts = OrganiseSheet(combinedScripts,'cartridges');

      
      const sheetOrder = ["DiffSfra","CartoFront", "Controllers", "Scripts",'DiffBM']
      excel.CreatExcel(DiffSfra, editedCartoFront, EditedCombinedControllers, EditedCombinedScripts,DiffBsMn,sheetOrder);
    }
  }
  
  main();