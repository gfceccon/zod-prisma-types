import { FileWriter } from './classes';
import {
  writeArgTypeFiles,
  writeInputTypeFiles,
  writeModelFiles,
} from './functions';
import { writeEnumFiles } from './functions/writeMultiFileEnumFiles';
import { writeEnumTypeFiles } from './functions/writeMultiFileEnumTypeFiles';
import { CreateOptions } from './types';

export const generateMultipleFiles = ({ dmmf, path }: CreateOptions) => {
  const { createModelTypes, createInputTypes, writeBarrelFiles } =
    dmmf.generatorConfig;

  // Create the index file
  if (writeBarrelFiles) {
    new FileWriter().createFile(`${path}/index.ts`, ({ writeExport }) => {
      if (createModelTypes) {
        writeExport('*', `./${dmmf.generatorConfig.modelsPath}`);
      }

      if (createInputTypes) {
        writeExport('*', `./${dmmf.generatorConfig.outputTypePath}`);
      }

      writeExport('*', `./${dmmf.generatorConfig.inputTypePath}`);

      writeExport('*', `./${dmmf.generatorConfig.enumPath}`);

      writeExport('*', `./${dmmf.generatorConfig.enumTypePath}`);
    });
  }

  writeModelFiles({ path, dmmf });
  writeInputTypeFiles({ path, dmmf });
  writeArgTypeFiles({ path, dmmf });
  writeEnumFiles({ path, dmmf });
  writeEnumTypeFiles({ path, dmmf });
};
