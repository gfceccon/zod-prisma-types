import { DMMF, ReadonlyDeep } from '@prisma/generator-helper';
import { upperFirst } from 'lodash';

import { ExtendedDMMFDatamodel } from './extendedDMMFDatamodel';
import { ExtendedDMMFField } from './extendedDMMFField';
import { ExtendedDMMFModel } from './extendedDMMFModel';
import {
  ExtendedDMMFSchemaArg,
  ZodValidatorOptions,
} from './extendedDMMFSchemaArg';
import { FormattedNames } from './formattedNames';
import {
  PRISMA_FUNCTION_TYPES_WITH_VALIDATORS,
  PRISMA_FUNCTION_TYPES_WITH_VALIDATORS_WHERE_UNIQUE,
} from '../constants/regex';
import { GeneratorConfig } from '../schemas';

type RegexFlags = 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'v' | 'y';

const SPLIT_REGEX_COMPOUND_UNIQUE = /CompoundUnique/g;
const SPLIT_REGEX_TYPES: string[] = [
  'Unchecked',
  'Create',
  'Update',
  'CreateMany',
  'CreateManyAndReturn',
  'UpdateMany',
  'Upsert',
  'Where',
  'WhereUnique',
  'OrderBy',
  'ScalarWhere',
  'Aggregate',
  'GroupBy',
  '(Avg|Count|Max|Min|Sum)OrderByAggregate'
];

const FLAGS: RegexFlags[] = ['g'];

/////////////////////////////////////////////////
// CLASS
/////////////////////////////////////////////////

