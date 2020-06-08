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
// @ts-ignore | Because Not Type Declaration Available!
const extract_domain_1 = __importDefault(require("extract-domain"));
//The Class
class epicLinkCrawler {
    //Constructor
    constructor(url, { depth = 1, strict = true } = {}) {
        this.url = "";
        this.domain = "";
        this.urlBase = "";
        this.storage = new epic_storage_1.epicStorage;
        this.options = {
            depth: 1,
            strict: true,
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
        this.config = ({ depth = 1, strict = true } = {}) => {
            let self = this;
            self.options.depth = depth;
            self.options.strict = strict;
            return self;
        };
        this.getContent = (url) => {
            return new Promise((resolve, reject) => {
                if (this.storage.hasItem(url))
                    resolve(this.storage.getItem(url));
                else
                    request_1.default(url, (error, response, content) => {
                        this.storage.addSchema("epicLinkCrawler").addItem(url, content);
                        resolve(content);
                    });
            });
        };
        this.clearCache = () => {
            this.storage.destroy();
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
        this.level1Crawl = (url = "", depth = 1) => {
            let self = this;
            return new Promise((resolve, reject) => {
                let subject = self.url;
                if (url != "")
                    subject = url;
                self.getContent(subject).then((content) => {
                    let crawledLinks = self.collectLinks(content);
                    crawledLinks.push(this.url);
                    self.events.emit("level1Crawl.success", crawledLinks);
                    //Log
                    console.log(url);
                    resolve(crawledLinks);
                });
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
            let result = self["level" + self.options.depth + "Crawl"](url);
            return result;
        };
        this.on = (event, handler) => {
            let self = this;
            this.events.on(event, handler);
            return self;
        };
        this.validUrl(url).catch(error => {
            throw new Error(error);
        });
        //Resolve Required Modules
        require.resolve("events");
        require.resolve("request");
        require.resolve("cheerio");
        require.resolve("url-parse");
        //Assignment
        this.events = new events_1.default.EventEmitter();
        this.$ = cheerio_1.default;
        this.url = url.replace(/^\/+|\/+$/g, "");
        this.urlObject = new url_parse_1.default(this.url);
        this.domain = extract_domain_1.default(this.url);
        this.options.depth = depth;
        this.options.strict = strict;
        if (this.urlObject.origin == "null")
            throw new Error("Invalid URL Has Been Provided!");
        this.urlBase = this.urlObject.protocol + "//" + this.urlObject.hostname;
        return this;
    }
}
exports.epicLinkCrawler = epicLinkCrawler;
//# sourceMappingURL=epicLinkCrawler.js.map