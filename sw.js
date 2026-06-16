// sw.js — Service Worker de Itineritas v2
var CACHE_NAME = 'itineritas-v2';

var ARCHIVOS_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=IM+Fell+English:ital@0;1&family=Inter:wght@300;400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// INSTALAR: guardar archivos en caché
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        ARCHIVOS_CACHE.map(function(url) {
          return cache.add(url).catch(function() {});
        })
      );
    })
  );
  self.skipWaiting();
});

// ACTIVAR: borrar cachés viejos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(nombres) {
      return Promise.all(
        nombres
          .filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// FETCH: red primero, caché como respaldo
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // APIs dinámicas: nunca cachear
  if (url.indexOf('supabase.co') > -1 ||
      url.indexOf('frankfurter.app') > -1 ||
      url.indexOf('open.er-api') > -1 ||
      url.indexOf('generativelanguage') > -1 ||
      url.indexOf('mymemory') > -1 ||
      url.indexOf('flightaware') > -1 ||
      url.indexOf('flightradar24') > -1) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(respuesta) {
        if (event.request.method === 'GET') {
          var copia = respuesta.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copia);
          });
        }
        return respuesta;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});

// NOTIFICACIONES desde segundo plano (via showNotification del SW)
// La app llama a reg.showNotification() que pasa por aquí
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

// Mensaje desde la app para limpiar el caché de datos locales
// (se llama después de sincronizar exitosamente con Supabase)
self.addEventListener('message', function(event) {
  if (event.data && event.data.tipo === 'limpiar-cache-datos') {
    // Borramos solo la entrada del caché dinámica que corresponda
    caches.open(CACHE_NAME).then(function(cache) {
      cache.keys().then(function(keys) {
        keys.forEach(function(req) {
          // Conservar archivos estáticos de la app; borrar solo llamadas dinámicas
          if (req.url.indexOf('supabase.co') > -1) {
            cache.delete(req);
          }
        });
      });
    });
  }
});
