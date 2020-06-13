/// <reference types="node" />
/// <reference types="cheerio" />
import events from 'events';
import URL from "url-parse";
import { epicStorage, ITEMS } from "epic-storage";
export declare type options = {
    depth?: number;
    strict?: boolean;
    cache?: boolean;
};
export declare class epicLinkCrawler {
    url: string;
    urlObject: URL | null;
    domain: string;
    urlBase: string;
    events: events.EventEmitter;
    $: CheerioAPI;
    storage: epicStorage;
    cacheName: string;
    protected urlCache: string[];
    protected cacheChanged: boolean;
    protected contentCache: ITEMS;
    protected options: options;
    protected urlBlackList: (string | RegExp)[];
    constructor();
    init: (url: string, { depth, strict, cache }?: options) => Promise<unknown>;
    blackList: (fingerPrintList: (string | RegExp)[]) => this;
    validUrl: (url: string) => Promise<unknown>;
    config: ({ depth, strict, cache }?: options) => this;
    getContent: (url: string) => Promise<unknown>;
    clearCache: () => this;
    filterLinks: (links: string[]) => string[];
    collectLinks: (content: any) => string[];
    protected level1Crawl: (url?: string) => Promise<unknown>;
    protected level2Crawl: (url?: string) => Promise<unknown>;
    protected level3Crawl: (url?: string) => Promise<unknown>;
    protected level4Crawl: (url?: string) => Promise<unknown>;
    protected level5Crawl: (url?: string) => Promise<unknown>;
    crawl: (url?: string) => Promise<unknown>;
    on: (event: string, handler: any) => this;
}
//# sourceMappingURL=epicLinkCrawler.d.ts.map