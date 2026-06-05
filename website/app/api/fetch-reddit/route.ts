import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Return HTML that fetches the Reddit URL and posts message back to parent
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reddit Fetcher</title>
</head>
<body>
  <script>
    (async function() {
      const targetUrl = "${decodeURIComponent(new URLSearchParams(window.location.search).get('url') || '')}";
      
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const text = await response.text();
        
        // Check if we got HTML (block page) instead of JSON
        if (text.trim().startsWith('<')) {
          throw new Error('Reddit returned block page');
        }

        const data = JSON.parse(text);
        
        if (!data?.data?.children) {
          throw new Error('No children in response');
        }

        const posts = data.data.children
          .filter((child: any) => child.kind === 't3')
          .map((child: any) => {
            const p = child.data;
            return {
              id: p.id,
              title: p.title,
              url: 'https://www.reddit.com' + p.permalink,
              score: p.score,
              utc: p.created_utc,
              subreddit: p.subreddit,
              author: p.author,
              num_comments: p.num_comments,
            };
          });

        // Post message back to parent
        window.opener?.postMessage({ type: 'reddit-data', posts }, '*');
      } catch (err) {
        window.opener?.postMessage({ type: 'reddit-error', error: err.message }, '*');
      }
      
      // Close the popup
      window.close();
    })();
  </script>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store',
    },
  })
}