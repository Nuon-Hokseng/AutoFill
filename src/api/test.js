import { generateDummyData } from "./dataGenerator.ts"

import "dotenv/config"

async function test() {
  const dummyData = await generateDummyData()
  console.log(dummyData)
}

test()
