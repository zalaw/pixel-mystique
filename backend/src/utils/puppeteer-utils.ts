import puppeteer, { Browser } from "puppeteer";

const getImageURLS = async (browser: Browser, item: string) => {
  try {
    const page = await browser.newPage();

    await page.goto(`https://duckduckgo.com/?q=${item.split(" ").join("+")}jo&iax=images&ia=images`);
    await page.waitForSelector(".tile--img__img", { timeout: 15000 });

    const imgElements = (await page.$$("img.tile--img__img")).slice(0, 10);

    if (imgElements.length === 0) return [];

    const urls = await Promise.all(imgElements.map(img => img.evaluate(el => el.src)));

    await page.close();

    return urls;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getData = async (list: string[], extra: string) => {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const result = [];

  for (let i = 0; i < list.length; i += 5) {
    const batch = list.slice(i, i + 5);

    result.push(
      ...(await Promise.all(
        batch.map(async item => ({
          name: item,
          imageURLS: await getImageURLS(browser, `${extra} ${item}`),
        }))
      ))
    );
  }

  await browser.close();

  return result;
};
