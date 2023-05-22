const fs = require('fs');
const acorn = require('acorn');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');


function getFunctionsFromFile(filePath) {
  let editedPath =filePath.replace(/\\/g, '/');
  const fileContent = fs.readFileSync(editedPath, 'utf-8');
  let ast ;

  try{
    ast = acorn.parse(fileContent, {
     sourceType: 'module', 
  });

  }catch(e){
    console.log(e);
  }

  // const ast = acorn.parse(fileContent);
  const functionNames = [];
  const fileName = path.basename(editedPath);
  let functions = [];

  try{     
        ast.body.forEach((node) => {
          if (node.type === 'FunctionDeclaration') {
            const name = node.id.name;
            const bodyStart = node.start;
            const bodyEnd = node.end;
            const body = fileContent.substring(bodyStart, bodyEnd);
            functions.push({ name, body });
          }
          if (
            node.type === 'ExpressionStatement' &&
            node.expression &&
            node.expression.right &&
            node.expression.right.callee &&
            node.expression.right.callee.object &&
            node.expression.right.callee.object.name === 'Object' &&
            node.expression.right.callee.property &&
            node.expression.right.callee.property.name === 'create' &&
            node.expression.right.arguments
          ) {
            node.expression.right.arguments.forEach((argument) => {
              if (
                argument.type === 'ObjectExpression' &&
                argument.properties
              ) {
                argument.properties.forEach((property) => {
                  if (
                    property.key &&
                    property.key.name &&
                    property.key.name !== 'super'
                  ) {
                    const name = property.key.name;
                    const valueStartIndex = fileContent.indexOf('value', property.value.start) + 6;
                    const body = fileContent.substring(valueStartIndex, property.value.end);
                    functionNames.push({ name, body });
                  }
                });
              }
            });
          }

          if (
            node.type === 'ExpressionStatement' &&
            node.expression &&
            node.expression.left &&
            node.expression.left.type === 'MemberExpression' &&
            node.expression.left.property.type === 'Identifier' &&
            node.expression.left.property.name !== 'exports'
          ) {
            const bodyStart = node.expression.right.start;
            const bodyEnd = node.expression.right.end;
            const body = fileContent.substring(bodyStart, bodyEnd);            
            functionNames.push({ name: node.expression.left.property.name, body:body });
          }
          if (
            node.expression &&
            node.expression.left &&
            node.expression.left.type === 'MemberExpression' &&
            node.expression.left.property.type === 'Identifier' &&
            node.expression.left.property.name === 'exports' &&
            node.expression.right &&
            node.expression.right.type === 'ObjectExpression'
          ) {
            const properties = node.expression.right.properties;
            properties.forEach(property => {
              if (property.value && property.value.type === 'FunctionExpression') {
                const functionName = property.key.name;
                const functionStart = property.value.start;
                const functionEnd = property.value.end;
                const functionBody = fileContent.substring(functionStart, functionEnd);
                functionNames.push({ name: functionName, body: functionBody });
              }
            });
          }
        });
        
        functions.forEach((file) => {
          const { name, body } = file;
          const existingFunction = functionNames.find(fn => fn.name === name);
          if (existingFunction) {
            existingFunction.body = body;
          } else {
            functionNames.push({ name, body });
          }
        });
    }
  catch(e){
    console.log(e);
   };
  return functionNames ;
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

          try{       
              
            const lastElement = path.basename(fileBasePath);
          const CustomCartServerFunctions = getFunctionsFromFile(fileCustomCartPath);
          const baseServerFunctions  = getFunctionsFromFile(fileBasePath);
          const NewBaseServerFunctions = getFunctionsFromFile(filePathNewSFRA);

          for (let j = 0; j < CustomCartServerFunctions.length; j++) {
            const methodCustomCart = CustomCartServerFunctions[j];
            for (let k = 0; k < baseServerFunctions.length; k++) {
              const methodBase = baseServerFunctions[k];
              if (methodCustomCart.name === methodBase.name) {
                for (let l = 0; l < NewBaseServerFunctions.length; l++) {
                  const methodNewBase = NewBaseServerFunctions[l];
                  if (methodNewBase.name === methodBase.name) {
                    let isModified = methodNewBase.body === methodBase.body ? 'No' : 'Yes';
                    // console.log('yeey',isModified, 'name:',methodNewBase.name , '>>>',commonFiles[i].name ,'>>>',commonFiles[i].cartridgeName );
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
    
      const baseServerFunctions  = getFunctionsFromFile(fileBasePath);
      const NewBaseServerFunctions = getFunctionsFromFile(filePathNewSFRA);
    
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
