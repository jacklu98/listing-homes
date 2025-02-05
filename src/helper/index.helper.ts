import { Page } from 'puppeteer';
import { setTimeout } from 'node:timers/promises';
import fs from 'fs';
import { readFile } from 'node:fs/promises';

export const humanLikeDelay = async (page: Page) => {
  // Human-like delays and interactions
  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await setTimeout(3000);
}

export const formatCityName = (city: string) => {
  // change from "Sterling, VA" to "sterling-va"
  const cityData = city.split(",")
  const formatData = cityData.map(word => word.trim().toLowerCase());
  return formatData.join('-');
}

export const writeCityHomesFile = async (city: string, data: string) => {
  const filename = `src/db/${formatCityName(city)}.json`;
  fs.writeFile(filename, data, (err) => {
    if (err) {
      throw err;
    }
    console.log("save successfully");
  });
}

export const readCityHomesFile = async (city: string) => {
  const filename = `src/db/${formatCityName(city)}.json`;
  try {
    const content = await readFile(filename, 'utf8');
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    throw error; // Re-throw other errors
  }
}