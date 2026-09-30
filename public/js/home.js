requireLogin();

const postForm = document.getElementById("postForm");
const postsBox = document.getElementById("posts");
const storiesTrack = document.getElementById("storiesTrack");
const createPanel = document.getElementById("createPanel");
const toggleCreate = document.getElementById("toggleCreate");
const searchPlaceholder = document.getElementById("searchPlaceholder");
const notifBtn = document.getElementById("notifBtn");
const currentUser = getCurrentUser();

function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function avatarUrl(user) {
  if (user?.profilePicture) return user.profilePicture;
  const name = encodeURIComponent(user?.username || "U");
  return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&size=128`;
}

async function loadStories() {
  const meRes = await fetch("/api/auth/me", { headers: { ...authHeaders() } });
  const me = await meRes.json();

  const usersRes = await fetch("/api/auth/users", { headers: { ...authHeaders() } });
  const others = await usersRes.json();

  const items = [
    { user: me, label: "Your story", isYours: true },
    ...others.slice(0, 12).map((u) => ({ user: u, label: u.username, isYours: false }))
  ];

  storiesTrack.innerHTML = items
    .map(
      (item) => `
    <div class="insta-story">
      <div class="insta-story__ring ${item.isYours ? "insta-story__ring--yours" : ""}">
        <img src="${avatarUrl(item.user)}" alt="" class="insta-story__img" width="56" height="56" />
        ${item.isYours ? '<span class="insta-story__plus">+</span>' : ""}
      </div>
      <span class="insta-story__name">${escapeHtml(item.label.length > 12 ? item.label.slice(0, 11) + "…" : item.label)}</span>
    </div>
  `
    )
    .join("");
}

function likedByLine(post) {
  const n = post.likes?.length || 0;
  const d = post.dislikes?.length || 0;
  let line = "";

  if (n === 0) line = "Be the first to like this";
  else line = `${n} ${n === 1 ? "like" : "likes"}`;

  if (d > 0) line += ` · ${d} ${d === 1 ? "dislike" : "dislikes"}`;
  return line;
}

function renderPost(post) {
  const uid = post._id;
  const uname = post.user?.username || "user";
  const hasVideo = post.isReel && post.videoUrl;
  const isOwner = post.user?._id === currentUser?._id;

  let mediaHtml = "";
  if (hasVideo) {
    const poster = post.imageUrl ? ` poster="${escapeHtml(post.imageUrl)}"` : "";
    mediaHtml = `<video class="insta-post__photo" src="${escapeHtml(post.videoUrl)}"${poster} controls playsinline loop></video>`;
  } else if (post.imageUrl) {
    mediaHtml = `<img class="insta-post__photo" src="${escapeHtml(post.imageUrl)}" alt="" />`;
  } else if (post.content) {
    mediaHtml = `<div class="insta-post__textonly">${escapeHtml(post.content)}</div>`;
  }

  const captionBlock =
    post.content && (post.imageUrl || hasVideo)
      ? `<p class="insta-caption"><strong>${escapeHtml(uname)}</strong> ${escapeHtml(post.content)}</p>`
      : "";

  const deleteButton = isOwner
    ? `
      <button type="button" class="insta-action insta-action--delete" data-delete="${uid}" aria-label="Delete" data-testid="delete-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    `
    : "";

  return `
    <article class="insta-post" id="post-${uid}" data-post-id="${uid}">
      <header class="insta-post__head">
        <img class="insta-post__avatar" src="${avatarUrl(post.user)}" alt="" width="32" height="32" />
        <span class="insta-post__user">${escapeHtml(uname)}</span>
        <span class="insta-post__more" aria-hidden="true">⋯</span>
      </header>

      <div class="insta-post__media">
        ${mediaHtml}
      </div>

      <div class="insta-post__toolbar">
        <div class="insta-post__toolbar-left">
          <button type="button" class="insta-action" data-like="${uid}" aria-label="Like" data-testid="like-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <button type="button" class="insta-action" data-focus-comment="${uid}" aria-label="Comment" data-testid="comment-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          <button type="button" class="insta-action" data-share="${uid}" aria-label="Share" data-testid="share-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>

          <button type="button" class="insta-action insta-action--dislike" data-dislike="${uid}" aria-label="Dislike" data-testid="dislike-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
            </svg>
          </button>
        </div>

        <div class="insta-post__toolbar-left">
          ${deleteButton}
          <button type="button" class="insta-action insta-action--save" data-save="${uid}" aria-label="Save" data-testid="save-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <p class="insta-likes">${likedByLine(post)}</p>
      ${captionBlock}
      <div class="insta-comments" id="comments-${uid}"></div>

      <form class="insta-add-comment" data-comment-form="${uid}">
        <input name="text" type="text" placeholder="Add a comment..." autocomplete="off" />
        <button type="submit" class="insta-post-btn">Post</button>
      </form>
    </article>
  `;
}

