const fs = require('fs');
const path = require('path');
const acorn = require('acorn');



function ExtractServer(filePath) {
  let editedPath = filePath.replace(/\\/g, '/');
  const fileContent = fs.readFileSync(editedPath, 'utf-8');
  const ast = acorn.parse(fileContent);
  const fileName = path.basename(editedPath);
  // console.log('filename', fileName);

  let functions = [];
  ast.body.forEach((node) => {
    if (node.type === 'FunctionDeclaration') {
      const name = node.id.name;
      const bodyStart = node.start;
      const bodyEnd = node.end;
      const body = fileContent.substring(bodyStart, bodyEnd);
      functions.push({
        name,
        body
      });
    }
    if (
      node.type === 'ExpressionStatement' &&
      node.expression &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee &&
      (node.expression.callee.type === 'MemberExpression' || node.expression.callee.type === 'Identifier') &&
      node.expression.callee.object &&
      node.expression.callee.object.name === 'server' &&
      node.expression.callee.property &&
      node.expression.callee.property.type === 'Identifier' && node.expression.callee.property.name !== 'extend' &&
      node.expression.arguments &&
      node.expression.arguments.length
    ) {
      const fileNamee = fileName;
      const filepathh = filePath;
      const calleeProperty = node.expression.callee.property.name;

      let method = calleeProperty.match(/^(get|post|put|delete|append|replace|prepend)$/i) ?
        calleeProperty.toUpperCase() :
        'UNKNOWN';
      const arguments = node.expression.arguments;
      let functionBody, functionName;
      arguments.forEach(argument => {
        if (argument.type === 'Literal') {
          functionName = argument.value;
        }
        if (argument.type === 'FunctionExpression') {
          const functionStart = argument.start;
          const functionEnd = argument.end;
          functionBody = fileContent.substring(functionStart, functionEnd);
          // console.log('test1', functionBody )
          functions.push({
            name: functionName,
            body: functionBody,
            method: method
          });
        }

      });

    }
  });
  return functions;
}



function methodsModification(basePath, newSFRA, customCartPaths, folderData) {
  const commonFiles = folderData.commonFiles;
  console.log('youpi', commonFiles);
  let newData = [];
  try {
    for (let i = 0; i < commonFiles.length; i++) {

      if (commonFiles[i].filePath.split('/')[1] == 'controllers' || commonFiles[i].filePath == '/controllers') {
        const k = commonFiles[i].cartridgeName;
        console.log('youpii', k, 'helloooo', commonFiles[i].filePath);

        const file = commonFiles[i].name;

        customCartPaths.forEach((customCartPath) => {
          try {

            if (commonFiles[i].cartridgeName == customCartPath.split('/').pop()) {

              const customCartControllersPath = customCartPath + "/cartridge/" + commonFiles[i].filePath;
              const baseControllersPath = basePath + "/cartridge/" + commonFiles[i].filePath;
              const newSFRAControllersPath = newSFRA + "/cartridge/" + commonFiles[i].filePath;


              const fileBasePath = path.join(baseControllersPath, file);
              const t = path.basename(fileBasePath);
              const fileCustomCartPath = path.join(customCartControllersPath, file);
              const filePathNewSFRA = path.join(newSFRAControllersPath, file);

              const baseServerFunctions = ExtractServer(fileBasePath);
              const CustomCartServerFunctions = ExtractServer(fileCustomCartPath);
              const NewBaseServerFunctions = ExtractServer(filePathNewSFRA);
              // try{

              for (let j = 0; j < CustomCartServerFunctions.length; j++) {

                const methodCustomCart = CustomCartServerFunctions[j];
                for (let k = 0; k < baseServerFunctions.length; k++) {

                  const methodBase = baseServerFunctions[k];
                  if (methodCustomCart.name === methodBase.name) {

                    for (let l = 0; l < NewBaseServerFunctions.length; l++) {

                      const methodNewBase = NewBaseServerFunctions[l];
                      if (methodNewBase.method === methodBase.method && methodNewBase.name === methodBase.name) {

                        let isModified = methodNewBase.body === methodBase.body ? 'No' : 'Yes';
                        const updatedData = {
                          cartridges: commonFiles[i].cartridgeName,
                          controllers: commonFiles[i].name,
                          overridType: methodCustomCart.method,
                          Methods: methodCustomCart.name,
                          isModifiedInSFRA: isModified
                        };

                        newData.push(updatedData);
                      }
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.log(e);
          }
        });
      }
    }
  } catch (e) {
    console.log(e);
  }
  return newData;
}


function methodsModificationSimple(basePath, newSFRA, diffSfra) {

  let newData = [];

  for (let i = 0; i < diffSfra.length; i++) {

    if ((diffSfra[i].Folders.split('/')[1] == 'controllers' || diffSfra[i].Folders == '/controllers') &&
      diffSfra[i].cartridge == basePath.split('/').pop()) {

      const file = diffSfra[i].File;

      const baseControllersPath = basePath + "/cartridge/" + diffSfra[i].Folders;
      const newSFRAControllersPath = newSFRA + "/cartridge/" + diffSfra[i].Folders;


      const fileBasePath = path.join(baseControllersPath, file);
      const filePathNewSFRA = path.join(newSFRAControllersPath, file);

      const baseServerFunctions = ExtractServer(fileBasePath);
      const NewBaseServerFunctions = ExtractServer(filePathNewSFRA);

      for (let k = 0; k < baseServerFunctions.length; k++) {

        const methodBase = baseServerFunctions[k];

        for (let l = 0; l < NewBaseServerFunctions.length; l++) {
          const methodNewBase = NewBaseServerFunctions[l];
          if (methodNewBase.method === methodBase.method && methodNewBase.name === methodBase.name) {

            let isModified = methodNewBase.body === methodBase.body ? 'No' : 'Yes';
            const updatedData = {
              cartridge: diffSfra[i].cartridge,
              controllers: diffSfra[i].File,
              Methods: methodNewBase.name,
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


module.exports = {
  methodsModification,
  methodsModificationSimple
}