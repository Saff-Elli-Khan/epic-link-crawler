declare type options = {
    depth?: Number;
    strict?: Boolean;
};
export declare class epicLinkCrawler {
    private urlObject;
    private url;
    private domain;
    private urlBase;
    private options;
    private events;
    constructor(url: string, { depth, strict }?: options);
    validUrl(url: string): Promise<unknown>;
    config: ({ depth, strict }?: options) => this;
    getContent: (url: string) => Promise<unknown>;
    collectLinks: (content: any) => string[];
    protected level1Crawl: (url?: string, depth?: number) => Promise<unknown>;
    protected level2Crawl: (url?: string) => Promise<unknown>;
    protected level3Crawl: (url?: string) => Promise<unknown>;
    protected level4Crawl: (url?: string) => Promise<unknown>;
    protected level5Crawl: (url?: string) => Promise<unknown>;
    crawl: (url?: string) => any;
    on: (event: string, handler: any) => this;
}
export {};
//# sourceMappingURL=epicLinkCrawler.d.ts.map