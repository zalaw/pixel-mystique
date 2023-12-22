import puppeteer, { Browser } from "puppeteer";

const getImageURL = async (browser: Browser, item: string) => {
  try {
    const page = await browser.newPage();

    await page.goto(`https://duckduckgo.com/?q=${item.split(" ").join("+")}jo&iax=images&ia=images`);
    await page.waitForSelector(".tile--img__img", { timeout: 5000 });

    const imgElements = await page.$$("img.tile--img__img");

    if (imgElements.length === 0) return null;

    const url = await imgElements[Math.floor(Math.random() * Math.min(imgElements.length, 5))].evaluate(el => el.src);

    await page.close();

    return url;
  } catch (err) {
    return "";
  }
};

export const getImageURLS = async (list: { name: string; imageURL: string }[]) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const data = await Promise.all(
    list.map(async item => {
      item.imageURL = (await getImageURL(browser, item.name)) || "";
    })
  );

  await browser.close();

  return data;
};
