import ExportMap from '../utils/exportMap';
import { writeCustomEnum } from '.';
import { FileWriter } from '../classes';
import { CreateFiles } from '../types';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeEnumFiles: CreateFiles = ({ path, dmmf }) => {
  const { enumPath, writeBarrelFiles, noModelAssignedName } =
    dmmf.generatorConfig;

  // FOLDER PATH AND EXPORT INDEX FILES
  // ------------------------------------------------------------
  const indexFileWriter = new FileWriter();
  const folderPath = indexFileWriter.createPath(`${path}/${enumPath}`);
  const exportMap = new ExportMap();

  if (folderPath) {
    ////////////////////////////////////////////////////
    // WRITE ENUMS
    ////////////////////////////////////////////////////

    dmmf.datamodel.enums.forEach((enumData) => {
      new FileWriter().createFile(
        `${folderPath}/${enumData.name}Schema.ts`,
        (fileWriter) => writeCustomEnum({ fileWriter, dmmf }, enumData),
      );
      exportMap.hasOrCreate(noModelAssignedName).add(`${enumData.name}Schema`);
    });

    ////////////////////////////////////////////////////
    // WRITE INDEX FILES
    ////////////////////////////////////////////////////

    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          exportMap.get(noModelAssignedName)?.forEach((exportName) => {
            writeExport(`{ ${exportName} }`, `./${exportName}`);
          });
        },
      );
    }
  }
};
