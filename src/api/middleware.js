import { generateDummyData } from "./dataGenerator.ts";
import "dotenv/config";

//

export async function Middleware(...fields) {
  const dummyData = await generateDummyData();

  if (!dummyData) {
    console.warn("⚠️ No dummy data generated");
    return null;
  }

  // no parameter, it will show all data
  if (fields.length === 0) {
   console.log(dummyData);
  }

  // Return subset of fields
  const result = {};
  for (const field of fields) {
    if (!field) continue;
    if (field in dummyData) {
      result[field] = dummyData[field];
    } else {
      console.warn(`Field "${field}" not found in dummy data`);
    }
  }

  return result;
}
Middleware();