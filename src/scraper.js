const mustache = require('mustache')
const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require("luxon");

const getRecapsPage = async () => {
  const resp = await axios.get('https://thejeopardyfan.com/category/recaps')
  return resp.data
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
      title: article.find('h3').text().replace(/’/g, "'").replace(/–/g,"-"),
      summary: (
        article.find('.content-lead-excerpt p').text() || 
        article.find('.content-list-excerpt p').text()
       ).replace(/’/g, "'").replace(/–/g,"-"),
      updated: DateTime.fromFormat(
        article.find('.entry-meta-date').text()
       , "MMMM d, yyyy"
       ).toISO(),
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
      href: "http://the-jeopardy-fan.s3-us-east-2.amazonaws.com/feed.atom",
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
    <link href="{{url}}" rel="self"/>
    <content type="xhtml">
      <div xmlns="http://www.w3.org/1999/xhtml">
        <img src="https://thejeopardyfan.com/wp-content/uploads/2016/09/GameRecap-400x226.png" width="400" height="226" />
        <p>{{summary}}</p>
      </div>
    </content>
    <updated>{{updated}}</updated>
    <media:content url="https://thejeopardyfan.com/wp-content/uploads/2016/09/GameRecap-400x226.png" medium="image" width="400" height="226"/>
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