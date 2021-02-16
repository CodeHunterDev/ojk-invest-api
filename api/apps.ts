import { NowRequest, NowResponse } from '@vercel/node';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { HTTPCodes } from './../src/const';

/**
 * Search for legal investments application from OJK's data
 *
 * @param {NowRequest} req - request object
 * @param {NowResponse} res - response object
 * @return {NowResponse} - response object, packed with data
 */
export default function(req: NowRequest, res: NowResponse): NowResponse {
  const { query } = req;
  const namePattern = query.name as string;
  const limit = Number(query.limit);
  const offset = Number(query.start) - 1;

  if (limit < 0) {
    return res.status(HTTPCodes.INVALID_PARAMS)
      .json({
        error: 'Nilai `limit` tidak boleh negatif',
      });
  }

  if (offset < 0) {
    return res.status(HTTPCodes.INVALID_PARAMS)
      .json({
        error: 'Nilai `start` tidak boleh lebih kecil dari satu',
      });
  }

  const dataPath = resolve(process.cwd(), 'data', 'apps.json');

  const isDataFetched = existsSync(dataPath);

  if (!isDataFetched) {
    return res.status(HTTPCodes.SERVER_ERROR)
      .json({
        error: 'Data aplikasi inventasi legal tidak tersedia.',
      });
  }

  const rawData = readFileSync(dataPath);
  const source = JSON.parse(rawData.toString('utf-8'));

  let apps: Record<string, unknown>[] = source.data;
  const version = source.version;

  if (namePattern) {
    const pattern = new RegExp(namePattern, 'ig');

    apps = apps.filter((app: Record<string, unknown>) => {
      return pattern.test(app.name as string);
    });
  }

  if (!isNaN(offset)) {
    apps = apps.slice(offset);
  }

  if (!isNaN(limit)) {
    apps = apps.slice(0, limit);
  }

  return res.status(HTTPCodes.SUCCESS)
    .json({
      data: apps,
      version,
    });
}
