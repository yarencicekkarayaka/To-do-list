const gorevGirisi = document.getElementById("gorev-girisi");
const eklemeButonu = document.getElementById("ekleme-butonu");
const tumunuSilButonu = document.getElementById("tumunu-sil-butonu");
const kutuyuBosaltButonu = document.getElementById("kutuyu-bosalt-butonu");
const gorevListesi = document.getElementById("gorev-listesi");
const hafizaListesi = document.getElementById("hafiza-listesi");
const onerilenlerKutusu = document.getElementById("onerilenler-kutusu");

document.addEventListener("DOMContentLoaded", verileriYukle);
eklemeButonu.addEventListener("click", gorevEkle);
tumunuSilButonu.addEventListener("click", tumGorevleriCopeAt);
kutuyuBosaltButonu.addEventListener("click", copKutusunuBosalt);

gorevGirisi.addEventListener("keypress", function (etkinlik) {
  if (etkinlik.key === "Enter") {
    gorevEkle();
  }
});

gorevGirisi.addEventListener("input", function() {
  const arananMetin = gorevGirisi.value.trim().toLowerCase();
  onerilenlerKutusu.innerHTML = "";
  
  if (arananMetin === "") {
    onerilenlerKutusu.style.display = "none";
    return;
  }

  const aktifGorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  const silinenGorevler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  const tumGorevler = [...new Set([...aktifGorevler.map(g => g.metin), ...silinenGorevler.map(g => g.metin)])];

  const eslesenler = tumGorevler.filter(gorev => gorev.toLowerCase().includes(arananMetin));

  if (eslesenler.length > 0) {
    onerilenlerKutusu.style.display = "block";

    eslesenler.forEach(gorev => {
      const oneriDiv = document.createElement("div");
      oneriDiv.classList.add("oneri-elemani");

      // 1. Regex düzeltildi + özel karakterler escape edildi
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapeRegex(arananMetin)})`, "gi");
      
      // 2. XSS koruması: textContent kullan, sadece strong kısmını innerHTML yap
      const tempDiv = document.createElement("div");
      const parts = gorev.split(regex);
      parts.forEach(part => {
        if (part.toLowerCase() === arananMetin) {
          const strong = document.createElement("strong");
          strong.textContent = part;
          tempDiv.appendChild(strong);
        } else {
          tempDiv.appendChild(document.createTextNode(part));
        }
      });
      oneriDiv.appendChild(tempDiv);

      oneriDiv.addEventListener("click", function() {
        gorevGirisi.value = gorev;
        onerilenlerKutusu.style.display = "none";
        gorevGirisi.focus();
      });

      onerilenlerKutusu.appendChild(oneriDiv);
    });
  } else {
    onerilenlerKutusu.style.display = "none";
  }
});

document.addEventListener("click", function(e) {
  if (e.target !== gorevGirisi && !onerilenlerKutusu.contains(e.target)) {
    onerilenlerKutusu.style.display = "none";
  }
});

function gorevEkle() {
  const gorevMetni = gorevGirisi.value.trim();
  if (gorevMetni === "") {
    alert("Lütfen bir görev yazın!");
    return;
  }
  const yeniId = Date.now().toString(); // 3. Her göreve unique ID
  listeyeGorevEkleArayuz({ id: yeniId, metin: gorevMetni, tamamlandi: false });
  goreviKaydet({ id: yeniId, metin: gorevMetni, tamamlandi: false });
  gorevGirisi.value = "";
  onerilenlerKutusu.style.display = "none";
  gorevGirisi.focus();
}

function listeyeGorevEkleArayuz(gorevObj) {
  const li = document.createElement("li");
  li.dataset.id = gorevObj.id; // ID'yi DOM'a yaz
  
  const metinAlani = document.createElement("span");
  metinAlani.textContent = gorevObj.metin; // 4. XSS koruması için textContent
  if (gorevObj.tamamlandi) {
    metinAlani.classList.add("tamamlandi");
  }
  li.appendChild(metinAlani);

  metinAlani.addEventListener("click", function () {
    metinAlani.classList.toggle("tamamlandi");
    durumGuncelle(gorevObj.id, metinAlani.classList.contains("tamamlandi"));
  });

  metinAlani.addEventListener("dblclick", function () {
    const eskiMetin = metinAlani.textContent;
    const yeniMetin = prompt("Görevi düzenleyin:", eskiMetin);
    if (yeniMetin !== null && yeniMetin.trim() !== "") {
      const temizYeniMetin = yeniMetin.trim();
      gorevGuncelle(gorevObj.id, temizYeniMetin);
      metinAlani.textContent = temizYeniMetin;
    }
  });

  const silButonu = document.createElement("button");
  silButonu.classList.add("silme-butonu");
  silButonu.textContent = "Sil";
  silButonu.addEventListener("click", function () {
    li.remove();
    gorevHafizayaTasi(gorevObj.id);
  });

  li.appendChild(silButonu);
  gorevListesi.appendChild(li);
}

function hafizaListesineEkleArayuz(gorevObj) {
  const li = document.createElement("li");
  li.dataset.id = gorevObj.id;
  
  const metinAlani = document.createElement("span");
  metinAlani.textContent = gorevObj.metin;
  if (gorevObj.tamamlandi) {
    metinAlani.classList.add("tamamlandi");
  }
  li.appendChild(metinAlani);

  const butonGrubu = document.createElement("div");
  butonGrubu.classList.add("buton-grubu");

  const geriAlButonu = document.createElement("button");
  geriAlButonu.classList.add("geri-al-butonu");
  geriAlButonu.textContent = "Geri Al";
  geriAlButonu.addEventListener("click", function () {
    li.remove();
    hafizadanGeriYukle(gorevObj.id);
  });

  const kesinSilButonu = document.createElement("button");
  kesinSilButonu.classList.add("silme-butonu");
  kesinSilButonu.textContent = "Sil";
  kesinSilButonu.addEventListener("click", function () {
    li.remove();
    hafizadanTamamenSil(gorevObj.id);
  });

  butonGrubu.appendChild(geriAlButonu);
  butonGrubu.appendChild(kesinSilButonu);
  li.appendChild(butonGrubu);

  if (hafizaListesi) {
    hafizaListesi.appendChild(li);
  }
}

function goreviKaydet(gorevObj) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler.push(gorevObj);
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
}

function verileriYukle() {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler.forEach(gorev => listeyeGorevEkleArayuz(gorev));

  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  silinenler.forEach(gorev => hafizaListesineEkleArayuz(gorev));
}

function tumGorevleriCopeAt() {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  
  if (gorevler.length === 0) {
    alert("Zaten çöp kutusuna atılacak aktif bir görev yok!");
    return;
  }

  const onay = confirm("Aktif listedeki TÜM görevleri çöp kutusuna taşımak istiyor musunuz?");
  
  if (onay) {
    let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
    silinenler.push(...gorevler);
    
    gorevler.forEach(gorev => hafizaListesineEkleArayuz(gorev));

    localStorage.setItem("silinenler", JSON.stringify(silinenler));
    localStorage.removeItem("gorevler");
    gorevListesi.innerHTML = "";
  }
}

function copKutusunuBosalt() {
  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  if (silinenler.length === 0) {
    alert("Çöp kutusu zaten boş!");
    return;
  }

  const onay = confirm("Çöp kutusundaki TÜM görevleri geri alınamayacak şekilde tamamen silmek istediğinize emin misiniz?");
  if (onay) {
    hafizaListesi.innerHTML = "";
    localStorage.removeItem("silinenler");
  }
}

function gorevHafizayaTasi(id) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  const tasinacakGorev = gorevler.find(g => g.id === id);
  if (!tasinacakGorev) return;
  
  gorevler = gorevler.filter(g => g.id !== id);
  localStorage.setItem("gorevler", JSON.stringify(gorevler));

  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  silinenler.push(tasinacakGorev);
  localStorage.setItem("silinenler", JSON.stringify(silinenler));

  hafizaListesineEkleArayuz(tasinacakGorev);
}

function hafizadanGeriYukle(id) {
  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  const geriYuklenecek = silinenler.find(g => g.id === id);
  if (!geriYuklenecek) return;
  
  silinenler = silinenler.filter(g => g.id !== id);
  localStorage.setItem("silinenler", JSON.stringify(silinenler));

  goreviKaydet(geriYuklenecek);
  listeyeGorevEkleArayuz(geriYuklenecek);
}

function hafizadanTamamenSil(id) {
  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  silinenler = silinenler.filter(g => g.id !== id);
  localStorage.setItem("silinenler", JSON.stringify(silinenler));
}

function durumGuncelle(id, yeniDurum) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler = gorevler.map(gorev => {
    if (gorev.id === id) {
      gorev.tamamlandi = yeniDurum;
    }
    return gorev;
  });
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
}

function gorevGuncelle(id, yeniMetin) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler = gorevler.map(gorev => {
    if (gorev.id === id) {
      gorev.metin = yeniMetin;
    }
    return gorev;
  });
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
}