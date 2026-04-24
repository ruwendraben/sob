const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

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

async function createPost({ caption, images, sellerSubdomain }) {
  const posts = await readPosts();
  const post = {
    id: crypto.randomUUID(),
    caption: caption || "",
    images,
    imageUrl: images[0].url,
    imageKey: images[0].key,
    likes: 0,
    sellerSubdomain: sellerSubdomain || null,
    createdAt: new Date().toISOString()
  };

  posts.push(post);
  await writePosts(posts);
  return post;
}

async function listPostsNewestFirst() {
  const posts = await readPosts();
  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function likePost(id) {
  const posts = await readPosts();
  const target = posts.find((post) => post.id === id);

  if (!target) {
    throw new Error("Post not found.");
  }

  target.likes += 1;
  await writePosts(posts);
  return target;
}

// ── Users ────────────────────────────────────────────────────────────────────

const usersFile = path.join(dataDir, "users.json");

async function ensureUsers() {
  try { await fs.access(usersFile); }
  catch { await fs.writeFile(usersFile, "[]", "utf8"); }
}

async function readUsers() {
  await ensureUsers();
  const raw = await fs.readFile(usersFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}

async function createUser({ email, passwordHash }) {
  const users = await readUsers();
  if (users.find((u) => u.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find((u) => u.email === email) || null;
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

async function createSellerApplication({ userId, email, subdomain, shopName, brandName, address, tel, brandLogoUrl, brandLogoKey }) {
  const sellers = await readSellers();
  if (sellers.find((s) => s.subdomain === subdomain)) {
    throw new Error("This subdomain is already taken.");
  }
  if (sellers.find((s) => s.userId === userId)) {
    throw new Error("You already have a seller application.");
  }
  const seller = {
    id: crypto.randomUUID(),
    userId,
    email,
    subdomain,
    shopName,
    brandName,
    address,
    tel,
    brandLogoUrl: brandLogoUrl || null,
    brandLogoKey: brandLogoKey || null,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  sellers.push(seller);
  await writeSellers(sellers);
  return seller;
}

async function findSellerByUserId(userId) {
  const sellers = await readSellers();
  return sellers.find((s) => s.userId === userId) || null;
}

async function findSellerBySubdomain(subdomain) {
  const sellers = await readSellers();
  return sellers.find((s) => s.subdomain === subdomain) || null;
}

async function updateSellerProfile(userId, updates) {
  const sellers = await readSellers();
  const seller = sellers.find((s) => s.userId === userId);
  if (!seller) throw new Error("Seller not found.");
  const allowed = ["shopName", "brandName", "address", "tel", "motto", "employeeCount", "employeeOfYear", "brandLogoUrl", "brandLogoKey"];
  for (const key of allowed) {
    if (key in updates) seller[key] = updates[key];
  }
  await writeSellers(sellers);
  return seller;
}

module.exports = {
  ensureStorage,
  createPost,
  listPostsNewestFirst,
  likePost,
  createUser,
  findUserByEmail,
  createSellerApplication,
  findSellerByUserId,
  findSellerBySubdomain,
  updateSellerProfile
};
