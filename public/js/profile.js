requireLogin();

const profileForm = document.getElementById("profileForm");
const usersBox = document.getElementById("users");
const avatarInput = document.getElementById("avatarInput");
const profAvatarImg = document.getElementById("profAvatarImg");
const topUsername = document.getElementById("topUsername");
const displayName = document.getElementById("displayName");
const bioText = document.getElementById("bioText");
const emailText = document.getElementById("emailText");
const statPosts = document.getElementById("statPosts");
const statFollowers = document.getElementById("statFollowers");
const statFollowing = document.getElementById("statFollowing");
const gridPosts = document.getElementById("gridPosts");
const gridReels = document.getElementById("gridReels");
const uploadPostForm = document.getElementById("uploadPostForm");
const uploadReelForm = document.getElementById("uploadReelForm");
const toggleEditBtn = document.getElementById("toggleEditBtn");
const editPanel = document.getElementById("editPanel");

function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function avatarUrl(user) {
  if (user?.profilePicture) return user.profilePicture;
  const name = encodeURIComponent(user?.username || "U");
  return `https://ui-avatars.com/api/?name=${name}&background=333&color=fff&size=128`;
}

let currentUserId = null;

async function loadProfile() {
  const response = await fetch("/api/auth/me", { headers: { ...authHeaders() } });
  const me = await response.json();
  currentUserId = me._id;

  topUsername.textContent = me.username || "profile";
  displayName.textContent = me.username || "";
  bioText.textContent = me.bio || "";
  emailText.textContent = me.email || "";
  profAvatarImg.src = avatarUrl(me);

  statFollowers.textContent = me.followers?.length ?? 0;
  statFollowing.textContent = me.following?.length ?? 0;

  document.getElementById("username").value = me.username || "";
  document.getElementById("bio").value = me.bio || "";
  document.getElementById("profilePicture").value = me.profilePicture || "";

  await loadGrids();
}

async function loadGrids() {
  if (!currentUserId) return;
  const response = await fetch(`/api/posts/user/${currentUserId}`);
  const posts = await response.json();

  const reels = posts.filter((p) => p.isReel);
  const photos = posts.filter((p) => !p.isReel);
  statPosts.textContent = posts.length;

  gridPosts.innerHTML = photos.map((p) => gridCell(p, false)).join("") || '<p class="prof-empty">No posts yet.</p>';
  gridReels.innerHTML = reels.map((p) => gridCell(p, true)).join("") || '<p class="prof-empty">No reels yet.</p>';
}

function gridCell(post, isReel) {
  const thumb =
    isReel && post.imageUrl
      ? post.imageUrl
      : post.imageUrl
        ? post.imageUrl
        : post.videoUrl
          ? ""
          : "";
  const id = post._id;
  const reelBadge = isReel
    ? `<span class="prof-grid__reel" title="Reel"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 8l5 4-5 4V8z" fill="#fff"/></svg></span>`
    : "";
  if (isReel && post.videoUrl && !thumb) {
    return `
      <a class="prof-grid__cell prof-grid__cell--video" href="/home#post-${id}">
        <video src="${escapeHtml(post.videoUrl)}" muted playsinline preload="metadata"></video>
        ${reelBadge}
      </a>`;
  }
  const imgSrc = thumb || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3C/svg%3E";
  return `
    <a class="prof-grid__cell" href="/home#post-${id}">
      <img src="${escapeHtml(imgSrc)}" alt="" loading="lazy" />
      ${reelBadge}
    </a>`;
}

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files && avatarInput.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await fetch("/api/auth/me/avatar", {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Could not upload photo");
    return;
  }
  profAvatarImg.src = data.profilePicture ? `${data.profilePicture}?t=${Date.now()}` : profAvatarImg.src;
  avatarInput.value = "";
  loadProfile();
});

uploadPostForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("postImageFile");
  const caption = document.getElementById("postCaption").value;
  const fd = new FormData();
  fd.append("content", caption);
  fd.append("isReel", "false");
  if (fileInput.files && fileInput.files[0]) {
    fd.append("image", fileInput.files[0]);
  }
  const res = await fetch("/api/posts/upload", {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Upload failed");
    return;
  }
  uploadPostForm.reset();
  loadProfile();
});

uploadReelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const video = document.getElementById("reelVideoFile").files[0];
  const thumb = document.getElementById("reelThumbFile").files[0];
  const caption = document.getElementById("reelCaption").value;
  if (!video) {
    alert("Choose a video file");
    return;
  }
  const fd = new FormData();
  fd.append("content", caption);
  fd.append("isReel", "true");
  fd.append("video", video);
  if (thumb) fd.append("image", thumb);
  const res = await fetch("/api/posts/upload", {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Upload failed");
    return;
  }
  uploadReelForm.reset();
  loadProfile();
});

document.querySelectorAll("[data-upload-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.uploadTab;
    document.querySelectorAll("[data-upload-tab]").forEach((b) => b.classList.toggle("prof-upload-tab--active", b === btn));
    uploadPostForm.hidden = tab !== "post";
    uploadReelForm.hidden = tab !== "reel";
  });
});

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle("prof-tab--active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    gridPosts.hidden = tab !== "posts";
    gridReels.hidden = tab !== "reels";
  });
});

toggleEditBtn.addEventListener("click", () => {
  editPanel.hidden = !editPanel.hidden;
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const bio = document.getElementById("bio").value;
  const profilePicture = document.getElementById("profilePicture").value;

  await fetch("/api/auth/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ username, bio, profilePicture })
  });
  loadProfile();
});

async function loadUsers() {
  const response = await fetch("/api/auth/users", { headers: { ...authHeaders() } });
  const users = await response.json();
  usersBox.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "prof-user-card";
    card.innerHTML = `
      <img class="prof-user-avatar" src="${avatarUrl(user)}" alt="" width="40" height="40" />
      <div class="prof-user-meta">
        <strong>${escapeHtml(user.username)}</strong>
        <span>${escapeHtml(user.email || "")}</span>
      </div>
      <div class="prof-user-actions">
        <button type="button" class="prof-btn prof-btn--sm" data-follow="${user._id}" data-testid="follow-btn">Follow</button>
        <button type="button" class="prof-btn prof-btn--sm prof-btn--ghost" data-unfollow="${user._id}" data-testid="unfollow-btn">Unfollow</button>
      </div>
    `;
    usersBox.appendChild(card);
  });

  document.querySelectorAll("[data-follow]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetch(`/api/auth/follow/${button.dataset.follow}`, {
        method: "POST",
        headers: { ...authHeaders() }
      });
      loadProfile();
    });
  });

  document.querySelectorAll("[data-unfollow]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetch(`/api/auth/unfollow/${button.dataset.unfollow}`, {
        method: "POST",
        headers: { ...authHeaders() }
      });
      loadProfile();
    });
  });
}

loadProfile();
loadUsers();
