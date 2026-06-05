// find-user-posts-in-subreddit - Content Script

(function () {
  'use strict';

  const SCANNED_USERNAMES = new Set();
  let currentModal = null;

  // ─── Utils ───────────────────────────────────────────────

  function getSubredditFromPath() {
    const match = window.location.pathname.match(/\/r\/([^/]+)/i);
    return match ? match[1] : null;
  }

  function extractUsername(anchor) {
    const href = anchor.getAttribute('href') || '';
    const match = href.match(/\/(?:user|u)\/([^/?]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  function createScanButton(username) {
    const btn = document.createElement('button');
    btn.className = 'fup-scan-btn';
    btn.textContent = 'Scan';
    btn.title = `Find posts by u/${username} in this subreddit`;
    btn.dataset.username = username;
    btn.addEventListener('click', onScanClick);
    return btn;
  }

  // ─── Scan Button Injection ───────────────────────────────

  function injectScanButtons(root) {
    const subreddit = getSubredditFromPath();
    if (!subreddit) return;

    const anchors = root.querySelectorAll('a[href*="/user/"], a[href*="/u/"]');

    for (const anchor of anchors) {
      const username = extractUsername(anchor);
      if (!username) continue;

      // Skip if we already injected a button for this username
      if (SCANNED_USERNAMES.has(username)) continue;

      // Skip if button already exists in this container
      if (anchor.parentNode.querySelector('.fup-scan-btn')) continue;

      const btn = createScanButton(username);

      // Make parent a flex container so button sits inline after username
      const parent = anchor.parentNode;
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.flexWrap = 'wrap';
      parent.style.gap = '4px';

      // Insert button right after the anchor
      let ref = anchor.nextSibling;
      while (ref && ref.nodeType === Node.TEXT_NODE && ref.textContent.trim() === '') {
        ref = ref.nextSibling;
      }
      parent.insertBefore(btn, ref || null);

      SCANNED_USERNAMES.add(username);
    }
  }

  // ─── Scan Click Handler ──────────────────────────────────

  function onScanClick(event) {
    const btn = event.currentTarget;
    const username = btn.dataset.username;
    const subreddit = getSubredditFromPath();

    if (!subreddit) {
      showModal(username, null, { error: 'Not on a subreddit page.' });
      return;
    }

    removeModal();
    showModal(username, null, { loading: true });

    btn.textContent = '...';
    btn.disabled = true;

    chrome.runtime.sendMessage(
      { type: 'SCAN_USER', payload: { username, subreddit } },
      (response) => {
        btn.textContent = 'Scan';
        btn.disabled = false;

        if (chrome.runtime.lastError) {
          removeModal();
          showModal(username, null, { error: `Connection error: ${chrome.runtime.lastError.message}` });
          return;
        }

        removeModal();
        showModal(username, response);
      }
    );
  }

  // ─── Modal ───────────────────────────────────────────────

  function removeModal() {
    if (currentModal && currentModal.parentNode) {
      currentModal.parentNode.removeChild(currentModal);
      currentModal = null;
    }
  }

  function showModal(username, response, opts) {
    removeModal();

    const overlay = document.createElement('div');
    overlay.className = 'fup-overlay';

    const modal = document.createElement('div');
    modal.className = 'fup-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'fup-header';

    const title = document.createElement('span');
    title.className = 'fup-title';
    if (opts && opts.loading) {
      title.textContent = `Scanning u/${username}...`;
    } else {
      const sub = response && response.posts && response.posts.length > 0
        ? response.posts[0].subreddit || getSubredditFromPath() || '?'
        : getSubredditFromPath() || '?';
      title.textContent = `u/${username} in r/${sub}`;
    }
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fup-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', removeModal);
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'fup-body';

    if (opts && opts.loading) {
      const p = document.createElement('p');
      p.className = 'fup-status';
      p.textContent = 'Fetching posts...';
      body.appendChild(p);
    } else if (opts && opts.error) {
      const p = document.createElement('p');
      p.className = 'fup-status fup-error';
      p.textContent = opts.error;
      body.appendChild(p);
    } else if (!response || !response.posts || response.posts.length === 0) {
      const p = document.createElement('p');
      p.className = 'fup-status';
      p.textContent = 'No posts found from this user in this subreddit.';
      body.appendChild(p);
    } else {
      const posts = response.posts;
      const count = posts.length;

      // Summary
      const summary = document.createElement('div');
      summary.className = 'fup-summary';
      const oldest = formatUTC(posts[posts.length - 1].utc);
      const newest = formatUTC(posts[0].utc);
      summary.textContent = `${count} ${count === 1 ? 'post' : 'posts'} found · ${oldest} – ${newest}`;
      body.appendChild(summary);

      // Table
      const table = document.createElement('div');
      table.className = 'fup-table';

      for (const post of posts) {
        const row = document.createElement('div');
        row.className = 'fup-row';

        // Thumbnail cell
        const thumbCell = document.createElement('span');
        thumbCell.className = 'fup-cell fup-thumb';
        if (post.thumbnail) {
          const img = document.createElement('img');
          img.className = 'fup-thumb-img';
          img.src = post.thumbnail;
          img.alt = '';
          img.loading = 'lazy';
          thumbCell.appendChild(img);
        }

        const timeCell = document.createElement('span');
        timeCell.className = 'fup-cell fup-time';
        timeCell.textContent = formatUTC(post.utc);

        const scoreCell = document.createElement('span');
        scoreCell.className = 'fup-cell fup-score';
        scoreCell.textContent = post.score;

        const titleCell = document.createElement('span');
        titleCell.className = 'fup-cell fup-title';
        const link = document.createElement('a');
        link.href = post.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = post.title;
        titleCell.appendChild(link);

        row.appendChild(thumbCell);
        row.appendChild(timeCell);
        row.appendChild(scoreCell);
        row.appendChild(titleCell);
        table.appendChild(row);
      }

      body.appendChild(table);
    }

    modal.appendChild(body);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    currentModal = overlay;

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) removeModal();
    });

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        removeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // ─── Copy Report ─────────────────────────────────────────

  function copyReport(username, response) {
    let markdown;
    if (!response || !response.posts || response.posts.length === 0) {
      markdown = `## u/${username}\n\nNo posts found in this subreddit.`;
    } else {
      const subreddit = response.posts[0].subreddit || '?';
      const lines = [];
      lines.push(`## u/${username} in r/${subreddit}`);
      lines.push(`**Scanned:** ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`);
      lines.push(`**Posts found:** ${response.posts.length}`);
      lines.push('');
      lines.push('| UTC | Votes | Title | Link |');
      lines.push('|---|---|---|---|');

      for (const post of response.posts) {
        const time = formatUTC(post.utc);
        lines.push(`| ${time} | ${post.score} | ${escapeMarkdown(post.title)} | ${post.url} |`);
      }

      lines.push('');
      lines.push('---');
      lines.push('*Generated by find-user-posts-in-subreddit*');

      markdown = lines.join('\n');
    }

    navigator.clipboard.writeText(markdown).catch(() => {});
  }

  function escapeMarkdown(text) {
    return text.replace(/\|/g, '\\|').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  }

  // ─── Formatting ──────────────────────────────────────────

  function formatUTC(utcSeconds) {
    const d = new Date(utcSeconds * 1000);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }

  // ─── MutationObserver ────────────────────────────────────

  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      injectScanButtons(document.body);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  injectScanButtons(document.body);

})();