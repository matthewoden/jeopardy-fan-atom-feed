const mustache = require('mustache')
const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require("luxon");

const recaps = 'https://thejeopardyfan.com/category/recaps'

const getHTML = async (url) => {
  const resp = await axios.get(url)
  return resp.data
}

const getRecapsPage = async () => {
  return getHTML(recaps)
}

const escape = (unsafe)=> {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/’/g, "'")
    .replace(/–/g,"-")
    .replace(/—/g,' -- ')
    .replace(/…/g, '...')
  .replace(/[^\x20-\x7E]/g, '');
 }

const scrapeList = (html) => {
  const $ = cheerio.load(html)
  const articles = []
  $('article').filter((_index, el) => {
    return el.attribs.class.includes('category-season')
  }).each(function() {
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
          escape(article.find('.content-grid-title').text()).replace("Today's Final Jeopardy - ", '')
        , 'DDDD'
        ).toISO()
    })
  })
  return articles
}

const scrapeQuestion = (articles = []) => {
  return Promise.all(articles.map(async (article) => {
    const html = await getHTML(article.url)
    const $ = cheerio.load(html)
    let question = $('.entry-content h2').first().text()
    return {
      ...article,
      summary: `${escape(question)}.`
    }
  }))
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
  const articles = scrapeList(page)
  console.log(articles)
  const articlesWithQuestion = await scrapeQuestion(articles)
  return toXML(articlesWithQuestion)
}

module.exports = render
