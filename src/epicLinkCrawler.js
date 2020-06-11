"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const request_1 = __importDefault(require("request"));
const cheerio_1 = __importDefault(require("cheerio"));
const url_parse_1 = __importDefault(require("url-parse"));
const epic_storage_1 = require("epic-storage");
const html_minifier_1 = require("html-minifier");
// @ts-ignore | Because No Type Declaration Available!
const extract_domain_1 = __importDefault(require("extract-domain"));
//The Class
class epicLinkCrawler {
    //Constructor
    constructor() {
        this.url = "";
        this.urlObject = null;
        this.domain = "";
        this.urlBase = "";
        this.storage = new epic_storage_1.epicStorage({ logs: false });
        this.cacheName = "epicLinkCrawler";
        this.urlCache = [];
        this.cacheChanged = false;
        this.contentCache = {};
        this.options = {
            depth: 1,
            strict: true,
            cache: true,
        };
        this.init = (url, { depth = 1, strict = true, cache = true } = {}) => {
            return new Promise((resolve, reject) => {
                this.validUrl(url).then(() => {
                    //Process Url
                    this.url = url.replace(/^\/+|\/+$/g, "");
                    this.urlObject = new url_parse_1.default(this.url);
                    this.domain = extract_domain_1.default(this.url);
                    this.options.depth = depth;
                    this.options.strict = strict;
                    this.options.cache = cache;
                    if (this.urlObject.origin == "null")
                        reject("Invalid URL Has Been Provided!");
                    else {
                        this.urlBase = this.urlObject.protocol + "//" + this.urlObject.hostname;
                        if (this.options.cache)
                            //Initialize Storage
                            this.storage.init().then(() => {
                                this.storage.addSchema(this.cacheName, true).then(() => {
                                    this.storage.getAllItems().then((data) => {
                                        this.contentCache = data;
                                        resolve();
                                    }).catch(reject);
                                });
                            }).catch(reject);
                        else
                            resolve();
                    }
                }).catch(error => {
                    reject(error);
                });
            });
        };
        this.validUrl = (url) => {
            return new Promise((resolve, reject) => {
                request_1.default(url, (error, response, content) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode >= 300) {
                        reject(response.statusMessage);
                    }
                    else {
                        resolve(content);
                    }
                });
            });
        };
        this.config = ({ depth = 1, strict = true, cache = true } = {}) => {
            this.options.depth = depth;
            this.options.strict = strict;
            this.options.cache = cache;
            return this;
        };
        this.getContent = (url) => {
            return new Promise((resolve) => {
                if (this.options.cache && typeof this.contentCache[url] != "undefined") {
                    resolve(this.contentCache[url]);
                    //Log
                    console.log("Loaded From Cache :::::::::::::::::::", url, "(You can clear cache by calling clearCache() method.)");
                }
                else {
                    request_1.default(url, (error, response, content) => {
                        var _a, _b;
                        if (!error)
                            if (((_b = (_a = response.headers['content-type']) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.search("text/html")) != -1) {
                                this.cacheChanged = true;
                                let minifiedContent = html_minifier_1.minify(content, {
                                    removeAttributeQuotes: true,
                                    removeEmptyAttributes: true,
                                    removeComments: true,
                                    removeEmptyElements: true,
                                    removeOptionalTags: true,
                                    removeTagWhitespace: true,
                                    removeRedundantAttributes: true,
                                    removeScriptTypeAttributes: true,
                                    removeStyleLinkTypeAttributes: true,
                                    trimCustomFragments: true,
                                    useShortDoctype: true,
                                });
                                this.contentCache[url] = minifiedContent;
                                resolve(minifiedContent);
                                //Log
                                console.log("Fresh Fetch :::::::::::::::::::", url);
                            }
                            else {
                                resolve("");
                                //Log
                                console.log("No Content!", url);
                            }
                        else {
                            resolve("");
                            //Log
                            console.log("No Content!", url);
                        }
                    });
                }
            });
        };
        this.clearCache = () => {
            this.storage.clearSchema(this.cacheName);
            return this;
        };
        this.collectLinks = (content) => {
            let self = this;
            if (typeof content == "undefined")
                content = "";
            let $ = self.$.load(content);
            if ($("meta[name='robots']").length > 0) {
                if ($("meta[name='robots']").attr("content") == "noindex, nofollow" ||
                    $("meta[name='robots']").attr("content") == "noindex,nofollow" ||
                    $("meta[name='robots']").attr("content") == "noindex" ||
                    $("meta[name='robots']").attr("content") == "nofollow") {
                    return [];
                }
            }
            let relativeLinks = $("a[href^='/']").not("[rel='nofollow']");
            let absoluteLinks = $("a[href^='http']").not("[rel='nofollow']");
            let relativeLinksArray = [];
            let absoluteLinksArray = [];
            //Collect Relative Links
            relativeLinks.each(function () {
                let href = $(this).attr("href");
                if (typeof href != "undefined")
                    if (relativeLinksArray.indexOf(href) == -1)
                        relativeLinksArray.push(self.urlBase + "/" + href.replace(/^\/+|\/+$/g, ""));
            });
            //Collect Absolute Links
            absoluteLinks.each(function () {
                let href = $(this).attr("href");
                if (typeof href != "undefined") {
                    if (self.options.strict && self.domain != extract_domain_1.default(href))
                        return true;
                    if (absoluteLinksArray.indexOf(href) == -1)
                        absoluteLinksArray.push(href);
                }
            });
            return Array.from(new Set(absoluteLinksArray.concat(relativeLinksArray)));
        };
        this.level1Crawl = (url = "") => {
            let self = this;
            return new Promise((resolve) => {
                let subject = self.url;
                if (url != "")
                    subject = url;
                if (this.urlCache.includes(subject)) {
                    resolve([]);
                }
                else {
                    self.getContent(subject).then((content) => {
                        if (!this.urlCache.includes(subject))
                            this.urlCache.push(subject);
                        let crawledLinks = self.collectLinks(content);
                        if (!crawledLinks.includes(this.url))
                            crawledLinks.push(this.url);
                        self.events.emit("level1Crawl.success", crawledLinks);
                        resolve(crawledLinks);
                    });
                }
            });
        };
        this.level2Crawl = (url = "") => {
            let self = this;
            return new Promise((resolve, reject) => {
                let subject = self.url;
                if (url != "")
                    subject = url;
                self.level1Crawl(subject).then((crawledLinks) => {
                    let oldcrawledLinks = crawledLinks;
                    let childCrawledLinks = [];
                    crawledLinks.forEach((v, i) => {
                        self.level1Crawl(v).then((ccl) => {
                            childCrawledLinks.push(ccl);
                            if (crawledLinks.length == childCrawledLinks.length) {
                                let crawledLinks = [];
                                childCrawledLinks.forEach((v, i) => {
                                    crawledLinks = crawledLinks.concat(v);
                                });
                                self.events.emit("level2Crawl.success", Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                                resolve(Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                            }
                        }).catch(error => {
                            self.events.emit("level2Crawl.error", error);
                            reject(error);
                        });
                    });
                }).catch(error => {
                    self.events.emit("level2Crawl.error", error);
                    reject(error);
                });
            });
        };
        this.level3Crawl = (url = "") => {
            let self = this;
            return new Promise((resolve, reject) => {
                let subject = self.url;
                if (url != "")
                    subject = url;
                self.level2Crawl(subject).then((crawledLinks) => {
                    let oldcrawledLinks = crawledLinks;
                    let childCrawledLinks = [];
                    crawledLinks.forEach((v, i) => {
                        self.level1Crawl(v).then((ccl) => {
                            childCrawledLinks.push(ccl);
                            if (crawledLinks.length == childCrawledLinks.length) {
                                let crawledLinks = [];
                                childCrawledLinks.forEach((v, i) => {
                                    crawledLinks = crawledLinks.concat(v);
                                });
                                self.events.emit("level3Crawl.success", Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                                resolve(Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                            }
                        }).catch(error => {
                            self.events.emit("level3Crawl.error", error);
                            reject(error);
                        });
                    });
                }).catch(error => {
                    self.events.emit("level3Crawl.error", error);
                    reject(error);
                });
            });
        };
        this.level4Crawl = (url = "") => {
            let self = this;
            return new Promise((resolve, reject) => {
                let subject = self.url;
                if (url != "")
                    subject = url;
                self.level3Crawl(subject).then((crawledLinks) => {
                    let oldcrawledLinks = crawledLinks;
                    let childCrawledLinks = [];
                    crawledLinks.forEach((v, i) => {
                        self.level1Crawl(v).then((ccl) => {
                            childCrawledLinks.push(ccl);
                            if (crawledLinks.length == childCrawledLinks.length) {
                                let crawledLinks = [];
                                childCrawledLinks.forEach((v, i) => {
                                    crawledLinks = crawledLinks.concat(v);
                                });
                                self.events.emit("level4Crawl.success", Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                                resolve(Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                            }
                        }).catch(error => {
                            self.events.emit("level4Crawl.error", error);
                            reject(error);
                        });
                    });
                }).catch(error => {
                    self.events.emit("level4Crawl.error", error);
                    reject(error);
                });
            });
        };
        this.level5Crawl = (url = "") => {
            let self = this;
            return new Promise((resolve, reject) => {
                let subject = self.url;
                if (url != "")
                    subject = url;
                self.level4Crawl(subject).then((crawledLinks) => {
                    let oldcrawledLinks = crawledLinks;
                    let childCrawledLinks = [];
                    crawledLinks.forEach((v, i) => {
                        self.level1Crawl(v).then((ccl) => {
                            childCrawledLinks.push(ccl);
                            if (crawledLinks.length == childCrawledLinks.length) {
                                let crawledLinks = [];
                                childCrawledLinks.forEach((v, i) => {
                                    crawledLinks = crawledLinks.concat(v);
                                });
                                self.events.emit("level5Crawl.success", Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                                resolve(Array.from(new Set(crawledLinks.concat(oldcrawledLinks))));
                            }
                        }).catch(error => {
                            self.events.emit("level5Crawl.error", error);
                            reject(error);
                        });
                    });
                }).catch(error => {
                    self.events.emit("level5Crawl.error", error);
                    reject(error);
                });
            });
        };
        this.crawl = (url = "") => {
            let self = this;
            return new Promise((resolve, reject) => {
                let result = self["level" + self.options.depth + "Crawl"](url);
                result.then(resolve).catch(reject).finally(() => {
                    if (this.options.cache && this.cacheChanged)
                        this.storage.addItems(this.contentCache, this.cacheName);
                });
            });
        };
        this.on = (event, handler) => {
            let self = this;
            this.events.on(event, handler);
            return self;
        };
        //Assignment
        this.events = new events_1.default.EventEmitter();
        this.$ = cheerio_1.default;
        return this;
    }
}
exports.epicLinkCrawler = epicLinkCrawler;
//# sourceMappingURL=epicLinkCrawler.js.map