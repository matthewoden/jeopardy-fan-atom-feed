const mustache = require('mustache')
const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require("luxon");

const getRecapsPage = async () => {
  const resp = await axios.get('https://thejeopardyfan.com/category/recaps')
  return resp.data
}
const nonPrintable = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,
    14,15,16,17,19,19,"1A","1B","1C","1d","1E","1F"
  ].map(code => new RegExp(`U+000${code}`, 'g'))

const escape = (unsafe)=> {
    // return nonPrintable
    //      .reduce(
    //        (string, regex) => string.replace(regex, ''), 
    //        unsafe
    //       )
        return unsafe 
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/’/g, "'")
         .replace(/–/g,"-")
         .replace(/…/g, '...')
         .replace(/[^\x20-\x7E]/g, '');

 }

const scrape = (html) => {
  const $ = cheerio.load(html)
  const articles = []
  $('article').each(function() {
    const article = $(this)

    articles.push({
      author: 'Andy Saunders',
      image: article.find('img').first().attr('src'),
      url: article.find('a').first().attr('href'),
      title: escape(article.find('h3').text()),
      summary: escape(
        article.find('.content-lead-excerpt p').text() || 
        article.find('.content-list-excerpt p').text()
       ),
      //  updated:new Date().toISOString()
      updated: DateTime.fromFormat(
          article.find('.entry-meta-date').text()
        , "MMMM d, yyyy"
        ).toISO()
    })
  })
  return articles
}

const toXML = (entries) => {
  const view = {
    id: "http://the-jeopardy-fan.s3-us-east-2.amazonaws.com/feed.atom",
    title: "Recaps Archives - The Jeopardy! Fan",
    subtitle: "Jeopardy! recaps, the #JeopardyLivePanel podcast, statistics, and more!",
    updated: entries[0].updated,
    icon: "https://www.google.com/s2/favicons?domain=https://thejeopardyfan.com",
    generator: "Node.JS",
    entries: entries,
    links: [{
      href: "https://thejeopardyfan.com/category/recaps",
      rel:"alternate",
      type:"text/html",
    }, {
      href: "https://the-jeopardy-fan.s3.us-east-2.amazonaws.com/feed.atom",
      rel: "self",
    }]
  }
  mustache.escape = (text) => text

  const output = mustache.render(
`<?xml version="1.0" encoding="iso-8859-1"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <id>{{id}}</id>
  <title>{{title}}</title>
  <subtitle>{{subtitle}}</subtitle>
  {{#links}}
  <link href="{{href}}" rel="{{rel}}" {{#type}} type="{{type}}" {{/type}} />
  {{/links}}
  <updated>{{updated}}</updated>
  <icon>{{icon}}</icon>
  {{#entries}}
  <entry>
    <title>{{title}}</title>
    <author>
      <name>{{author}}</name>
    </author>
    <link href="{{url}}"/>
    <summary>
      {{summary}}
    </summary>
    <updated>{{updated}}</updated>
    <id>{{url}}</id>
  </entry>
  {{/entries}}
</feed>`, view);
  return output
}

const render = async () => {
  const page = await getRecapsPage()
  const scraped = scrape(page) 
  return toXML(scraped)
}

module.exports = render