export class ExtendedDMMFInputType
  extends FormattedNames
  implements DMMF.InputType
{
  readonly name: DMMF.InputType['name'];
  readonly constraints: DMMF.InputType['constraints'];
  readonly meta: DMMF.InputType['meta'];
  readonly fields: ExtendedDMMFSchemaArg[];
  // readonly fieldMap: DMMF.InputType['fieldMap'];
  readonly linkedModel?: ExtendedDMMFModel;
  readonly isJsonField: boolean;
  readonly isBytesField: boolean;
  readonly isDecimalField: boolean;
  readonly omitFields: string[] = [];
  readonly imports: Set<string>;
  /** @deprecated */
  readonly isWhereUniqueInput?: boolean;
  readonly extendedWhereUniqueFields?: ExtendedDMMFSchemaArg[][];

  constructor(
    readonly generatorConfig: GeneratorConfig,
    type: DMMF.InputType,
    datamodel: ExtendedDMMFDatamodel,
  ) {
    super(type.name);
    this.generatorConfig = generatorConfig;
    this.name = type.name;
    this.constraints = type.constraints;
    this.meta = type.meta;
    this.fields = this._setFields(type.fields);
    this.linkedModel = this._setLinkedModel(datamodel);
    // this.fieldMap = type.fieldMap;
    this.isJsonField = this._setIsJsonField();
    this.isBytesField = this._setIsBytesField();
    this.isDecimalField = this._setIsDecimalField();
    this.omitFields = this._setOmitFields();
    this.imports = this._setImports();
    this.extendedWhereUniqueFields = this._setExtendedWhereUniqueFields(
      type.fields,
    );
  }

  /**
   * Finds the datamodel that matches the input type.
   * This way the documentation ,validator strings and other information
   * from the datamodel can be added to the input types.
   */
  private _setLinkedModel(datamodel: ExtendedDMMFDatamodel) {

    // Some select files containes CompoundUnique, remove the args to get the model
    const compoundMatch = this.name.match(SPLIT_REGEX_COMPOUND_UNIQUE);
    let compoundModel = '';

    if (compoundMatch != null) {
      compoundModel = this.name.split(compoundMatch[0])[0];
      const fields = this.fields.map((field) => upperFirst(field.name.trim()));
      compoundModel = fields.reduce(
        (prev, current) => prev.replace(current, ''),
        compoundModel,
      );
    }

    return datamodel.models.find(
      (model) =>
        // Need to split string to obtain the model name from the input type name.
        // Some names contains functions like Min, Max, etc. combine those before searching.
        // Also check if it was a compound unique select.
        model.name ===
          this.name.split(
            new RegExp(
              `(${SPLIT_REGEX_TYPES.join("|")})`,
              FLAGS.join(),
            ),
          )[0] || model.name === compoundModel,
    );
  }

  private _setFields(fields: ReadonlyDeep<DMMF.SchemaArg[]>) {
    // FILTER FIELD REF TYPES
    // -----------------------------------------------

    // filter out all fields that are located in fieldRefTypes
    // since this feature needs access to the prisma client instance
    // which is not possible in the zod schema.

    const noFieldRefFiels = fields.map((field) => {
      if (
        field.inputTypes.some(
          (inputType) => inputType.location === 'fieldRefTypes',
        )
      ) {
        return { ...field, inputTypes: [field.inputTypes[0]] };
      }
      return field;
    });

    return noFieldRefFiels.map((field) => {
      const linkedField = this.linkedModel?.fields.find(
        (modelField) => modelField.name === field.name,
      );

      // validators and omitField should only be written for create and update types.
      // this prevents validation in e.g. search queries in "where inputs",
      // where strings like email addresses can be incomplete.
      const optionalValidators: ZodValidatorOptions | undefined =
        this._fieldIsPrismaFunctionType()
          ? {
              zodValidatorString: this._getZodValidatorString(field.name),
              zodCustomErrors: this._getZodCustomErrorsString(field.name),
              zodCustomValidatorString: this._getZodCustomValidatorString(
                field.name,
              ),
              zodOmitField: this._getZodOmitField(linkedField),
            }
          : undefined;

      return new ExtendedDMMFSchemaArg(
        this.generatorConfig,
        { ...field, ...optionalValidators },
        linkedField,
      );
    });
  }

  private _fieldIsPrismaFunctionType() {
    if (
      !this.generatorConfig.useMultipleFiles ||
      this.generatorConfig.validateWhereUniqueInput
    ) {
      return PRISMA_FUNCTION_TYPES_WITH_VALIDATORS_WHERE_UNIQUE.test(this.name);
    }
    return PRISMA_FUNCTION_TYPES_WITH_VALIDATORS.test(this.name);
  }

  private _getZodValidatorString(fieldName: string) {
    return this.linkedModel?.fields.find((field) => field.name === fieldName)
      ?.zodValidatorString;
  }

  private _getZodCustomErrorsString(fieldName: string) {
    return this.linkedModel?.fields.find((field) => field.name === fieldName)
      ?.zodCustomErrors;
  }

  private _getZodCustomValidatorString(fieldName: string) {
    return this.linkedModel?.fields.find((field) => field.name === fieldName)
      ?.zodCustomValidatorString;
  }

  private _getZodOmitField(linkedField?: ExtendedDMMFField) {
    if (!linkedField) return undefined;

    const shouldOmitField =
      linkedField.zodOmitField === 'input' ||
      linkedField.zodOmitField === 'all';

    return shouldOmitField;
  }

  private _setIsJsonField() {
    return this.fields.some((field) => field.isJsonType);
  }

  private _setIsBytesField() {
    return this.fields.some((field) => field.isBytesType);
  }

  private _setIsDecimalField() {
    return this.fields.some((field) => field.isDecimalType);
  }

  /**
   * Filters all fields that should be omitted in the input type.
   * This is used to create the "Omit" ts-type for the input type.
   * @returns an array of field names that should be omitted in the input type
   */
  private _setOmitFields() {
    return this.fields
      .filter((field) => field.zodOmitField)
      .map((field) => field.name);
  }

  private _setImports() {
    const { prismaClientPath, decimalJSInstalled } = this.generatorConfig;
    const prismaImport = this.isDecimalField
      ? `import { Prisma } from '${prismaClientPath}';`
      : `import type { Prisma } from '${prismaClientPath}';`;
    const decimalJSImport =
      decimalJSInstalled && this.isDecimalField
        ? `import Decimal from 'decimal.js';`
        : '';
    const zodImport = "import { z } from 'zod';";

    const fieldImports = [
      prismaImport,
      decimalJSImport,
      zodImport,
      ...this.fields.map((field) => field.getImports(this.name)).flat(),
    ];

    if (this._fieldIsPrismaFunctionType() && this.linkedModel?.fieldImports) {
      fieldImports.push(...this.linkedModel.fieldImports);
    }

    return new Set(fieldImports);
  }

  private _getExtendedWhereUniqueFieldCombinations(
    arr: DMMF.SchemaArg[],
  ): DMMF.SchemaArg[][] {
    const result: DMMF.SchemaArg[][] = [];

    function combine(start: number, soFar: DMMF.SchemaArg[]) {
      if (soFar.length === arr.length) {
        result.push(soFar.slice());
        return;
      }

      // include current element
      combine(start + 1, [...soFar, { ...arr[start], isRequired: true }]);

      // exclude current element
      combine(start + 1, [...soFar, { ...arr[start], isRequired: false }]);
    }

    combine(0, []);
    return result;
  }

  private _setExtendedWhereUniqueFields(
    fields: ReadonlyDeep<DMMF.SchemaArg[]>,
  ) {
    if (!this.constraints.fields || !this.name.includes('WhereUniqueInput')) {
      return undefined;
    }

    // get the DMMF.SchemaArg for all fields that are part of the constraints
    // that are marked for the extended where unique input
    const extendedWhereUniqueFields = [
      ...new Set(
        this.constraints.fields
          .map((fieldName) => {
            return fields.find((field) => field.name === fieldName);
          })
          .filter((field): field is DMMF.SchemaArg => field !== undefined),
      ),
    ];

    // get all combinations of bool values on isRequired fields
    // for the provided set of fields
    const combinations = this._getExtendedWhereUniqueFieldCombinations(
      extendedWhereUniqueFields,
    );

    // console.log({ combinations });

    // filter out combinations where isRequired is False because
    // these cominations are included in the all optional type that is
    // later cominened with the generated union type.
    const filteredCombinations = combinations.filter(
      (combination) => !combination.every((field) => !field.isRequired),
    );

    // filter out all fields that are not required
    // since they are added via the all optional type
    const extendedFilterdCombinations = filteredCombinations.map(
      (combination) => {
        return combination.filter((field) => field.isRequired);
      },
    );

    // create an ExtendedDMMFSchemaArg for each combination field
    // so the writer functions can be used as is
    return extendedFilterdCombinations.map((combination) => {
      return this._setFields(combination);
    });
  }

  hasOmitFields() {
    return this.omitFields.length > 0;
  }

  getOmitFieldsUnion() {
    return this.omitFields.map((field) => `"${field}"`).join(' | ');
  }
}
