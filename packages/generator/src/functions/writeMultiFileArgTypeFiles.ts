import { FileWriter } from '../classes';
import { CreateFiles } from '../types';
import {
  writeArgs,
  writeCountArgs,
  writeCountSelect,
  writeOutputObjectType,
} from './contentWriters';
import ExportMap from '../utils/exportMap';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeArgTypeFiles: CreateFiles = ({ path, dmmf }) => {
  if (!dmmf.generatorConfig.createInputTypes) return;

  const { outputTypePath, writeBarrelFiles } = dmmf.generatorConfig;

  // FOLDER PATH AND EXPORT INDEX FILES
  // ------------------------------------------------------------
  const indexFileWriter = new FileWriter();
  const folderPath = indexFileWriter.createPath(`${path}/${outputTypePath}`);
  const exportMap = new ExportMap();

  if (folderPath) {
    ////////////////////////////////////////////////////
    // INCLUDE SELECT ARGS
    ////////////////////////////////////////////////////

    dmmf.schema.outputObjectTypes.model.forEach((model) => {
      const outputPath = indexFileWriter.createPath(
        `${path}/${outputTypePath}/${model.name}`,
      );

      if (model.writeIncludeArgs()) {
        new FileWriter().createFile(
          `${outputPath}/${model.name}ArgsSchema.ts`,
          (fileWriter) => writeArgs({ fileWriter, dmmf }, model),
        );

        exportMap.hasOrCreate(model.name).add(`${model.name}ArgsSchema`);
      }

      if (model.writeCountArgs()) {
        new FileWriter().createFile(
          `${outputPath}/${model.name}CountOutputTypeArgsSchema.ts`,
          (fileWriter) => writeCountArgs({ fileWriter, dmmf }, model),
        );

        exportMap
          .hasOrCreate(model.name)
          .add(`${model.name}CountOutputTypeArgsSchema`);

        new FileWriter().createFile(
          `${outputPath}/${model.name}CountOutputTypeSelectSchema.ts`,
          (fileWriter) => writeCountSelect({ fileWriter, dmmf }, model),
        );

        exportMap
          .hasOrCreate(model.name)
          .add(`${model.name}CountOutputTypeSelectSchema`);
      }
    });

    ////////////////////////////////////////////////////
    // ARG SCHEMAS
    ////////////////////////////////////////////////////

    dmmf.schema.outputObjectTypes.argTypes.forEach((outputType) => {
      outputType.prismaActionFields.forEach((field) => {
        const modelName = field.modelType.toString();
        const outputPath = indexFileWriter.createPath(
          `${folderPath}/${modelName}`,
        );

        new FileWriter().createFile(
          `${outputPath}/${field.argName}Schema.ts`,
          (fileWriter) => writeOutputObjectType({ fileWriter, dmmf }, field),
        );

        exportMap.hasOrCreate(modelName).add(`${field.argName}Schema`);
      });
    });

    ////////////////////////////////////////////////////
    // WRITE INDEX FILES
    ////////////////////////////////////////////////////

    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          exportMap.forEach((exportSet, modelName) => {
            exportSet.forEach((exportName) => {
              writeExport(`{ ${exportName} }`, `./${modelName}/${exportName}`);
            });
          });
        },
      );
    }
  }
};
