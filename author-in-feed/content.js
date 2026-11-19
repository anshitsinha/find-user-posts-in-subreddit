console.log("✅ Reddit Extension Loaded!");

// Function to add author links next to the timestamp
function addAuthorNames() {
    console.log("🔍 Searching for posts...");

    document.querySelectorAll("shreddit-post-overflow-menu").forEach(menu => {
        const authorName = menu.getAttribute("author-name");
        if (authorName) {
            console.log(`📝 Found author: ${authorName}`);

            // Find the correct post container
            const postContainer = menu.closest("[data-testid='post-container']") || menu.closest("shreddit-post");

            if (postContainer) {
                const separatorSpan = postContainer.querySelector(".created-separator");
                const timestamp = separatorSpan?.nextElementSibling; // Get the timestamp element

                if (timestamp) {
                    // Check if the author link is already added
                    if (!timestamp.nextElementSibling || !timestamp.nextElementSibling.classList.contains("author-link")) {
                        const authorLink = document.createElement("a");
                        authorLink.className = "author-link";
                        authorLink.style.marginLeft = "8px";
                        authorLink.style.fontWeight = "bold";
                        authorLink.style.color = "#8ba2ad";
                        
                        authorLink.href = `https://www.reddit.com/user/${authorName}`;
                        authorLink.textContent = ` (u/${authorName})`;
                        authorLink.target = "_blank";
                        authorLink.rel = "noopener noreferrer";

                        timestamp.insertAdjacentElement("afterend", authorLink);

                        console.log(`✅ Author link for "${authorName}" added after timestamp.`);
                    } else {
                        console.log(`⚠️ Author link already added for this post, skipping.`);
                    }
                } else {
                    console.warn("⚠️ Timestamp not found for a post.");
                }
            } else {
                console.warn(`⚠️ Post container not found for a menu near author: ${authorName}`);
            }
        } else {
            console.warn("⚠️ No author name found on a menu.");
        }
    });
}

// Run initially after posts have loaded
setTimeout(addAuthorNames, 6000);

// Use a MutationObserver to watch for new posts dynamically
const observer = new MutationObserver(() => {
    console.log("🔄 New posts detected, updating author names...");
    addAuthorNames();
});

// Observe the main feed container
const feedContainer = document.querySelector("shreddit-feed");
if (feedContainer) {
    observer.observe(feedContainer, { childList: true, subtree: true });
    console.log("👀 Observer attached to the feed container.");
} else {
    console.warn("❌ Feed container not found, observer not attached.");
}
