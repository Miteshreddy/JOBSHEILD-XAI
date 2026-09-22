/**
 * URL scraper using axios + cheerio.
 * Fetches the job posting page and extracts all visible text content.
 */
const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Scrape a job posting URL and return its text content.
 * @param {string} url
 * @returns {Promise<string>}
 */
async function scrapeUrl(url) {
  let response;
  try {
    response = await axios.get(url, {
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      maxRedirects: 5,
    });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT") {
      throw new Error(`Could not reach the URL: ${err.message}`);
    }
    if (err.response) {
      throw new Error(`The page returned HTTP ${err.response.status}. Please check the URL.`);
    }
    throw new Error(`Failed to fetch URL: ${err.message}`);
  }

  const contentType = response.headers["content-type"] || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("The URL does not point to an HTML page.");
  }

  const $ = cheerio.load(response.data);

  // Remove script, style, nav, footer noise
  $("script, style, nav, footer, header, noscript, iframe, .cookie-banner, .ad").remove();

  // Try specific job content selectors first
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job_description"]',
    '[id*="job-description"]',
    '[class*="posting"]',
    '[class*="vacancy"]',
    "article",
    "main",
    ".content",
    "#content",
    "body",
  ];

  let text = "";
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      text = el.text();
      break;
    }
  }

  if (!text || text.trim().length < 50) {
    text = $("body").text();
  }

  // Clean up whitespace
  text = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length < 50) {
    throw new Error("Could not extract meaningful text from the URL. The page may be dynamically rendered (SPA).");
  }

  return text.slice(0, 8000); // cap at 8000 chars
}

module.exports = { scrapeUrl };
