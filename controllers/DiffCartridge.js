const fs = require('fs');
const path = require('path');


function compareFiles(file1, file2) {

    const content1 = fs.readFileSync(file1);
    const content2 = fs.readFileSync(file2);

    if (content1.length !== content2.length) {
        return false;
    }

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


function getFilePaths(folderPath, globalCartridgePath) {

    let filePaths = [];
    let folderPaths=[];
    let exclude=['static','templates'];

    fs.readdirSync(folderPath).forEach((file) => {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        let editedPath = filePath.replace(/\\/g, '/'); 
        let lastSlashIndex = editedPath.lastIndexOf("/"); 
        
        if (stat.isFile() && !exclude.includes(file) && folderPath!=globalCartridgePath) {
            let relativePath = editedPath.substring(0, lastSlashIndex);
            filePaths.push({name : file, path : relativePath.replace(globalCartridgePath, "")});
            if (!folderPaths.includes(relativePath.replace(globalCartridgePath, ""))) {
                folderPaths.push(relativePath.replace(globalCartridgePath, ""));
              }

        } else if (stat.isDirectory() && !exclude.includes(file)  ) {

             folderPaths = folderPaths.concat(getFilePaths(filePath,globalCartridgePath)); 

        }
    });



    return folderPaths; 
}


function DiffCart(CurrentSfra,NewSfra,cartridge){
    let DataDiff=[];
    var SfraFolders=getFilePaths(NewSfra,NewSfra);

    for (const folder in SfraFolders) {

        if(fs.existsSync(CurrentSfra+SfraFolders[folder])){
            var Files = compareFolders(CurrentSfra+SfraFolders[folder],NewSfra+SfraFolders[folder]);
            if(Files.length>0){
                for (const file in Files) {
                    if(cartridge){
                        DataDiff.push({Folders:SfraFolders[folder],File:Files[file],cartridge:cartridge});
                    }else {
                        DataDiff.push({Folders:SfraFolders[folder],File:Files[file]});
                    }
                }
            }
        }
        
    }
    
    return DataDiff

}

module.exports = { DiffCart }