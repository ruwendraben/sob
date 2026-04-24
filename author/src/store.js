const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const postsFile = path.join(dataDir, "posts.json");

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(postsFile);
  } catch {
    await fs.writeFile(postsFile, "[]", "utf8");
  }
}

async function readPosts() {
  await ensureStorage();
  const raw = await fs.readFile(postsFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writePosts(posts) {
  await fs.writeFile(postsFile, JSON.stringify(posts, null, 2), "utf8");
}

async function listPostsNewestFirst() {
  const posts = await readPosts();
  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function deletePost(id) {
  const posts = await readPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Post not found.");
  const [removed] = posts.splice(idx, 1);
  await writePosts(posts);
  return removed;
}

async function removeImageFromPost(id, imageIndex) {
  const posts = await readPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) throw new Error("Post not found.");
  const images = post.images || [];
  if (images.length <= 1) throw new Error("Cannot remove the only image. Delete the post instead.");
  if (imageIndex < 0 || imageIndex >= images.length) throw new Error("Image index out of range.");
  const [removed] = images.splice(imageIndex, 1);
  post.images = images;
  post.imageUrl = images[0].url;
  post.imageKey = images[0].key;
  await writePosts(posts);
  return removed;
}

// ── Sellers ──────────────────────────────────────────────────────────────────

const sellersFile = path.join(dataDir, "sellers.json");

async function ensureSellers() {
  try { await fs.access(sellersFile); }
  catch { await fs.writeFile(sellersFile, "[]", "utf8"); }
}

async function readSellers() {
  await ensureSellers();
  const raw = await fs.readFile(sellersFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeSellers(sellers) {
  await fs.writeFile(sellersFile, JSON.stringify(sellers, null, 2), "utf8");
}

async function listAllSellerApplications() {
  const sellers = await readSellers();
  return sellers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function updateSellerStatus(id, status) {
  const sellers = await readSellers();
  const seller = sellers.find((s) => s.id === id);
  if (!seller) throw new Error("Seller not found.");
  seller.status = status;
  await writeSellers(sellers);
  return seller;
}

module.exports = {
  listPostsNewestFirst,
  deletePost,
  removeImageFromPost,
  listAllSellerApplications,
  updateSellerStatus
};
