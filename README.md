<div align="center">
  <img src="assets/img/logo.png" alt="NOTMATİK Logo" width="110" />
  <h1>NOTMATİK</h1>
  <p><strong>Akademik Başarı Hesaplama Platformu</strong></p>
  <p>
    <a href="https://notmatik.haking.tr/">Canlı Site (notmatik.haking.tr)</a> •
    <a href="mailto:notmatik@haking.tr">Destek: notmatik@haking.tr</a>
  </p>
</div>

---

## Nedir?

**NOTMATİK**, 2025 yılında geliştirilen; üniversite öğrencilerinin dönem sonu ortalamalarını, ders geçme durumlarını, şartlı geçiş (DD/DC) sınırlarını ve hedeflerine ulaşmak için final sınavından almaları gereken minimum notu hızlı ve hatasız şekilde hesaplamalarını sağlayan modern bir web ve **PWA (Progressive Web App)** uygulamasıdır.

Hesaplamalar üniversitelerde yaygın olarak kullanılan **Tam Sayı Katkısı** (`Math.floor` bileşen katkısı) kuralına göre yapılmaktadır.

---

## Özellikler

- **Vize - Final Hesaplama**: Varsayılan olarak **%30 Vize / %70 Final** oranıyla açılır; dilediğiniz oranı girebilir veya tek dokunuşlu hızlı oran çiplerini kullanabilirsiniz.
- **Proje Dahil Hesaplama**: Vize, Proje ve Final ağırlıklarıyla (varsayılan `%30 / %20 / %50`) başarı puanı ve gereken final notu hesabı.
- **Akıllı Ayar Hafızası & Senkronizasyon**:
  - Değiştirdiğiniz ağırlık oranları, özel geçme notu ve şartlı geçiş ayarları tarayıcıda (`localStorage`) otomatik saklanır.
  - Ortalama hesaplamada belirlediğiniz ağırlık ve geçme notu, **Gerekli Final Notu** sekmesine anında otomatik aktarılır.
  - Standart değerlerin dışındaki geçme notları için **Özel Not** girişi desteklenir ve hatırlanır.
- **Hedef Defterim (`not-defteri.html`)**: Hesapladığınız final hedeflerini tek tıkla kaydedin, arayın, manuel ekleyin veya panodan yapıştırın.
- **Şartlı Geçiş Desteği**: Hedef notun yanında şartlı geçiş alt sınırı için gereken minimum final notunu paralel olarak hesaplar.
- **Kurulabilir Mobil & Masaüstü Uygulama (PWA)**: Telefon veya bilgisayarınıza yükleyip çevrimdışı (internetsiz) kullanabilirsiniz.
- **Karanlık & Aydınlık Tema**: Sistem temasını algılar ve tercihinizi kaydeder.

---

## Proje Yapısı

```text
Notmatik/
├── index.html                 # Ana hesaplayıcı sayfası
├── not-defteri.html           # Kayıtlı hedefler (Hedef Defterim)
├── offline.html               # Çevrimdışı PWA yedek sayfası
├── manifest.webmanifest       # PWA uygulama bildirimi
├── sw.js                      # Service Worker (çevrimdışı önbellekleme)
├── robots.txt                 # Arama motoru tarama kuralları
├── sitemap.xml                # SEO site haritası
├── _headers                   # Cloudflare Pages HTTP güvenlik ve önbellek başlıkları
├── favicon.ico                # Çok boyutlu site ikonu
├── LICENSE                    # MIT Lisansı
├── README.md                  # Proje dokümantasyonu
├── add/                       # Reklam görselleri
│   ├── SAG.png
│   └── SOL.png
└── assets/
    ├── css/
    │   ├── main.css           # Temel değişkenler, tema, header, footer, modal ve PWA stilleri
    │   ├── calculator.css     # Hesaplayıcı ve responsive yerleşim stilleri
    │   └── notebook.css       # Hedef Defterim sayfa stilleri
    ├── js/
    │   ├── common.js          # Tema, bildirimler (toast) ve PWA kurulum yönetimi
    │   ├── calculator.js      # Akıllı senkronizasyon, kalıcı ayarlar ve hesaplama motoru
    │   └── notebook.js        # Hedef Defterim CRUD ve pano işlemleri
    └── img/
        ├── logo.png           # Ana marka logosu (PNG)
        ├── og-image.png       # Sosyal medya önizleme görseli (1200x630)
        ├── icon-192.png       # PWA ikonu (192x192)
        ├── icon-512.png       # PWA ikonu (512x512)
        ├── icon-maskable-512.png
        ├── apple-touch-icon.png
        ├── favicon-16.png
        └── favicon-32.png
```

---

## Yerel Geliştirme ve Yayınlama

Statik HTML, CSS ve Vanilla JavaScript ile geliştirilmiştir; derleme (build) adımı gerektirmez.

```bash
# Herhangi bir statik sunucu ile yerelde çalıştırma örneği:
python -m http.server 8080
```

**Cloudflare Pages** ile yayınlamak için depoyu bağlayın; build komutu gerekmeden kök dizini (`/`) doğrudan yayınlayabilirsiniz. `_headers`, `sitemap.xml` ve `robots.txt` Cloudflare Pages ile tam uyumludur.

---

## İletişim ve Destek

- **Web**: [https://notmatik.haking.tr/](https://notmatik.haking.tr/)
- **E-posta**: [notmatik@haking.tr](mailto:notmatik@haking.tr)
- **Geliştirici**: `halitguns06.dev`

---

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. © 2025–2026 NOTMATİK.
