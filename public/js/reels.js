requireLogin();

const reelsFeed = document.getElementById("reelsFeed");
const reelForm = document.getElementById("reelForm");
const reelVideoUrl = document.getElementById("reelVideoUrl");
const reelCaption = document.getElementById("reelCaption");
const currentUser = getCurrentUser();

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function playVisibleReel() {
  if (!reelsFeed) return;

  const videos = reelsFeed.querySelectorAll("video");

  videos.forEach((video) => {
    const rect = video.getBoundingClientRect();
    const mostlyVisible =
      rect.top < window.innerHeight * 0.55 &&
      rect.bottom > window.innerHeight * 0.45;

    if (mostlyVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

async function loadReels() {
  if (!reelsFeed) return;

  try {
    const response = await fetch("/api/posts/reels");
    const reels = await response.json();

    if (!response.ok) {
      reelsFeed.innerHTML = `
        <section class="reel-card reel-card--empty">
          <div class="reel-overlay-meta">
            <h2>Could not load reels</h2>
            <p>${escapeHtml(reels.message || "Please try again.")}</p>
          </div>
        </section>
      `;
      return;
    }

    const validReels = Array.isArray(reels)
      ? reels.filter((reel) => reel.videoUrl)
      : [];

    if (validReels.length === 0) {
      reelsFeed.innerHTML = `
        <section class="reel-card reel-card--empty">
          <div class="reel-overlay-meta">
            <h2>No reels yet</h2>
            <p>Post a video URL above and it will appear here in the reel feed.</p>
          </div>
        </section>
      `;
      return;
    }

    reelsFeed.innerHTML = validReels
      .map((reel) => {
        const isOwner = reel.user?._id === currentUser?._id;

        return `
          <article class="reel-card">
            <video
              class="reel-video"
              src="${escapeHtml(reel.videoUrl)}"
              poster="${escapeHtml(reel.user?.profilePicture || "")}"
              muted
              loop
              playsinline
              controls
            ></video>

            <div class="reel-overlay">
              <div class="reel-overlay-meta">
                <div class="reel-user">
                  <span class="reel-user__avatar">
                    ${escapeHtml((reel.user?.username || "U").charAt(0).toUpperCase())}
                  </span>
                  <div>
                    <strong>${escapeHtml(reel.user?.username || "Unknown user")}</strong>
                    <p>${escapeHtml(reel.content || "New reel")}</p>
                  </div>
                </div>

                <span class="reel-date">${formatRelativeDate(reel.createdAt)}</span>

                ${
                  isOwner
                    ? `<button type="button" class="secondary reel-delete-btn" data-delete-reel="${reel._id}">Delete Reel</button>`
                    : ""
                }
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll("[data-delete-reel]").forEach((button) => {
      button.addEventListener("click", async () => {
        const confirmed = window.confirm("Do you want to delete this reel?");
        if (!confirmed) return;

        const response = await fetch(`/api/posts/${button.dataset.deleteReel}`, {
          method: "DELETE",
          headers: { ...authHeaders() }
        });

        if (!response.ok) {
          alert("Could not delete reel.");
          return;
        }

        loadReels();
      });
    });

    playVisibleReel();
  } catch (error) {
    console.error("Error loading reels:", error);
    reelsFeed.innerHTML = `
      <section class="reel-card reel-card--empty">
        <div class="reel-overlay-meta">
          <h2>Connection problem</h2>
          <p>Unable to load reels right now.</p>
        </div>
      </section>
    `;
  }
}

if (reelForm) {
  reelForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const videoUrl = reelVideoUrl.value.trim();
    const content = reelCaption.value.trim();

    if (!videoUrl) return;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          content,
          videoUrl,
          isReel: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Could not upload reel");
        return;
      }

      reelForm.reset();
      loadReels();
    } catch (error) {
      console.error("Error uploading reel:", error);
      alert("Could not upload reel");
    }
  });
}

document.addEventListener("scroll", playVisibleReel, { passive: true });
window.addEventListener("resize", playVisibleReel);

if (reelsFeed) {
  reelsFeed.addEventListener("scroll", playVisibleReel, { passive: true });
}

loadReels();
