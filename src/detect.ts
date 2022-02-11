import { ModelOperations } from '@vscode/vscode-languagedetection';
import modelJson from '../node_modules/@vscode/vscode-languagedetection/model/model.json';

async function NODE_MODEL_JSON_FUNC() {
  return new Promise<any>((resolve) => {
    resolve(modelJson);
  });
}

const modulOperations = new ModelOperations({
  modelJsonLoaderFunc: NODE_MODEL_JSON_FUNC,
});

export async function detectLanguage(text: string) {
  const result = await modulOperations.runModel(text);
  return result && result.length > 0
    ? result[0].languageId && result[0].languageId !== ''
      ? result[0].languageId
      : 'text'
    : 'text';
}

import { fileTypeFromBuffer } from 'file-type/core';

export async function detectFile(data: Buffer) {
  const result = await fileTypeFromBuffer(data);
  return result
    ? result.ext && (result.ext as string) !== ''
      ? (result.ext as string)
      : ''
    : '';
}
