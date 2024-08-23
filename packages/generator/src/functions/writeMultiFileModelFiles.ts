import { FileWriter } from '../classes';
import { CreateFiles } from '../types';
import { writeModelOrType } from './contentWriters';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeModelFiles: CreateFiles = ({ path, dmmf }) => {
  const { modelsPath, createModelTypes, writeBarrelFiles } =
    dmmf.generatorConfig;

  if (!createModelTypes) return;

  // FOLDER PATH AND EXPORT INDEX FILES
  // ------------------------------------------------------------
  const indexFileWriter = new FileWriter();
  const folderPath = indexFileWriter.createPath(`${path}/${modelsPath}`);
  const writeExportSet = new Set<string>();

  if (folderPath) {
    ////////////////////////////////////////////////////
    // WRITE MODEL FILES
    ////////////////////////////////////////////////////

    dmmf.datamodel.models.forEach((model) => {
      const modelPath = indexFileWriter.createPath(
        `${folderPath}/${model.name}`,
      );
      new FileWriter().createFile(
        `${modelPath}/${model.name}Schema.ts`,
        (fileWriter) => writeModelOrType({ fileWriter, dmmf }, model),
      );
      writeExportSet.add(`${model.name}/${model.name}Schema`);
    });

    ////////////////////////////////////////////////////
    // WRITE MODEL TYPE FILES
    ////////////////////////////////////////////////////

    dmmf.datamodel.types.forEach((model) => {
      const modelPath = indexFileWriter.createPath(
        `${folderPath}/${model.name}`,
      );
      new FileWriter().createFile(
        `${modelPath}/${model.name}Schema.ts`,
        (fileWriter) => writeModelOrType({ fileWriter, dmmf }, model),
      );
      writeExportSet.add(`${model.name}/${model.name}Schema`);
    });

    ////////////////////////////////////////////////////
    // WRITE INDEX FILE
    ////////////////////////////////////////////////////

    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          writeExportSet.forEach((exportName) => {
            writeExport(`*`, `./${exportName}`);
          });
        },
      );
    }
  }
};
