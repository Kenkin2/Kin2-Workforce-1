// Kin2 Workforce Service Worker - Advanced PWA with Offline Capabilities
const CACHE_NAME = 'kin2-workforce-v1.2.0';
const OFFLINE_URL = '/offline.html';
const STATIC_CACHE = 'kin2-static-v1';
const API_CACHE = 'kin2-api-v1';
const IMAGE_CACHE = 'kin2-images-v1';

// Resources to cache for offline functionality
const STATIC_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-144x144.png'
];

// API endpoints to cache for offline access
const API_ENDPOINTS = [
  '/api/user',
  '/api/organizations',
  '/api/jobs',
  '/api/timesheets',
  '/api/learning/courses',
  '/api/analytics/dashboard'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_RESOURCES);
        console.log('Service Worker: Static resources cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Install failed', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name !== STATIC_CACHE && 
        name !== API_CACHE && 
        name !== IMAGE_CACHE
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      
      // Take control of all pages
      await clients.claim();
      console.log('Service Worker: Activated');
    })()
  );
});

// Fetch event - implement advanced caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// API requests - Network first, cache fallback with background sync
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from API cache', request.url);
      return cachedResponse;
    }
    
    // Return offline response for critical API calls
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This feature is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Image requests - Cache first, network fallback
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    return new Response('', { status: 404 });
  }
}

// Static requests - Cache first, network fallback
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Enhanced background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'timesheet-sync') {
    event.waitUntil(syncTimesheets());
  } else if (event.tag === 'course-progress-sync') {
    event.waitUntil(syncCourseProgress());
  } else if (event.tag === 'activity-sync') {
    event.waitUntil(syncActivities());
  } else if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

// Advanced push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: 'You have new updates in Kin2 Workforce',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { url: '/' },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    tag: 'kin2-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
    vibrate: [200, 100, 200]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.title = data.title || 'Kin2 Workforce';
      options.data = { ...options.data, ...data };
      options.icon = data.icon || options.icon;
      
      // Custom notification types
      if (data.type === 'shift-reminder') {
        options.body = `Shift starting in ${data.timeUntil}`;
        options.actions = [
          { action: 'clock-in', title: 'Clock In', icon: '/icons/clock-in.png' },
          { action: 'view-schedule', title: 'View Schedule', icon: '/icons/schedule.png' }
        ];
      } else if (data.type === 'course-available') {
        options.body = `New course available: ${data.courseName}`;
        options.actions = [
          { action: 'start-course', title: 'Start Course', icon: '/icons/learning.png' },
          { action: 'dismiss', title: 'Later', icon: '/icons/dismiss.png' }
        ];
      } else if (data.type === 'timesheet-approval') {
        options.body = `Timesheet for ${data.period} needs approval`;
        options.actions = [
          { action: 'approve-timesheet', title: 'Review', icon: '/icons/approve.png' },
          { action: 'dismiss', title: 'Later', icon: '/icons/dismiss.png' }
        ];
      }
    } catch (error) {
      console.error('Service Worker: Error parsing push data', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Kin2 Workforce', options)
  );
});

// Advanced notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let url = '/';
  
  // Handle different notification actions
  switch (action) {
    case 'clock-in':
      url = '/timesheets?action=clockin';
      break;
    case 'view-schedule':
      url = '/schedule';
      break;
    case 'start-course':
      url = data.courseId ? `/learning/courses/${data.courseId}` : '/learning';
      break;
    case 'approve-timesheet':
      url = '/timesheets/pending';
      break;
    case 'open':
    default:
      url = data.url || '/';
      break;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Message handler for update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync offline timesheet data
async function syncTimesheets() {
  try {
    // Get pending timesheet data from IndexedDB
    const db = await openDB();
    const tx = db.transaction(['pendingTimesheets'], 'readonly');
    const store = tx.objectStore('pendingTimesheets');
    const pendingTimesheets = await store.getAll();
    
    // Sync each timesheet
    for (const timesheet of pendingTimesheets) {
      try {
        await fetch('/api/timesheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timesheet.data)
        });
        
        // Remove from pending after successful sync
        await store.delete(timesheet.id);
      } catch (error) {
        console.error('Failed to sync timesheet:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync course progress
async function syncCourseProgress() {
  try {
    const db = await openDB();
    const tx = db.transaction(['pendingProgress'], 'readonly');
    const store = tx.objectStore('pendingProgress');
    const pendingProgress = await store.getAll();
    
    for (const progress of pendingProgress) {
      try {
        await fetch(`/api/learning/courses/${progress.courseId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress.data)
        });
        
        await store.delete(progress.id);
      } catch (error) {
        console.error('Failed to sync course progress:', error);
      }
    }
  } catch (error) {
    console.error('Course progress sync failed:', error);
  }
}

// Sync activity data
async function syncActivities() {
  try {
    const db = await openDB();
    const tx = db.transaction(['pendingActivities'], 'readonly');
    const store = tx.objectStore('pendingActivities');
    const pendingActivities = await store.getAll();
    
    for (const activity of pendingActivities) {
      try {
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity.data)
        });
        
        await store.delete(activity.id);
      } catch (error) {
        console.error('Failed to sync activity:', error);
      }
    }
  } catch (error) {
    console.error('Activity sync failed:', error);
  }
}

// Function to sync data when back online
async function syncData() {
  try {
    await Promise.all([
      syncTimesheets(),
      syncCourseProgress(),
      syncActivities()
    ]);
    console.log('Service Worker: All data synced successfully');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kin2-workforce-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pendingTimesheets')) {
        const timesheetStore = db.createObjectStore('pendingTimesheets', { keyPath: 'id', autoIncrement: true });
        timesheetStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('pendingProgress')) {
        const progressStore = db.createObjectStore('pendingProgress', { keyPath: 'id', autoIncrement: true });
        progressStore.createIndex('courseId', 'courseId', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('pendingActivities')) {
        const activityStore = db.createObjectStore('pendingActivities', { keyPath: 'id', autoIncrement: true });
        activityStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        const dataStore = db.createObjectStore('offlineData', { keyPath: 'key' });
      }
    };
  });
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'data-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

async function performPeriodicSync() {
  try {
    // Sync critical data in background
    await Promise.all([
      syncTimesheets(),
      syncCourseProgress(),
      syncActivities()
    ]);
    
    console.log('Service Worker: Periodic sync completed');
  } catch (error) {
    console.error('Service Worker: Periodic sync failed', error);
  }
}

// Share target handling
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShare(event.request));
  }
});

async function handleShare(request) {
  const formData = await request.formData();
  const title = formData.get('title');
  const text = formData.get('text');
  const url = formData.get('url');
  const files = formData.getAll('files');
  
  // Process shared content
  const shareData = {
    title,
    text,
    url,
    files: files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    }))
  };
  
  // Store shared data for processing
  const db = await openDB();
  const tx = db.transaction(['offlineData'], 'readwrite');
  const store = tx.objectStore('offlineData');
  await store.put({
    key: 'shared-content',
    data: shareData,
    timestamp: Date.now()
  });
  
  // Redirect to share processing page
  return Response.redirect('/share-received', 302);
}