# Epic Link Crawler

A simple in depth links crawler. You can easily collect all the links available on a website.

#### Installation

`$ npm i epic-link-crawler --save`

## Usage

```
const epicLinkCrawler = require("epic-link-crawler");

//Crawl all the links from google.com homepage.

new epicLinkCrawler.epicLinkCrawler("https://google.com")
    .config({
        depth: 1,
        strict: true, //Set strict false if you also want to collect links related to other websites.
    })
    .crawl() //Triggers Crawling
    .then((data: string[]) => {
        console.log(data); //Results Here.
    }).catch((error: any) => {
        console.log(error); //Error Here.
    });


/**
 * Expected Resuts In Depth 1
 *
 * [
    'https://play.google.com/?hl=en&tab=w8',
    'https://mail.google.com/mail/?tab=wm',
    'https://drive.google.com/?tab=wo',
    'https://www.google.com/calendar?tab=wc',
    'https://photos.google.com/?tab=wq&pageId=none',
    'https://docs.google.com/document/?usp=docs_alc',
    'https://accounts.google.com/ServiceLogin?hl=en&passive=true&continue=https://www.google.com/',
    'https://www.google.com/setprefs?sig=0_QLWlMq1910erDBng9UqCXn8pCmQ%3D&hl=ur&source=homepage&sa=X&ved=0ahUKEwiqg6bSwrnpAhUHrxoKHV8bCgQQ2ZgBCAU',
    'https://www.google.com/setprefs?sig=0_QLWlMq1910erDBng9UqCXn8pCmQ%3D&hl=ps&source=homepage&sa=X&ved=0ahUKEwiqg6bSwrnpAhUHrxoKHV8bCgQQ2ZgBCAY',
    'https://www.google.com/setprefs?sig=0_QLWlMq1910erDBng9UqCXn8pCmQ%3D&hl=sd&source=homepage&sa=X&ved=0ahUKEwiqg6bSwrnpAhUHrxoKHV8bCgQQ2ZgBCAc',
    'https://www.google.com/setprefdomain?prefdom=PK&prev=https://www.google.com.pk/&sig=K_BE-rlArupsHUl4I9PADVcxBLCNg%3D',
    'https://google.com/preferences?hl=en',
    'https://google.com/advanced_search?hl=en-PK&authuser=0',
    'https://google.com/intl/en/ads',
    'https://google.com/intl/en/about.html',
    'https://google.com/intl/en/policies/privacy',
    'https://google.com/intl/en/policies/terms'
    ]

 */
```

## Options

Just two options are supported for now.

- _depth_ - 1 to 5 (Default 1) | Crawling Depth.
- _strict_ - _boolean_ (Default True) | Set to False if you also want to collect links related to other websites.
