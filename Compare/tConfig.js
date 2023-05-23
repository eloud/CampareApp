
'use strict';
const fs = require('fs');
const path = require('path');

let storefrontCartridges=[];
let bmCartridges=[];

let OCartridges=[];
let NCartridges=[];



// Define your absolute path
const AbsPath= "C:/My projects/Node/testFolders/viseocommerce-tkooples-ecom-699277570c01/codebase";


//Exposes cartridges  path included in the project

// const  storeFront_path = "int_capency:app_custom_globale:app_core_tkooples:int_globale_sfra:int_globale:int_jobs_tkooples:plugin_sitemap:plugin_dis";
const  storeFront_path = "";
const  bm_path = "bmtKooples:bmCapency";
// const  storeFront_path = "";


// Mention two cartridge you want to campare by entring the relative path

const  ToCampare={
    source:"C:/My projects/Node/testFolders/adyen-salesforce-commerce-cloud-3.1.0",
    target:"C:/My projects/Node/testFolders/viseocommerce-fastretailing-ecom-cfe66442b9e6"
};


// const  ToCampare={
//   source:"C:/My projects/Node/testFolders/storefront-reference-architecture",
//   target:"C:/My projects/Node/testFolders/storefront-reference-architectureNewV"
// };

let OldBaseCartridges = getBaseCartridges(ToCampare.source,OCartridges);
let NewBaseCartridges = getBaseCartridges(ToCampare.target,NCartridges);


module.exports={
    oldBaseCartridges:filterByCommonKeys(OldBaseCartridges,NewBaseCartridges)[0],
    newBaseCartridges:filterByCommonKeys(OldBaseCartridges,NewBaseCartridges)[1],
    storefrontCartridges:getCartridges(AbsPath,storefrontCartridges,true),
    bmCartridges:getCartridges(AbsPath,bmCartridges,false)
}







function IsCartridge(editedPath){
  try {
    const stats = fs.statSync(editedPath+'/cartridge');
    return stats.isDirectory()
  } 
  catch (error) {
    return false;
  } 
}


function getBaseCartridges(basePath,BaseCartridges) {

  if(IsCartridge(basePath)){
    let x = basePath.split('/').pop();
    BaseCartridges[x] = basePath;
  }
  else{
    fs.readdirSync(basePath).forEach((file) => {
      const filePath = basePath+'/'+file;
      const stat = fs.statSync(filePath);

      let editedPath = filePath.replace(/\\/g, '/'); 

      
    if (stat.isDirectory()) {
      if (IsCartridge(editedPath)) {
        BaseCartridges[file] = editedPath;
      } else {
        BaseCartridges.concat(getBaseCartridges(editedPath,BaseCartridges)); 
      }
    }
        
    });
  }

  return BaseCartridges; 
}


function filterByCommonKeys(OldBaseCartridges, NewBaseCartridges) {
  const commonKeys = Object.keys(OldBaseCartridges).filter((key) => NewBaseCartridges.hasOwnProperty(key));

  const OldCartridges = {};
  const NewCartridges = {};

  for (const key of commonKeys) {
    OldCartridges[key] = OldBaseCartridges[key];
    NewCartridges[key] = NewBaseCartridges[key];
  }

  return [OldCartridges, NewCartridges];
}
  
function getCartridges(AbsPath,Cartridges,BmOrStorefront) {


  let Path;

  if(BmOrStorefront ){
    Path = storeFront_path.split(':');
  }else {
    Path = bm_path.split(':');
  }

  

  if(Path.length == 1 && Path[0] == ''){
      return [];
  }

  fs.readdirSync(AbsPath).forEach((file) => {
      const filePath = AbsPath+'/'+file;
      const stat = fs.statSync(filePath);

      let editedPath = filePath.replace(/\\/g, '/'); 
      
      if (stat.isDirectory() && Path.includes(file) && IsCartridge(editedPath) ) {
            Cartridges[file]=editedPath;
          }

        else if(stat.isDirectory()){
              Cartridges.concat(getCartridges(editedPath,Cartridges,BmOrStorefront)); 
          }
      
      });

      let SortedCartridges=[]
      for(var c in Path){
          var name=Path[c];
          if(Cartridges[name]){
            SortedCartridges.push(Cartridges[name]);
          }
      }


      return SortedCartridges; 
  }









