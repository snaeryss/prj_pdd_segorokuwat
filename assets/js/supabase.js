/**
 * Supabase Client — Segorokuwat
 * 
 * Initializes Supabase client and provides helper functions
 * for database operations.
 * 
 * IMPORTANT: Replace SUPABASE_URL and SUPABASE_ANON_KEY with
 * your actual Supabase project credentials.
 */

// ── Configuration ──
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// ── Initialize Client ──
let supabase;

function initSupabase() {
  if (!window.supabase) {
    console.error('Supabase JS library not loaded. Make sure to include the CDN script.');
    return null;
  }
  if (!supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// ── Auth Helpers ──

async function signIn(email, password) {
  const client = initSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const client = initSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const client = initSupabase();
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  return session;
}

async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

// ── Years ──

async function getYears() {
  const client = initSupabase();
  const { data, error } = await client
    .from('years')
    .select('*')
    .order('year', { ascending: false });
  if (error) throw error;
  return data;
}

async function getYearById(id) {
  const client = initSupabase();
  const { data, error } = await client
    .from('years')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function createYear(year) {
  const client = initSupabase();
  const { data, error } = await client
    .from('years')
    .insert({ year })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateYear(id, year) {
  const client = initSupabase();
  const { data, error } = await client
    .from('years')
    .update({ year })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteYear(id) {
  const client = initSupabase();
  const { error } = await client
    .from('years')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Activities ──

async function getActivities(yearId = null) {
  const client = initSupabase();
  let query = client
    .from('activities')
    .select(`
      *,
      year:years(id, year),
      cover_photo:photos!activities_cover_photo_id_fkey(id, image_url, title)
    `)
    .order('created_at', { ascending: false });
  
  if (yearId) {
    query = query.eq('year_id', yearId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getActivityBySlug(slug) {
  const client = initSupabase();
  const { data, error } = await client
    .from('activities')
    .select(`
      *,
      year:years(id, year),
      cover_photo:photos!activities_cover_photo_id_fkey(id, image_url, title),
      subcategories(id, name, slug)
    `)
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

async function getActivityById(id) {
  const client = initSupabase();
  const { data, error } = await client
    .from('activities')
    .select(`
      *,
      year:years(id, year),
      cover_photo:photos!activities_cover_photo_id_fkey(id, image_url, title),
      subcategories(id, name, slug)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function createActivity({ name, slug, year_id, description, cover_photo_id }) {
  const client = initSupabase();
  const { data, error } = await client
    .from('activities')
    .insert({ name, slug, year_id, description, cover_photo_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateActivity(id, updates) {
  const client = initSupabase();
  const { data, error } = await client
    .from('activities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteActivity(id) {
  const client = initSupabase();
  const { error } = await client
    .from('activities')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Subcategories ──

async function getSubcategories(activityId) {
  const client = initSupabase();
  const { data, error } = await client
    .from('subcategories')
    .select('*')
    .eq('activity_id', activityId)
    .order('name');
  if (error) throw error;
  return data;
}

async function createSubcategory({ name, slug, activity_id }) {
  const client = initSupabase();
  const { data, error } = await client
    .from('subcategories')
    .insert({ name, slug, activity_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateSubcategory(id, updates) {
  const client = initSupabase();
  const { data, error } = await client
    .from('subcategories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteSubcategory(id) {
  const client = initSupabase();
  const { error } = await client
    .from('subcategories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Photos ──

async function getPhotos({ activityId = null, subcategoryId = null, visibleOnly = true, limit = 50, offset = 0 } = {}) {
  const client = initSupabase();
  let query = client
    .from('photos')
    .select(`
      *,
      activity:activities(id, name, slug),
      subcategory:subcategories(id, name, slug)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (activityId) {
    query = query.eq('activity_id', activityId);
  }
  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  }
  if (visibleOnly) {
    query = query.eq('is_visible', true);
  }
  
  const { data, count, error } = await query;
  if (error) throw error;
  return { data, count };
}

async function getPhotoById(id) {
  const client = initSupabase();
  const { data, error } = await client
    .from('photos')
    .select(`
      *,
      activity:activities(id, name, slug, year_id),
      subcategory:subcategories(id, name, slug)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function createPhoto({ title, image_url, activity_id, subcategory_id, caption, is_featured, is_visible }) {
  const client = initSupabase();
  const { data, error } = await client
    .from('photos')
    .insert({
      title,
      image_url,
      activity_id,
      subcategory_id: subcategory_id || null,
      caption: caption || null,
      is_featured: is_featured || false,
      is_visible: is_visible !== undefined ? is_visible : true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updatePhoto(id, updates) {
  const client = initSupabase();
  const { data, error } = await client
    .from('photos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletePhoto(id) {
  const client = initSupabase();
  const { error } = await client
    .from('photos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function getFeaturedPhotos(limit = 6) {
  const client = initSupabase();
  const { data, error } = await client
    .from('photos')
    .select(`
      *,
      activity:activities(id, name, slug, year_id, year:years(year))
    `)
    .eq('is_featured', true)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ── Statistics (for admin dashboard) ──

async function getStats() {
  const client = initSupabase();
  
  const [yearsRes, activitiesRes, photosRes] = await Promise.all([
    client.from('years').select('*', { count: 'exact', head: true }),
    client.from('activities').select('*', { count: 'exact', head: true }),
    client.from('photos').select('*', { count: 'exact', head: true }),
  ]);
  
  return {
    totalYears: yearsRes.count || 0,
    totalActivities: activitiesRes.count || 0,
    totalPhotos: photosRes.count || 0,
  };
}

async function getRecentActivities(limit = 5) {
  const client = initSupabase();
  const { data, error } = await client
    .from('activities')
    .select(`
      *,
      year:years(year),
      photos(count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ── Utility ──

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── Export for use in other modules ──
// Since we're using plain JS without a bundler, we expose functions globally
window.DB = {
  init: initSupabase,
  // Auth
  signIn,
  signOut,
  getSession,
  getUser,
  // Years
  getYears,
  getYearById,
  createYear,
  updateYear,
  deleteYear,
  // Activities
  getActivities,
  getActivityBySlug,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  // Subcategories
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  // Photos
  getPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  deletePhoto,
  getFeaturedPhotos,
  // Stats
  getStats,
  getRecentActivities,
  // Utility
  generateSlug,
};
