import { FileWriter } from '../classes';
import { CreateFiles } from '../types';
import { writeCustomEnum, writeModelOrType } from './contentWriters';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeModelFiles: CreateFiles = ({ path, dmmf }) => {
  const { modelsPath, enumPath, createModelTypes, writeBarrelFiles } = dmmf.generatorConfig;

  if (!createModelTypes) return;

  const indexFileWriter = new FileWriter();
  const folderPath = indexFileWriter.createPath(`${path}/${modelsPath}`);
  const enumsPath = indexFileWriter.createPath(`${path}/${enumPath}`);
  
  if (folderPath) {
    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          const writeExportSet = new Set<string>();

          dmmf.datamodel.models.forEach((model) => {
            indexFileWriter.createPath(`${folderPath}/${model.name}`);
            writeExportSet.add(`${model.name}/${model.name}Schema`);
          });
          dmmf.datamodel.types.forEach((model) => {
            indexFileWriter.createPath(`${folderPath}/${model.name}`);
            writeExportSet.add(`${model.name}/${model.name}Schema`);
          });

          writeExportSet.forEach((exportName) => {
            writeExport(`*`, `./${exportName}`);
          });
        },
      );
    }

    dmmf.datamodel.models.forEach((model) => {
      const modelPath = indexFileWriter.createPath(
        `${folderPath}/${model.name}`,
      );
      new FileWriter().createFile(
        `${modelPath}/${model.name}Schema.ts`,
        (fileWriter) => writeModelOrType({ fileWriter, dmmf }, model),
      );
    });

    dmmf.datamodel.types.forEach((model) => {
      const modelPath = indexFileWriter.createPath(
        `${folderPath}/${model.name}`,
      );
      new FileWriter().createFile(
        `${modelPath}/${model.name}Schema.ts`,
        (fileWriter) => writeModelOrType({ fileWriter, dmmf }, model),
      );
    });

    dmmf.datamodel.enums.forEach((enumData) => {
      new FileWriter().createFile(
        `${enumsPath}/${enumData.name}Schema.ts`,
        (fileWriter) => writeCustomEnum({ fileWriter, dmmf }, enumData),
      );
    });
  }
};
