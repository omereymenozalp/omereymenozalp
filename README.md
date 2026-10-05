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

1. **GitHub Pages'i aç:** depoda **Settings → Pages → Build and deployment → Source: Deploy from a branch** seç, dal olarak oyunun bulunduğu dalı (şu an **claude/mobile-super-mario-game-bl1d4w**), klasör olarak **/ (root)** seçip kaydet. Birkaç dakika sonra oyun `https://omereymenozalp.github.io/omereymenozalp/` adresinde yayında olur.
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
7. **★ Mercan Denizi (gizli bölüm):** kale bitirilince açılır, başlık ekranında yıldızlı 7. kart olarak görünür. Bütünüyle su altında geçer: **A** her basışta yukarı bir kulaç attırır, bırakınca yavaşça batarsın; suda koşmak yoktur. Ateş topları suda dümdüz gider. Yakınına gelince şişen balon balıkları, üstündeyken sana doğru yükselen denizanaları ve sıra hâlinde yüzen balıklar var; suda düşmanların üstüne basılmaz, dokunmak can yakar (ateş topu ve yıldız işe yarar). Mercanlar, sallanan yosunlar, ışık huzmeleri ve kabarcıklar; kendine ait bir şarkı, kontrol noktası, gizli 1UP bloğu ve sıradan görünen bir borunun altında gizli bir hazine mağarası. Sondaki boru seni bayrak direğinin olduğu kumsala çıkarır; bitirince özel bir su altı jeneriği oynar.

Güçlendirmeler: büyüme mantarı, ateş çiçeği, yıldız (dokunulmazlık) ve 1UP mantarı. Her bölümde bir kontrol noktası var. Açılan bölümler ve en yüksek skor tarayıcıda saklanır.

## Oyun modları

Başlık ekranındaki **NORMAL | ZAMANA KARŞI** anahtarına dokunarak (ya da ▼ veya B ile) mod değiştirilir.

- **Normal:** klasik macera; 3 can, geri sayan süre, bölümden bölüme ilerleme.
- **Zamana Karşı:** açılmış bölümlerden biri seçilip tek başına oynanır. Göstergede geri sayım yerine salise hassasiyetinde kronometre (ör. 01:23.45) çalışır. Can kaybı ve oyun sonu yoktur: ölünce bölüm hemen baştan başlar. Bayrağa (kalede baltaya) ulaşınca sonuç ekranı çıkar; önceki rekor geçildiyse **YENİ REKOR!** yazar. Her bölümün en iyi süresi tarayıcıda saklanır ve bu modda başlık kartlarında görünür. Bu moddaki skorlar en yüksek skora sayılmaz.

## Geliştirme

Kaynak `src/` altında parçalara ayrılmıştır ve sırayla birleştirilir:

```
node tools/build.mjs        # src/* -> index.html (+ dist/super-biyik.html)
node tools/test/mech.mjs    # mekanik testleri (mantar, boru, bayrak, boss…)
node tools/test/bot.mjs     # otomatik oynayan bot, bölümleri baştan sona dener (LV=2 tek bölüm, CP=1 kontrol noktasından)
node tools/test/pause.mjs   # duraklatma menüsü + AYARLAR (tuş boyutu/saydamlığı, piksel ölçeği), dokunarak
node tools/test/fireball.mjs # ateş topu 2-8 kare uzaktaki yer düşmanlarını vuruyor mu
node tools/test/sea.mjs     # gizli deniz bölümü: yüzme fiziği, deniz canlıları, kilit, baştan sona yüzen bot
node tools/test/timeattack.mjs  # zamana karşı: mod anahtarı, kronometre, anında yeniden başlama, rekor kaydı
OUT=/tmp node tools/test/shot.mjs  # ekran görüntüleri
```

`index.html` her zaman build çıktısıdır; doğrudan düzenleme, `src/` içindeki parçayı düzenle.
