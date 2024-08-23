import { GeneratorConfig } from '../schemas/generatorConfigSchema';

interface RelativeImportType {
  Root: string;
  Enum: string;
  EnumTypes: string;
  InputRoot: string;
  InputFilter: string;
  InputOperation: string;
  InputModel(model: string): string;
  Output: string;
  Model: string;
}

type ImportFromLocation =
  | 'enum'
  | 'enumTypes'
  | 'model'
  | 'inputRoot'
  | 'inputModel'
  | 'filter'
  | 'operation'
  | 'output';

export const ImportMapping = (
  config: GeneratorConfig,
): { [key in ImportFromLocation]: RelativeImportType } => {
  return {
    enum: {
      Root: `../`,
      Enum: `./`,
      EnumTypes: `../${config.enumTypePath}/`,
      InputRoot: `../${config.inputTypePath}`,
      InputFilter: `../${config.inputTypePath}/${config.filterPathName}/`,
      InputOperation: `../${config.inputTypePath}/${config.operationPathName}/`,
      InputModel: (model: string) => `../${config.inputTypePath}/${model}/`,
      Output: `../${config.outputTypePath}/`,
      Model: `../${config.modelsPath}/`,
    },
    enumTypes: {
      Root: `../`,
      EnumTypes: `./`,
      Enum: `../${config.enumPath}/`,
      InputRoot: `../${config.inputTypePath}`,
      InputFilter: `../${config.inputTypePath}/${config.filterPathName}/`,
      InputOperation: `../${config.inputTypePath}/${config.operationPathName}/`,
      InputModel: (model: string) => `../${config.inputTypePath}/${model}/`,
      Output: `../${config.outputTypePath}/`,
      Model: `../${config.modelsPath}/`,
    },
    model: {
      Root: `../`,
      Model: `./`,
      EnumTypes: `../${config.enumTypePath}/`,
      Enum: `../${config.enumPath}/`,
      InputRoot: `../${config.inputTypePath}`,
      InputFilter: `../${config.inputTypePath}/${config.filterPathName}/`,
      InputOperation: `../${config.inputTypePath}/${config.operationPathName}/`,
      InputModel: (model: string) => `../${config.inputTypePath}/${model}/`,
      Output: `../${config.outputTypePath}/`,
    },
    inputRoot: {
      Root: `../`,
      InputRoot: `./`,
      EnumTypes: `../${config.enumTypePath}/`,
      Enum: `../${config.enumPath}/`,
      InputFilter: `./${config.filterPathName}/`,
      InputOperation: `./${config.operationPathName}/`,
      InputModel: (model: string) => `./${model}/`,
      Output: `../${config.outputTypePath}/`,
      Model: `../${config.modelsPath}/`,
    },
    inputModel: {
      Root: `../../`,
      InputRoot: `../`,
      EnumTypes: `../../${config.enumTypePath}/`,
      Enum: `../../${config.enumPath}/`,
      InputFilter: `../${config.filterPathName}/`,
      InputOperation: `../${config.operationPathName}/`,
      InputModel: (model: string) => `../${model}/`,
      Output: `../../${config.outputTypePath}/`,
      Model: `../../${config.modelsPath}/`,
    },
    filter: {
      Root: `../../`,
      EnumTypes: `../../${config.enumTypePath}/`,
      Enum: `../../${config.enumPath}/`,
      InputRoot: `../`,
      InputFilter: `./`,
      InputOperation: `../${config.operationPathName}/`,
      InputModel: (model: string) => `../${model}/`,
      Output: `../../${config.outputTypePath}/`,
      Model: `../../${config.modelsPath}/`,
    },
    operation: {
      Root: `../../`,
      EnumTypes: `../../${config.enumTypePath}/`,
      Enum: `../../${config.enumPath}/`,
      InputRoot: `../`,
      InputFilter: `../${config.filterPathName}/`,
      InputOperation: `./`,
      InputModel: (model: string) => `../${model}/`,
      Output: `../../${config.outputTypePath}/`,
      Model: `../../${config.modelsPath}/`,
    },
    output: {
      Root: `../../`,
      InputOperation: `../../${config.operationPathName}/`,
      EnumTypes: `../../${config.enumTypePath}/`,
      Enum: `../../${config.enumPath}/`,
      InputRoot: `../../${config.inputTypePath}`,
      InputFilter: `../../${config.inputTypePath}/${config.filterPathName}/`,
      InputModel: (model: string) => `../../${config.inputTypePath}/${model}/`,
      Output: `../`,
      Model: `../../${config.modelsPath}/`,
    },
  };
};
