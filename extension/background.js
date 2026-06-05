// Find User Posts in Subreddit - Background Service Worker

const USER_AGENT = 'extension:find-user-posts-in-subreddit:v1.0';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_USER') {
    const { username, subreddit } = message.payload;

    if (!username || !subreddit) {
      sendResponse({ error: 'Missing username or subreddit parameter.' });
      return true;
    }

    scanUserPosts(username, subreddit)
      .then((posts) => sendResponse({ posts }))
      .catch((err) => {
        const status = err.status || 0;
        if (status === 429) {
          sendResponse({ error: 'Rate limit hit. Please wait and try again.' });
        } else if (status === 403) {
          sendResponse({ error: 'Access forbidden. Subreddit may be private or quarantined.' });
        } else if (status === 404) {
          sendResponse({ error: 'Subreddit not found.' });
        } else {
          sendResponse({ error: `Error ${status}: ${err.message || 'Unknown error'}` });
        }
      });

    return true;
  }
});

async function scanUserPosts(username, subreddit) {
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=author:${encodeURIComponent(username)}&restrict_sr=1&sort=new&limit=100&raw_json=1&include_over_18=on`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();

  if (!data || !data.data || !data.data.children) {
    return [];
  }

  const posts = data.data.children
    .filter((child) => child.kind === 't3')
      .map((child) => {
      const post = child.data;
      // Extract thumbnail/image URL
      let thumbnail = null;
      if (post.preview && post.preview.images && post.preview.images.length > 0) {
        const preview = post.preview.images[0];
        if (preview.source && preview.source.url) {
          thumbnail = preview.source.url.replace(/&/g, '&');
        }
      } else if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail.startsWith('http')) {
        thumbnail = post.thumbnail;
      }
      return {
        id: post.id,
        title: post.title,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score,
        utc: post.created_utc,
        subreddit: post.subreddit,
        author: post.author,
        num_comments: post.num_comments,
        thumbnail: thumbnail
      };
    });

  return posts;
}