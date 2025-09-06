// Nama cache dan daftar file yang akan di-cache (app shell)
const CACHE_NAME = 'personal-dashboard-cache-v1';
const URLS_TO_CACHE = [
    '/', // Ini akan merujuk ke index.html
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'
    // Aset lain seperti ikon atau gambar statis bisa ditambahkan di sini
];

// Event 'install': Langkah ini menyimpan app shell ke dalam cache
self.addEventListener('install', event => {
    // Menunggu hingga proses caching selesai sebelum melanjutkan
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache berhasil dibuka');
                // Menambahkan semua URL yang ditentukan ke dalam cache
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Event 'fetch': Mengintersep permintaan jaringan dan menyajikan aset dari cache jika tersedia
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Jika response (halaman/aset) ditemukan di cache, langsung kembalikan dari cache
                if (response) {
                    return response;
                }

                // Jika tidak ada di cache, lanjutkan untuk mengambil dari jaringan
                return fetch(event.request).then(
                    networkResponse => {
                        // Periksa apakah response yang didapat dari jaringan valid
                        // Beberapa permintaan (misalnya ke API Chrome extension) tidak bisa di-cache
                        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                            return networkResponse;
                        }

                        // Penting: Buat klon dari response.
                        // Response adalah stream dan hanya bisa dibaca sekali.
                        // Kita butuh satu untuk dikirim ke browser, satu lagi untuk disimpan di cache.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Simpan response baru ke dalam cache untuk permintaan berikutnya
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    // Ini akan dieksekusi jika fetch gagal (misalnya, tidak ada koneksi internet)
                    console.error('Fetch gagal; mungkin Anda sedang offline:', error);
                    // Di sini Anda bisa mengembalikan halaman offline fallback jika punya
                });
            })
    );
});

// Event 'activate': Membersihkan cache versi lama untuk menjaga kebersihan
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // Hanya cache dengan nama ini yang akan disimpan
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Jika ada cache lama (namanya tidak ada di whitelist), hapus
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
