import {
  writeDecimalJsLike,
  writeInclude,
  writeInputJsonValue,
  writeInputObjectType,
  writeIsValidDecimalInput,
  writeJsonValue,
  writePrismaEnum,
  writeSelect,
} from '.';
import { FileWriter } from '../classes';
import { CreateFiles } from '../types';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeInputTypeFiles: CreateFiles = ({ path, dmmf }) => {
  const { inputTypePath, enumPath, enumTypePath, writeBarrelFiles } =
    dmmf.generatorConfig;

  // WRITE INDEX FILE
  // ------------------------------------------------------------
  const indexFileWriter = new FileWriter();

  const folderPath = indexFileWriter.createPath(`${path}/${inputTypePath}`);
  const enumsPath = indexFileWriter.createPath(`${path}/${enumPath}`);
  const enumTypesPath = indexFileWriter.createPath(`${path}/${enumTypePath}`);
  const filtersPath = indexFileWriter.createPath(`${path}/${inputTypePath}/_Filters`);
  const operationsPath = indexFileWriter.createPath(`${path}/${inputTypePath}/_Operations`);

  if (folderPath) {
    if (writeBarrelFiles) {
      indexFileWriter.createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          const writeExportArray = new Array<{
            export: string;
            path: string;
          }>();

          if (dmmf.generatorConfig.createInputTypes) {
            dmmf.schema.inputObjectTypes.prisma.forEach((inputType) => {
              writeExportArray.push({
                export: `${inputType.name}Schema`,
                path: `./${inputType.linkedModel?.name || ''}/${inputType.name}Schema`,
              });
            });
          }

          dmmf.schema.enumTypes.prisma.forEach((enumData) => {
            writeExportArray.push({
              export: `${enumData.name}Schema`,
              path: `./${enumTypesPath}/${enumData.name}Schema`,
            });
          });

          dmmf.datamodel.enums.forEach((enumData) => {
            writeExportArray.push({
              export: `${enumData.name}Schema`,
              path: `./${enumsPath}/${enumData.name}Schema`,
            });
          });

          if (dmmf.schema.hasJsonTypes) {
            writeExportArray.push({
              export: `InputJsonValueSchema`,
              path: `InputJsonValueSchema`,
            });
            writeExportArray.push({
              export: `JsonValueSchema`,
              path: `JsonValueSchema`,
            });
          }

          if (dmmf.schema.hasDecimalTypes) {
            writeExportArray.push({
              export: `DecimalJsLikeSchema`,
              path: `DecimalJsLikeSchema`,
            });
            writeExportArray.push({
              export: `isValidDecimalInput`,
              path: `isValidDecimalInput`,
            });
          }

          writeExportArray.forEach((exportName) => {
            writeExport(`{ ${exportName.export} }`, `./${exportName.path}`);
          });
        },
      );
    }

    ////////////////////////////////////////////////////
    // WRITE HELPER FUNCTIONS & SCHEMAS
    ////////////////////////////////////////////////////

    // JSON
    // ------------------------------------------------------------

    if (dmmf.schema.hasJsonTypes) {
      new FileWriter().createFile(
        `${folderPath}/JsonValueSchema.ts`,
        (fileWriter) => writeJsonValue({ fileWriter, dmmf }),
      );

      new FileWriter().createFile(
        `${folderPath}/InputJsonValueSchema.ts`,
        (fileWriter) => writeInputJsonValue({ fileWriter, dmmf }),
      );
    }

    // DECIMAL
    // ------------------------------------------------------------

    if (dmmf.schema.hasDecimalTypes) {
      new FileWriter().createFile(
        `${folderPath}/DecimalJsLikeSchema.ts`,
        (fileWriter) => writeDecimalJsLike({ fileWriter, dmmf }),
      );

      new FileWriter().createFile(
        `${folderPath}/isValidDecimalInput.ts`,
        (fileWriter) => writeIsValidDecimalInput({ fileWriter, dmmf }),
      );
    }

    ////////////////////////////////////////////////////
    // WRITE ENUMS TYPES
    ////////////////////////////////////////////////////

    dmmf.schema.enumTypes.prisma.forEach((enumData) => {
      new FileWriter().createFile(
        `${enumTypesPath}/${enumData.name}Schema.ts`,
        (fileWriter) => writePrismaEnum({ fileWriter, dmmf }, enumData),
      );
    });

    ////////////////////////////////////////////////////
    // SKIP INPUT TYPES
    ////////////////////////////////////////////////////

    if (!dmmf.generatorConfig.createInputTypes) return;

    ////////////////////////////////////////////////////
    // WRITER INCLUDE & SELECT
    ////////////////////////////////////////////////////

    dmmf.schema.outputObjectTypes.model.forEach((model) => {
      const outputPath = indexFileWriter.createPath(
        `${folderPath}/${model.name}`,
      );
      if (model.hasRelationField()) {
        new FileWriter().createFile(
          `${outputPath}/${model.name}IncludeSchema.ts`,
          (fileWriter) => writeInclude({ fileWriter, dmmf }, model),
        );
      }

      new FileWriter().createFile(
        `${outputPath}/${model.name}SelectSchema.ts`,
        (fileWriter) => writeSelect({ fileWriter, dmmf }, model),
      );
    });

    ////////////////////////////////////////////////////
    // WRITE INPUT TYPE FILES
    ////////////////////////////////////////////////////

    dmmf.schema.inputObjectTypes.prisma.forEach((inputType) => {
      if (inputType.linkedModel) {
        const inputPath = indexFileWriter.createPath(
          `${folderPath}/${inputType.linkedModel.name}`,
        );
        new FileWriter().createFile(
          `${inputPath}/${inputType.name}Schema.ts`,
          (fileWriter) => writeInputObjectType({ fileWriter, dmmf }, inputType),
        );
      } else {
        if (inputType.name.endsWith('Filter')) {
          new FileWriter().createFile(
            `${filtersPath}/${inputType.name}Schema.ts`,
            (fileWriter) =>
              writeInputObjectType({ fileWriter, dmmf }, inputType),
          );
        } else if (inputType.name.endsWith('OperationsInput')) {
          new FileWriter().createFile(
            `${operationsPath}/${inputType.name}Schema.ts`,
            (fileWriter) =>
              writeInputObjectType({ fileWriter, dmmf }, inputType),
          );
        } else {
          new FileWriter().createFile(
            `${folderPath}/${inputType.name}Schema.ts`,
            (fileWriter) =>
              writeInputObjectType({ fileWriter, dmmf }, inputType),
          );
        }
      }
    });
  }
};
