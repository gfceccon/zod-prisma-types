import { FileWriter } from '../classes';
import { CreateFiles } from '../types';
import {
  writeArgs,
  writeCountArgs,
  writeCountSelect,
  writeOutputObjectType,
} from './contentWriters';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeArgTypeFiles: CreateFiles = ({ path, dmmf }) => {
  if (!dmmf.generatorConfig.createInputTypes) return;

  const { outputTypePath, writeBarrelFiles } = dmmf.generatorConfig;

  // WRITE INDEX FILE
  // ------------------------------------------------------------

  const indexFileWriter = new FileWriter();

  const folderPath = indexFileWriter.createPath(`${path}/${outputTypePath}`);

  if (folderPath) {
    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          const writeExportArray = new Array<{
            export: string;
            path: string;
          }>();

          dmmf.schema.outputObjectTypes.model.forEach((model) => {
            if (model.hasRelationField()) {
              writeExportArray.push({
                export: `${model.name}ArgsSchema`,
                path: `${model.name}/${model.name}Schema`,
              });
            }
          });

          dmmf.schema.outputObjectTypes.argTypes.forEach((outputType) => {
            outputType.prismaActionFields.forEach((field) => {
              writeExportArray.push({
                export: `${field.argName}Schema`,
                path: `${field.modelType}/${field.name}Schema`,
              });
            });
          });

          writeExportArray.forEach((exportName) => {
            writeExport(`{ ${exportName.export} }`, `./${exportName.path}`);
          });
        },
      );
    }

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
      }

      if (model.writeCountArgs()) {
        new FileWriter().createFile(
          `${outputPath}/${model.name}CountOutputTypeArgsSchema.ts`,
          (fileWriter) => writeCountArgs({ fileWriter, dmmf }, model),
        );

        new FileWriter().createFile(
          `${outputPath}/${model.name}CountOutputTypeSelectSchema.ts`,
          (fileWriter) => writeCountSelect({ fileWriter, dmmf }, model),
        );
      }
    });

    ////////////////////////////////////////////////////
    // ARG SCHEMAS
    ////////////////////////////////////////////////////

    dmmf.schema.outputObjectTypes.argTypes.forEach((outputType) => {
      outputType.prismaActionFields.forEach((field) => {
        const outputPath = indexFileWriter.createPath(
          `${folderPath}/${field.modelType}`,
        );

        new FileWriter().createFile(
          `${outputPath}/${field.argName}Schema.ts`,
          (fileWriter) => writeOutputObjectType({ fileWriter, dmmf }, field),
        );
      });
    });
  }
};
