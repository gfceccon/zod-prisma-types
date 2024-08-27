import {
  writeDecimalJsLike,
  writeInclude,
  writeInputJsonValue,
  writeInputObjectType,
  writeIsValidDecimalInput,
  writeJsonValue,
  writeSelect,
} from '.';
import { FileWriter } from '../classes';
import { CreateFiles } from '../types';
import ExportMap from '../utils/exportMap';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeInputTypeFiles: CreateFiles = ({ path, dmmf }) => {
  const {
    inputTypePath,
    writeBarrelFiles,
    operationPathName,
    filterPathName,
    noModelAssignedName,
  } = dmmf.generatorConfig;

  // FOLDER PATH AND EXPORT INDEX FILES
  // ------------------------------------------------------------
  const indexFileWriter = new FileWriter();

  const folderPath = indexFileWriter.createPath(`${path}/${inputTypePath}`);
  const filterPath = indexFileWriter.createPath(
    `${path}/${inputTypePath}/${filterPathName}`,
  );
  const operationsPath = indexFileWriter.createPath(
    `${path}/${inputTypePath}/${operationPathName}`,
  );

  const exportMap = new ExportMap();

  if (folderPath) {
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

        exportMap.hasOrCreate(model.name).add(`${model.name}IncludeSchema`);
      }

      new FileWriter().createFile(
        `${outputPath}/${model.name}SelectSchema.ts`,
        (fileWriter) => writeSelect({ fileWriter, dmmf }, model),
      );

      exportMap.hasOrCreate(model.name).add(`${model.name}SelectSchema`);
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

        exportMap
          .hasOrCreate(inputType.linkedModel.name)
          .add(`${inputType.name}Schema`);
      } else if (inputType.name.endsWith('Filter')) {
        new FileWriter().createFile(
          `${filterPath}/${inputType.name}Schema.ts`,
          (fileWriter) => writeInputObjectType({ fileWriter, dmmf }, inputType),
        );

        exportMap.hasOrCreate(filterPathName).add(`${inputType.name}Schema`);
      } else if (inputType.name.endsWith('OperationsInput')) {
        new FileWriter().createFile(
          `${operationsPath}/${inputType.name}Schema.ts`,
          (fileWriter) => writeInputObjectType({ fileWriter, dmmf }, inputType),
        );

        exportMap.hasOrCreate(operationPathName).add(`${inputType.name}Schema`);
      } else {
        new FileWriter().createFile(
          `${folderPath}/${inputType.name}Schema.ts`,
          (fileWriter) => writeInputObjectType({ fileWriter, dmmf }, inputType),
        );

        exportMap
          .hasOrCreate(noModelAssignedName)
          .add(`${inputType.name}Schema`);
      }
    });

    ////////////////////////////////////////////////////
    // WRITE INDEX FILES
    ////////////////////////////////////////////////////

    if (writeBarrelFiles) {
      // WRITE FOLDER INDEX FILE
      new FileWriter().createFile(
        `${folderPath}/index.ts`,
        ({ writeExport }) => {
          if (dmmf.generatorConfig.createInputTypes) {
            exportMap.forEach((exportSet, modelName) => {
              if (modelName == noModelAssignedName) {
                // WRITE FOLDER FILE EXPORTS (NO MODEL)
                exportSet.forEach((exportName) => {
                  writeExport(`{ ${exportName} }`, `./${exportName}`);
                });
              } else {
                // WRITE MODEL FILE EXPORTS (WITH MODEL NAME)
                writeExport(`*`, `./${modelName}`);
              }
            });
          }

          // WRITE STATIC EXPORTS
          if (dmmf.schema.hasJsonTypes) {
            writeExport(`{InputJsonValueSchema}`, `./InputJsonValueSchema`);
            writeExport(`{JsonValueSchema}`, `./JsonValueSchema`);
          }

          // WRITE STATIC EXPORTS
          if (dmmf.schema.hasDecimalTypes) {
            writeExport(`{DecimalJsLikeSchema}`, `./DecimalJsLikeSchema`);
            writeExport(`{isValidDecimalInput}`, `./isValidDecimalInput`);
          }
        },
      );
    }

    // WRITE MODELS INDEX FILE
    exportMap.forEach((exportSet, modelName) => {
      // FOR EACH MODEL (AND NOT CURRENT)
      if (modelName != noModelAssignedName)
        new FileWriter().createFile(
          `${folderPath}/${modelName}/index.ts`,
          ({ writeExport }) => {
            // WRITE MODEL INDEX FILE EXPORTS
            exportSet.forEach((exportName) => {
              writeExport(`{ ${exportName} }`, `./${exportName}`);
            });
          },
        );
    });
  }
};
