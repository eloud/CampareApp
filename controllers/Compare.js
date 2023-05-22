const config=require('../config');
const fs = require('fs');
const path = require('path');



function compareFiles(file1, file2) {
    // Read the contents of both files
    const content1 = fs.readFileSync(file1);
    const content2 = fs.readFileSync(file2);
  
    // Compare the length of the files' contents
    if (content1.length !== content2.length) {
      return false;
    }
  
    // Compare the contents of the files byte by byte
    for (let i = 0; i < content1.length; i++) {
      if (content1[i] !== content2[i]) {
        return false;
      }
    }
  
    return true;
  }


  function compareFolders(folder1, folder2) {


    const files1 = fs.readdirSync(folder1);
    const files2 = fs.readdirSync(folder2);
  
    const commonFiles = files1.filter(file => files2.includes(file));
    const differentFiles = commonFiles.filter(file => {
      const stat = fs.statSync(path.join(folder1, file));
      if(stat.isFile()){
        const SameContent=compareFiles(path.join(folder1, file),path.join(folder2, file));
        return !SameContent;
      }
   
    });


    
    return differentFiles;

  }


  module.exports = { compareFolders }