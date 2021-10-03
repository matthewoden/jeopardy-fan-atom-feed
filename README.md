# thejeopardyfan.com/car Atom Feed Generator

For whatever reason, thejeopardyfan.com doesn't offer an RSS feed for game recaps, so I made one.

It's just an AWS Lambda function that scrapes the archive page once an hour, builds an Atom feed from the results, and shoves it in s3. The feed is the only public file in the bucket.

## Feed Url

If you want to subscribe to the feed, it's here: https://the-jeopardy-fan.s3.us-east-2.amazonaws.com/feed.atom
