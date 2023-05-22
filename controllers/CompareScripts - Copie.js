const fs = require('fs');
const acorn = require('acorn');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');




function ExtractFunctions(filePath) {

    const editedPath = filePath.replace(/\\/g, '/');
    const fileContents = fs.readFileSync(editedPath, 'utf-8');
    let ast ;
    try{
       ast = parser.parse(fileContents, {
        sourceType: 'module', 
    });

    }catch(e){
      console.log(e);
    }

    
    const functions = [];
    
    traverse(ast, {
        FunctionDeclaration(path) {
            const name = path.node.id.name;
            const body = fileContents.substring(path.node.start, path.node.end);
            functions.push({ name, body });
        },
    });

    return functions;
    

}


function getFunctionsFromFile(filePath) {
  let editedPath =filePath.replace(/\\/g, '/');
  const fileContent = fs.readFileSync(editedPath, 'utf-8');
  const ast = acorn.parse(fileContent);

  const functionNames = [];

  ast.body.forEach((file) => {
    if (file.expression && file.expression.left && file.expression.left.type === 'MemberExpression') {
      functionNames.push({name : file.expression.left.property.name});
    }
  });

  return functionNames;
}
  
function methodsModification(basePath,newSFRA, customCartPaths, folderData) {

  // const newSFRA= config.newSFRA;
  const commonFiles = folderData.commonFiles;
  let newData = [];

  for (let i = 0; i < commonFiles.length; i++) {

    if(commonFiles[i].filePath.split('/')[1] == 'scripts') {
      
      const file = commonFiles[i].name;
  
      customCartPaths.forEach((customCartPath) => { 
  
        if(commonFiles[i].cartridgeName == customCartPath.split('/').pop()){
          
          const customCartControllersPath = customCartPath + "/cartridge";
          const baseControllersPath = basePath + "/cartridge";
          const newSFRAControllersPath = newSFRA + "/cartridge";

          const fileBasePath = path.join(baseControllersPath,commonFiles[i].filePath, file);
          const fileCustomCartPath = path.join(customCartControllersPath,commonFiles[i].filePath, file);
          const filePathNewSFRA  = path.join(newSFRAControllersPath,commonFiles[i].filePath, file);

          const fileContent = fs.readFileSync(fileCustomCartPath, 'utf-8');
          const substr = 'module.superModule';

          let CustomCartServerFunctions;
          try{
              if (fileContent.includes(substr)){
                const tab = getFunctionsFromFile(fileCustomCartPath);
                const t = tab.pop();
                CustomCartServerFunctions = tab;
              }
              else {           
                CustomCartServerFunctions = ExtractFunctions(fileCustomCartPath);
              }
             
            
          const baseServerFunctions  = ExtractFunctions(fileBasePath);
          const NewBaseServerFunctions = ExtractFunctions(filePathNewSFRA);

          for (let j = 0; j < CustomCartServerFunctions.length; j++) {
            const methodCustomCart = CustomCartServerFunctions[j];
            for (let k = 0; k < baseServerFunctions.length; k++) {
            
              const methodBase = baseServerFunctions[k];
              if (methodCustomCart.name === methodBase.name) {
              
                for (let l = 0; l < NewBaseServerFunctions.length; l++) {
                
                  const methodNewBase = NewBaseServerFunctions[l];
                  if (methodNewBase.name === methodBase.name) {
  
                    let isModified = methodNewBase.body === methodBase.body ? 'No' : 'Yes';
                    const updatedData = {
                      cartridges: commonFiles[i].cartridgeName,
                      filePath: commonFiles[i].filePath,
                      fileName : commonFiles[i].name,
                      functions: methodCustomCart.name,
                      isModifiedInSFRA: isModified
                    };
                    
                    newData.push(updatedData);
                  }
                }
              }
            }
          } 
        }
        catch(e){
          console.log(e);
         };
        }
      });
    }
  }
  return newData;
}


function methodsModificationSimple(basePath, newSFRA, diffSfra) {

  let newData = [];

  for (let i = 0; i < diffSfra.length; i++) {

    if(diffSfra[i].Folders.split('/')[1] == 'scripts'  && diffSfra[i].cartridge == basePath.split('/').pop()) {
      
      const file = diffSfra[i].File;
  
      const baseControllersPath = basePath + "/cartridge";
      const newSFRAControllersPath = newSFRA + "/cartridge";

      const fileBasePath = path.join(baseControllersPath,diffSfra[i].Folders, file);
      const filePathNewSFRA  = path.join(newSFRAControllersPath,diffSfra[i].Folders, file);
    
      const baseServerFunctions  = ExtractFunctions(fileBasePath);
      const NewBaseServerFunctions = ExtractFunctions(filePathNewSFRA);
    
      for (let k = 0; k < baseServerFunctions.length; k++) {
      
        const methodBase = baseServerFunctions[k];
        
        for (let l = 0; l < NewBaseServerFunctions.length; l++) {
        
          const methodNewBase = NewBaseServerFunctions[l];
          if (methodNewBase.name === methodBase.name) {

            let isModified = methodNewBase.body === methodBase.body ? 'No' : 'Yes';
            const updatedData = {
              cartridge: diffSfra[i].cartridge,
              folder: diffSfra[i].Folders,
              fileName : file,
              functions: methodNewBase.name,
              isModifiedInSFRA: isModified
            };
            
            newData.push(updatedData);
          }
        }
      }
    }
  }
  return newData;
}
module.exports = {methodsModification ,methodsModificationSimple}
