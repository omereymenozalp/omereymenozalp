# Süper Bıyık

Telefonda oynanmak için yazılmış, Süper Mario tarzı bir platform oyunu. Tek bir `index.html` dosyasından oluşur; dış kaynak, resim ya da ses dosyası kullanmaz.

Bütün içerik kodla üretilir:

- **Grafikler:** kahraman, düşmanlar, boss, prenses, bloklar, borular, arka plan katmanları ve kale. Hepsi piksel piksel çiziliyor.
- **Font:** Türkçe karakterleri (Ç Ğ İ Ö Ş Ü) destekleyen özel 5×7 piksel font.
- **Müzik ve sesler:** Web Audio API ile gerçek zamanlı sentezlenen 8-bit tarzı besteler ve efektler.

## Nasıl oynanır

`index.html` dosyasını telefonun tarayıcısında aç. GitHub Pages açıksa doğrudan sayfa adresinden de oynanabilir.

| Kontrol | Dokunmatik | Klavye |
|---|---|---|
| Hareket | ◀ ▶ | ← → / A D |
| Eğil / boruya gir | ▼ | ↓ / S |
| Zıpla (basılı tutunca daha yükseğe) | A | Z / Boşluk / ↑ |
| Koş / ateş et | B | X / Shift |
| Duraklat | ❚❚ | P / Esc |
| Ses | 🔈 | M |

Telefonu yan çevirince görüş alanı genişler. Dik tutunca kontroller ekranın altına konsol gibi yerleşir.

## Telefona uygulama olarak yükle

Oyun bir PWA'dır: GitHub Pages üzerinden açılınca ana ekrana eklenebilir, tam ekran açılır ve ilk açılıştan sonra internetsiz de oynanır.

1. **GitHub Pages'i aç:** depoda **Settings → Pages → Build and deployment → Source: Deploy from a branch** seç, dal olarak **main**, klasör olarak **/ (root)** seçip kaydet. Birkaç dakika sonra oyun `https://<kullanıcı-adı>.github.io/<depo-adı>/` adresinde yayında olur.
2. **iPhone / iPad (Safari):** adresi Safari'de aç → alttaki **Paylaş** düğmesi (kare ve yukarı ok) → **Ana Ekrana Ekle** → **Ekle**.
3. **Android (Chrome):** adresi Chrome'da aç → sağ üstteki **⋮** menüsü → **Uygulamayı yükle** (ya da **Ana ekrana ekle**) → **Yükle**.

Ana ekrandaki **Süper Bıyık** simgesine dokununca oyun tarayıcı çubukları olmadan açılır. Yeni bir sürüm yayınlandığında internete bağlıyken oyunu bir kez açmak yeterli; güncelleme kendiliğinden gelir.

Simgeler oyunun kendi piksel çizimlerinden üretilir: `node tools/build.mjs && node tools/make-icons.mjs` (çıktılar `icons/` ve `favicon.png`).

## Bölümler

1. **1-1 Yeşil Vadi:** gizli bonus odasına inen bir boru, gizli 1UP bloğu ve bayrak direği.
2. **1-2 Kristal Mağara:** yamyam çiçekli borular, dikenli kirpiler, tuğla labirent ve hareketli platform.
3. **1-3 Bulut Tepeleri:** ağaç tepeleri, düşen platformlar, arılar ve bir yay.
4. **1-4 Buz Geçidi:** kaygan buz zemin, oyuncu altından geçince düşen buz sarkıtları, karnının üstünde kayan penguenler ve gizli 1UP bloğu.
5. **1-5 Kum Çölü:** batan kum çukurları ve üstüne basınca batan kum platformları, zıplayan akrepler, yuvarlanan çalı topları ve içinden hazine odalı bir tünel geçen piramit.
6. **1-6 Ejder Kalesi:** lav, ateş çubukları, zıplayan lav topları ve köprüde Ejder Kral.

Güçlendirmeler: büyüme mantarı, ateş çiçeği, yıldız (dokunulmazlık) ve 1UP mantarı. Her bölümde bir kontrol noktası var. Açılan bölümler ve en yüksek skor tarayıcıda saklanır.

## Geliştirme

Kaynak `src/` altında parçalara ayrılmıştır ve sırayla birleştirilir:

```
node tools/build.mjs        # src/* -> index.html (+ dist/super-biyik.html)
node tools/test/mech.mjs    # mekanik testleri (mantar, boru, bayrak, boss…)
node tools/test/bot.mjs     # otomatik oynayan bot, bölümleri baştan sona dener (LV=2 tek bölüm, CP=1 kontrol noktasından)
OUT=/tmp node tools/test/shot.mjs  # ekran görüntüleri
```

`index.html` her zaman build çıktısıdır; doğrudan düzenleme, `src/` içindeki parçayı düzenle.
