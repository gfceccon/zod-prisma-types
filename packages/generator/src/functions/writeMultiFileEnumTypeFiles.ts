import ExportMap from '../utils/exportMap';
import { writePrismaEnum } from '.';
import { FileWriter } from '../classes';
import { CreateFiles } from '../types';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeEnumTypeFiles: CreateFiles = ({ path, dmmf }) => {
  const { enumTypePath, writeBarrelFiles, noModelAssignedName } =
    dmmf.generatorConfig;

  // FOLDER PATH AND EXPORT INDEX FILES
  // ------------------------------------------------------------
  const indexFileWriter = new FileWriter();
  const folderPath = indexFileWriter.createPath(`${path}/${enumTypePath}`);
  const exportMap = new ExportMap();

  if (folderPath) {
    ////////////////////////////////////////////////////
    // WRITE ENUMS TYPES
    ////////////////////////////////////////////////////

    dmmf.schema.enumTypes.prisma.forEach((enumData) => {
      new FileWriter().createFile(
        `${folderPath}/${enumData.name}Schema.ts`,
        (fileWriter) => writePrismaEnum({ fileWriter, dmmf }, enumData),
      );

      exportMap.hasOrCreate(noModelAssignedName).add(enumData.name);
    });

    ////////////////////////////////////////////////////
    // WRITE INDEX FILES
    ////////////////////////////////////////////////////
    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          // EXPORT ALL ENUM TYPES IN THE ROOT FOLDER
          exportMap.forEach((exportSet, _) => {
            exportSet.forEach((exportName) => {
              writeExport(`{ ${exportName}Schema }`, `./${exportName}Schema`);
            });
          });
        },
      );
    }
  }
};