async function loadPosts() {
  const response = await fetch("/api/posts");
  const posts = await response.json();
  const feedPosts = Array.isArray(posts) ? posts : [];

  postsBox.innerHTML = feedPosts.map(renderPost).join("");

  feedPosts.forEach((post) => loadComments(post._id));

  document.querySelectorAll("[data-like]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetch(`/api/posts/${button.dataset.like}/like`, {
        method: "POST",
        headers: { ...authHeaders() }
      });
      loadPosts();
    });
  });

  document.querySelectorAll("[data-dislike]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetch(`/api/posts/${button.dataset.dislike}/dislike`, {
        method: "POST",
        headers: { ...authHeaders() }
      });
      loadPosts();
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Do you want to delete this post?");
      if (!confirmed) return;

      const response = await fetch(`/api/posts/${button.dataset.delete}`, {
        method: "DELETE",
        headers: { ...authHeaders() }
      });

      if (!response.ok) {
        alert("Could not delete post.");
        return;
      }

      loadPosts();
    });
  });

  document.querySelectorAll("[data-focus-comment]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.focusComment;
      const input = document.querySelector(`[data-comment-form="${id}"] input[name="text"]`);
      if (input) input.focus();
    });
  });

  document.querySelectorAll("[data-share]").forEach((button) => {
    button.addEventListener("click", async () => {
      const url = `${window.location.origin}/home#post-${button.dataset.share}`;
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      } catch {
        prompt("Copy link:", url);
      }
    });
  });

  document.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("insta-action--saved");
    });
  });

  document.querySelectorAll("[data-comment-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const postId = form.dataset.commentForm;
      const text = form.elements.text.value;

      await fetch(`/api/comments/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text })
      });

      form.reset();
      loadComments(postId);
    });
  });
}

async function loadComments(postId) {
  const response = await fetch(`/api/comments/${postId}`);
  const comments = await response.json();
  const commentsBox = document.getElementById(`comments-${postId}`);
  if (!commentsBox) return;

  commentsBox.innerHTML = comments
    .map(
      (c) =>
        `<p class="insta-comment-line"><strong>${escapeHtml(c.user?.username || "User")}</strong> ${escapeHtml(c.text)}</p>`
    )
    .join("");
}

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = document.getElementById("content").value;
  const imageUrl = document.getElementById("imageUrl").value;

  await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, imageUrl })
  });

  postForm.reset();
  createPanel.hidden = true;
  loadPosts();
});

if (toggleCreate) {
  toggleCreate.addEventListener("click", () => {
    createPanel.hidden = !createPanel.hidden;
    if (!createPanel.hidden) document.getElementById("content")?.focus();
  });
}

if (searchPlaceholder) {
  searchPlaceholder.addEventListener("click", () => {
    alert("Search is not implemented in this demo.");
  });
}

if (notifBtn) {
  notifBtn.addEventListener("click", (e) => {
    e.preventDefault();
    alert("No new notifications.");
  });
}

loadStories();
loadPosts();
