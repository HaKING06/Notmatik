/* =========================================================
   NOTMATİK - Akıllı Hesaplama, Otomatik Senkronizasyon ve Kayıt Motoru
   ========================================================= */

(function () {
    'use strict';

    const PREFS_KEY = 'notmatik_prefs_v1';
    const POPUP_LAST_CLOSED_TIME_KEY = 'popup_last_closed_time';
    const POPUP_DELAY_MS = 10 * 60 * 1000;

    const DEFAULT_PREFS = {
        normalVizeWeight: 30,
        projeVizeWeight: 30,
        projeProjeWeight: 20,
        gecmeSelect: '50',
        gecmeCustom: 55,
        hedefSelect: '50',
        hedefCustom: 55,
        sartliActive: false,
        sartliSinir: 45,
        activeMainTab: 'normal',
        activeSubTabNormal: 'normal-tp',
        activeSubTabProje: 'proje-tp'
    };

    let prefs = loadPrefs();
    let pendingSaveGoalPayload = null;

    function clamp(num, min, max) {
        return Math.min(max, Math.max(min, num));
    }

    function exactRaw(score, weightPct) {
        return Number(((score * weightPct) / 100).toFixed(6));
    }

    function flooredContribution(score, weightPct) {
        return Math.floor(exactRaw(score, weightPct));
    }

    function requiredFinalScore(neededPoints, finalPct) {
        return Math.ceil(Number(((neededPoints * 100) / finalPct).toFixed(6)));
    }

    function loadPrefs() {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            const saved = raw ? JSON.parse(raw) : {};
            const merged = Object.assign({}, DEFAULT_PREFS, saved);

            if (saved.sartliActive === undefined && localStorage.getItem('sartli_active') !== null) {
                merged.sartliActive = localStorage.getItem('sartli_active') === 'true';
            }

            merged.normalVizeWeight = isNaN(Number(saved.normalVizeWeight))
                ? DEFAULT_PREFS.normalVizeWeight
                : clamp(Number(saved.normalVizeWeight), 0, 100);

            merged.projeVizeWeight = isNaN(Number(saved.projeVizeWeight))
                ? DEFAULT_PREFS.projeVizeWeight
                : clamp(Number(saved.projeVizeWeight), 0, 100);

            merged.projeProjeWeight = isNaN(Number(saved.projeProjeWeight))
                ? DEFAULT_PREFS.projeProjeWeight
                : clamp(Number(saved.projeProjeWeight), 0, 100 - merged.projeVizeWeight);

            merged.gecmeCustom = clamp(Number(merged.gecmeCustom) || 55, 1, 100);
            merged.hedefCustom = clamp(Number(merged.hedefCustom) || 55, 1, 100);
            merged.sartliSinir = clamp(Number(merged.sartliSinir) || 45, 1, 100);

            return merged;
        } catch (err) {
            return Object.assign({}, DEFAULT_PREFS);
        }
    }

    function savePrefs() {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
            localStorage.setItem('sartli_active', String(Boolean(prefs.sartliActive)));
        } catch (err) {
            // Storage kullanılamıyor
        }
    }

    function getActiveGecmeNotu() {
        if (prefs.gecmeSelect === 'custom') {
            return clamp(Number(prefs.gecmeCustom) || 50, 1, 100);
        }
        return clamp(Number(prefs.gecmeSelect) || 50, 1, 100);
    }

    function getActiveHedefNotu() {
        if (prefs.hedefSelect === 'custom') {
            return clamp(Number(prefs.hedefCustom) || 50, 1, 100);
        }
        return clamp(Number(prefs.hedefSelect) || 50, 1, 100);
    }

    function showInlineError(errorId, message) {
        const el = document.getElementById(errorId);
        if (!el) return;
        if (message) {
            el.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> <span>' + NotmatikCommon.escapeHtml(message) + '</span>';
            el.classList.add('visible');
        } else {
            el.innerHTML = '';
            el.classList.remove('visible');
        }
    }

    function hideAllResultBoxes() {
        document.querySelectorAll('.result-box').forEach(function (box) {
            box.classList.remove('show');
        });
    }

    function setVal(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = String(value);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function toggleCustomWrapper(id, visible) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('visible', visible);
    }

    /* =========================================================
       AKILLI SENKRONİZASYON VE ARAYÜZ GÜNCELLEME
       ========================================================= */

    function syncAllControlsFromPrefs() {
        const normalFinal = 100 - prefs.normalVizeWeight;
        setVal('vize-agirlik-tp', prefs.normalVizeWeight);
        setVal('final-agirlik-tp', normalFinal);
        setVal('vize-agirlik-fi', prefs.normalVizeWeight);
        setVal('final-agirlik-fi', normalFinal);

        const projeFinal = Math.max(0, 100 - (prefs.projeVizeWeight + prefs.projeProjeWeight));
        setVal('vize-agirlik-proje-tp', prefs.projeVizeWeight);
        setVal('proje-agirlik-proje-tp', prefs.projeProjeWeight);
        setVal('final-agirlik-proje-tp', projeFinal);
        setVal('vize-agirlik-proje-fi', prefs.projeVizeWeight);
        setVal('proje-agirlik-proje-fi', prefs.projeProjeWeight);
        setVal('final-agirlik-proje-fi', projeFinal);

        setVal('gecme-notu-tp', prefs.gecmeSelect);
        setVal('gecme-notu-proje-tp', prefs.gecmeSelect);
        setVal('gecme-custom-tp', prefs.gecmeCustom);
        setVal('gecme-custom-proje-tp', prefs.gecmeCustom);

        toggleCustomWrapper('gecme-custom-wrap-tp', prefs.gecmeSelect === 'custom');
        toggleCustomWrapper('gecme-custom-wrap-proje-tp', prefs.gecmeSelect === 'custom');

        setVal('hedefPuan-fi', prefs.hedefSelect);
        setVal('hedefPuan-proje-fi', prefs.hedefSelect);
        setVal('hedef-custom-fi', prefs.hedefCustom);
        setVal('hedef-custom-proje-fi', prefs.hedefCustom);

        toggleCustomWrapper('hedef-custom-wrap-fi', prefs.hedefSelect === 'custom');
        toggleCustomWrapper('hedef-custom-wrap-proje-fi', prefs.hedefSelect === 'custom');

        document.querySelectorAll('.sartli-toggle').forEach(function (t) {
            t.checked = Boolean(prefs.sartliActive);
        });
        document.querySelectorAll('.sartli-input-area').forEach(function (area) {
            area.classList.toggle('visible', Boolean(prefs.sartliActive));
        });
        document.querySelectorAll('.sartli-sinir-input').forEach(function (inp) {
            inp.value = String(prefs.sartliSinir);
        });

        updateGecmeNotu('tp');
        updateGecmeNotu('proje-tp');
    }

    /* =========================================================
       SEKMELER VE AĞIRLIK GÜNCELLEMELERİ
       ========================================================= */

    function showMainCalculator(type, skipSave) {
        if (type !== 'normal' && type !== 'proje') type = 'normal';

        document.querySelectorAll('.calculator-content').forEach(function (c) {
            c.classList.remove('active');
        });
        document.querySelectorAll('.main-nav-tab').forEach(function (tab) {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });

        const content = document.getElementById(type + '-content');
        const tab = document.getElementById('tab-' + type);
        if (content) content.classList.add('active');
        if (tab) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        }

        if (!skipSave) {
            prefs.activeMainTab = type;
            savePrefs();
        }

        const targetSub = type === 'normal'
            ? (prefs.activeSubTabNormal || 'normal-tp')
            : (prefs.activeSubTabProje || 'proje-tp');
        showSubCalculator(targetSub, true);
    }

    function showSubCalculator(type, skipSave) {
        const isNormal = type.startsWith('normal');
        const containerSelector = isNormal ? '#normal-content' : '#proje-content';

        document.querySelectorAll(containerSelector + ' .sub-calculator-content').forEach(function (c) {
            c.classList.remove('active');
        });
        document.querySelectorAll(containerSelector + ' .sub-nav-tab').forEach(function (tab) {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });

        const subContent = document.getElementById(type + '-content');
        const subTab = document.getElementById('tab-' + type);
        if (subContent) subContent.classList.add('active');
        if (subTab) {
            subTab.classList.add('active');
            subTab.setAttribute('aria-selected', 'true');
        }

        hideAllResultBoxes();

        if (!skipSave) {
            if (isNormal) {
                prefs.activeSubTabNormal = type;
            } else {
                prefs.activeSubTabProje = type;
            }
            savePrefs();
        }
    }

    function updateFinalWeight(suffix, finalize) {
        const sourceId = 'vize-agirlik-' + suffix;
        const otherSuffix = suffix === 'tp' ? 'fi' : 'tp';
        const vizeInput = document.getElementById(sourceId);
        const finalInput = document.getElementById('final-agirlik-' + suffix);
        if (!vizeInput || !finalInput) return;

        const raw = vizeInput.value.trim();
        if (raw === '' && !finalize) {
            finalInput.value = '100';
            return;
        }

        let vizeVal = parseFloat(raw);
        if (isNaN(vizeVal)) vizeVal = 0;
        vizeVal = clamp(Math.round(vizeVal), 0, 100);

        if (finalize || vizeVal !== parseFloat(raw)) {
            if (raw !== '' || finalize) {
                vizeInput.value = String(vizeVal);
            }
        }

        const finalVal = 100 - vizeVal;
        finalInput.value = String(finalVal);

        // Akıllı Senkronizasyon: Normal Ortalama <-> Gerekli Final Notu
        prefs.normalVizeWeight = vizeVal;
        setVal('vize-agirlik-' + otherSuffix, vizeVal);
        setVal('final-agirlik-' + otherSuffix, finalVal);
        savePrefs();
    }

    function updateProjeWeights(suffix, finalize) {
        const otherSuffix = suffix === 'proje-tp' ? 'proje-fi' : 'proje-tp';
        const vizeInput = document.getElementById('vize-agirlik-' + suffix);
        const projeInput = document.getElementById('proje-agirlik-' + suffix);
        const finalInput = document.getElementById('final-agirlik-' + suffix);
        if (!vizeInput || !projeInput || !finalInput) return;

        const rawV = vizeInput.value.trim();
        const rawP = projeInput.value.trim();

        if ((rawV === '' || rawP === '') && !finalize) {
            const tempV = rawV === '' ? 0 : clamp(Math.round(parseFloat(rawV) || 0), 0, 100);
            const tempP = rawP === '' ? 0 : clamp(Math.round(parseFloat(rawP) || 0), 0, 100);
            finalInput.value = String(Math.max(0, 100 - (tempV + tempP)));
            return;
        }

        let vizeVal = clamp(Math.round(parseFloat(rawV) || 0), 0, 100);
        let projeVal = clamp(Math.round(parseFloat(rawP) || 0), 0, 100);

        if (vizeVal + projeVal > 100) {
            projeVal = 100 - vizeVal;
        }

        if (finalize) {
            vizeInput.value = String(vizeVal);
            projeInput.value = String(projeVal);
        }

        const finalVal = 100 - (vizeVal + projeVal);
        finalInput.value = String(finalVal);

        // Akıllı Senkronizasyon: Projeli Ortalama <-> Gerekli Final Notu
        prefs.projeVizeWeight = vizeVal;
        prefs.projeProjeWeight = projeVal;
        setVal('vize-agirlik-' + otherSuffix, vizeVal);
        setVal('proje-agirlik-' + otherSuffix, projeVal);
        setVal('final-agirlik-' + otherSuffix, finalVal);
        savePrefs();
    }

    /* =========================================================
       GEÇME NOTU VE HEDEF ORTALAMA (ÖZEL DEĞER HAFIZASI & SENKRONİZASYON)
       ========================================================= */

    function handleGecmeSelectChange(sourceSuffix) {
        const selectId = sourceSuffix.includes('proje') ? 'gecme-notu-proje-tp' : 'gecme-notu-tp';
        const selectEl = document.getElementById(selectId);
        if (!selectEl) return;

        prefs.gecmeSelect = selectEl.value;
        prefs.hedefSelect = selectEl.value;
        if (selectEl.value === 'custom') {
            prefs.hedefCustom = prefs.gecmeCustom;
        }

        syncAllControlsFromPrefs();
        savePrefs();
        hideAllResultBoxes();

        if (selectEl.value === 'custom') {
            const customInput = document.getElementById(sourceSuffix.includes('proje') ? 'gecme-custom-proje-tp' : 'gecme-custom-tp');
            if (customInput) customInput.focus();
        }
    }

    function handleGecmeCustomInput(sourceSuffix, finalize) {
        const inputId = sourceSuffix.includes('proje') ? 'gecme-custom-proje-tp' : 'gecme-custom-tp';
        const inputEl = document.getElementById(inputId);
        if (!inputEl) return;

        const raw = inputEl.value.trim();
        if (raw === '' && !finalize) return;

        let val = parseFloat(raw);
        if (isNaN(val)) val = 50;
        val = clamp(Math.round(val), 1, 100);

        if (finalize) inputEl.value = String(val);

        prefs.gecmeSelect = 'custom';
        prefs.gecmeCustom = val;
        prefs.hedefSelect = 'custom';
        prefs.hedefCustom = val;

        const otherGecme = sourceSuffix.includes('proje') ? 'gecme-custom-tp' : 'gecme-custom-proje-tp';
        setVal(otherGecme, val);
        setVal('hedefPuan-fi', 'custom');
        setVal('hedefPuan-proje-fi', 'custom');
        setVal('hedef-custom-fi', val);
        setVal('hedef-custom-proje-fi', val);
        toggleCustomWrapper('hedef-custom-wrap-fi', true);
        toggleCustomWrapper('hedef-custom-wrap-proje-fi', true);

        updateGecmeNotu('tp');
        updateGecmeNotu('proje-tp');
        savePrefs();
    }

    function handleHedefSelectChange(sourceSuffix) {
        const selectId = sourceSuffix.includes('proje') ? 'hedefPuan-proje-fi' : 'hedefPuan-fi';
        const selectEl = document.getElementById(selectId);
        if (!selectEl) return;

        prefs.hedefSelect = selectEl.value;
        syncAllControlsFromPrefs();
        savePrefs();
        hideAllResultBoxes();

        if (selectEl.value === 'custom') {
            const customInput = document.getElementById(sourceSuffix.includes('proje') ? 'hedef-custom-proje-fi' : 'hedef-custom-fi');
            if (customInput) customInput.focus();
        }
    }

    function handleHedefCustomInput(sourceSuffix, finalize) {
        const inputId = sourceSuffix.includes('proje') ? 'hedef-custom-proje-fi' : 'hedef-custom-fi';
        const inputEl = document.getElementById(inputId);
        if (!inputEl) return;

        const raw = inputEl.value.trim();
        if (raw === '' && !finalize) return;

        let val = parseFloat(raw);
        if (isNaN(val)) val = 50;
        val = clamp(Math.round(val), 1, 100);

        if (finalize) inputEl.value = String(val);

        prefs.hedefSelect = 'custom';
        prefs.hedefCustom = val;
        const otherHedef = sourceSuffix.includes('proje') ? 'hedef-custom-fi' : 'hedef-custom-proje-fi';
        setVal(otherHedef, val);
        savePrefs();
    }

    function updateGecmeNotu(suffix) {
        const displayId = suffix.includes('proje') ? 'gosterilenGecmeNotu-proje-tp' : 'gosterilenGecmeNotu-tp';
        setText(displayId, String(getActiveGecmeNotu()));
    }

    function toggleSartliUI(event) {
        if (!event) return;
        prefs.sartliActive = Boolean(event.target.checked);
        syncAllControlsFromPrefs();
        savePrefs();
    }

    function handleSartliSinirInput(event, finalize) {
        const raw = event.target.value.trim();
        if (raw === '' && !finalize) return;

        let val = parseFloat(raw);
        if (isNaN(val)) val = 45;
        val = clamp(Math.round(val), 1, 100);

        if (finalize) event.target.value = String(val);

        prefs.sartliSinir = val;
        document.querySelectorAll('.sartli-sinir-input').forEach(function (inp) {
            if (inp !== event.target) inp.value = String(val);
        });
        savePrefs();
    }

    /* =========================================================
       HESAPLAMA FONKSİYONLARI
       ========================================================= */

    function parseScore(id) {
        const el = document.getElementById(id);
        if (!el) return NaN;
        const raw = el.value.trim().replace(',', '.');
        if (raw === '') return NaN;
        return parseFloat(raw);
    }

    function hesaplaToplamPuan() {
        updateFinalWeight('tp', true);
        showInlineError('error-normal-tp', '');

        const vizeNotu = parseScore('vize-tp');
        const finalNotu = parseScore('final-tp');
        const vizeAgirlikPct = Number(document.getElementById('vize-agirlik-tp').value);
        const finalAgirlikPct = Number(document.getElementById('final-agirlik-tp').value);
        const gecmeNotu = getActiveGecmeNotu();

        const resultBox = document.getElementById('sonuc-toplam-puan-normal');
        const gecmeDurumuElement = document.getElementById('gecmeDurumu-tp');
        const resultIcon = document.getElementById('icon-normal-tp');
        const marginEl = document.getElementById('margin-note-tp');

        resultBox.classList.remove('show', 'box-pass', 'box-fail');

        if (isNaN(vizeNotu) || isNaN(finalNotu) || vizeNotu < 0 || vizeNotu > 100 || finalNotu < 0 || finalNotu > 100) {
            showInlineError('error-normal-tp', 'Lütfen vize ve final notlarını 0 ile 100 arasında giriniz.');
            return;
        }

        const vizeRaw = exactRaw(vizeNotu, vizeAgirlikPct);
        const finalRaw = exactRaw(finalNotu, finalAgirlikPct);
        const vizePuanInt = flooredContribution(vizeNotu, vizeAgirlikPct);
        const finalPuanInt = flooredContribution(finalNotu, finalAgirlikPct);
        const toplamPuan = vizePuanInt + finalPuanInt;

        setText('vizeYuzde-tp', vizeAgirlikPct + '%');
        setText('finalYuzde-tp', finalAgirlikPct + '%');
        setText('vizePuan-tp', vizePuanInt + ' (Ham: ' + vizeRaw.toFixed(2) + ')');
        setText('finalPuan-tp', finalPuanInt + ' (Ham: ' + finalRaw.toFixed(2) + ')');
        setText('toplamPuan-tp', String(toplamPuan));
        setText('gosterilenGecmeNotu-tp', String(gecmeNotu));

        const diff = toplamPuan - gecmeNotu;
        if (toplamPuan >= gecmeNotu) {
            gecmeDurumuElement.textContent = 'GEÇTİ!';
            gecmeDurumuElement.style.color = 'var(--success-color)';
            resultBox.classList.add('box-pass');
            resultIcon.className = 'result-icon fa-solid fa-circle-check';
            marginEl.textContent = diff === 0
                ? 'Tam geçme sınırında dersi geçtiniz.'
                : 'Geçme sınırının +' + diff + ' puan üzerindesiniz.';
        } else {
            gecmeDurumuElement.textContent = 'KALDI!';
            gecmeDurumuElement.style.color = 'var(--fail-color)';
            resultBox.classList.add('box-fail');
            resultIcon.className = 'result-icon fa-solid fa-circle-xmark';
            marginEl.textContent = 'Geçmek için ' + Math.abs(diff) + ' puan daha gerekliydi.';
        }

        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hesaplaFinalIhtiyaci() {
        updateFinalWeight('fi', true);
        showInlineError('error-normal-fi', '');

        const vizeNotu = parseScore('vize-fi');
        const hedefToplamPuan = getActiveHedefNotu();
        const vizeAgirlikPct = Number(document.getElementById('vize-agirlik-fi').value);
        const finalAgirlikPct = Number(document.getElementById('final-agirlik-fi').value);

        const resultBox = document.getElementById('sonuc-final-ihtiyaci-normal');
        const uyariElementi = document.getElementById('final-uyari');
        const finalScoreElement = document.getElementById('finalIhtiyaci-fi');

        resultBox.classList.remove('show', 'box-pass', 'box-fail');
        uyariElementi.style.display = 'none';

        if (isNaN(vizeNotu) || vizeNotu < 0 || vizeNotu > 100) {
            showInlineError('error-normal-fi', 'Lütfen geçerli bir vize notu giriniz (0 - 100 arası).');
            return;
        }

        if (finalAgirlikPct <= 0) {
            showInlineError('error-normal-fi', 'Gerekli final hesaplaması için final ağırlığı %0 olamaz.');
            return;
        }

        const vizeKatkisiInt = flooredContribution(vizeNotu, vizeAgirlikPct);
        const finaldenGerekenInt = hedefToplamPuan - vizeKatkisiInt;
        const finalNotuIhtiyaci = requiredFinalScore(finaldenGerekenInt, finalAgirlikPct);

        setText('gosterilenHedefPuan', String(hedefToplamPuan));
        setText('vizeKatkisi-fi-int', String(vizeKatkisiInt));

        const sartliAktif = Boolean(prefs.sartliActive);
        const sartliSinir = clamp(Number(prefs.sartliSinir) || 45, 1, 100);
        const finaldenSartliGereken = sartliSinir - vizeKatkisiInt;
        const sartliRaw = requiredFinalScore(finaldenSartliGereken, finalAgirlikPct);
        const sartliDisplay = sartliRaw > 100 ? 'İMKANSIZ' : String(Math.max(0, sartliRaw));
        const hedefDisplay = finalNotuIhtiyaci > 100 ? 'İMKANSIZ' : String(Math.max(0, finalNotuIhtiyaci));

        if (sartliAktif) {
            finalScoreElement.innerHTML =
                '<div class="score-item">' +
                    '<span class="label">HEDEF (' + hedefToplamPuan + ') İÇİN</span>' +
                    '<span class="value">' + hedefDisplay + '</span>' +
                '</div>' +
                '<div class="score-item sartli">' +
                    '<span class="label">ŞARTLI (' + sartliSinir + ') İÇİN</span>' +
                    '<span class="value">' + sartliDisplay + '</span>' +
                '</div>';
        } else {
            finalScoreElement.innerHTML =
                '<div class="score-item">' +
                    '<span class="label">GEREKEN FİNAL NOTU</span>' +
                    '<span class="value">' + hedefDisplay + '</span>' +
                '</div>';
        }

        if (finalNotuIhtiyaci > 100) {
            uyariElementi.style.color = 'var(--fail-color)';
            uyariElementi.textContent = '* Gerekli final notu (' + finalNotuIhtiyaci + ') 100\'ün üzerindedir. Bu hedefe ulaşmak matematiksel olarak mümkün değil.';
            uyariElementi.style.display = 'block';
            resultBox.classList.add('box-fail');
        } else if (finalNotuIhtiyaci <= 0) {
            uyariElementi.style.color = 'var(--success-color)';
            uyariElementi.textContent = 'TEBRİKLER! Finalden 0 almanız bile bu hedefe ulaşmanız için yeterli!';
            uyariElementi.style.display = 'block';
            resultBox.classList.add('box-pass');
        } else {
            resultBox.classList.add('box-pass');
        }

        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hesaplaProjeToplamPuan() {
        updateProjeWeights('proje-tp', true);
        showInlineError('error-proje-tp', '');

        const vizeNotu = parseScore('vize-proje-tp');
        const projeNotu = parseScore('proje-proje-tp');
        const finalNotu = parseScore('final-proje-tp');

        const vizeAgirlikPct = Number(document.getElementById('vize-agirlik-proje-tp').value);
        const projeAgirlikPct = Number(document.getElementById('proje-agirlik-proje-tp').value);
        const finalAgirlikPct = Number(document.getElementById('final-agirlik-proje-tp').value);
        const gecmeNotu = getActiveGecmeNotu();

        const resultBox = document.getElementById('sonuc-proje-tp');
        const gecmeDurumuElement = document.getElementById('gecmeDurumu-proje-tp');
        const resultIcon = document.getElementById('icon-proje-tp');
        const marginEl = document.getElementById('margin-note-proje-tp');

        resultBox.classList.remove('show', 'box-pass', 'box-fail');

        if (
            isNaN(vizeNotu) || isNaN(projeNotu) || isNaN(finalNotu) ||
            vizeNotu < 0 || vizeNotu > 100 ||
            projeNotu < 0 || projeNotu > 100 ||
            finalNotu < 0 || finalNotu > 100
        ) {
            showInlineError('error-proje-tp', 'Lütfen vize, proje ve final notlarını 0 ile 100 arasında giriniz.');
            return;
        }

        if (vizeAgirlikPct + projeAgirlikPct + finalAgirlikPct !== 100) {
            showInlineError('error-proje-tp', 'Ağırlıkların toplamı %100 olmalıdır.');
            return;
        }

        const vizeRaw = exactRaw(vizeNotu, vizeAgirlikPct);
        const projeRaw = exactRaw(projeNotu, projeAgirlikPct);
        const finalRaw = exactRaw(finalNotu, finalAgirlikPct);

        const vizePuanInt = flooredContribution(vizeNotu, vizeAgirlikPct);
        const projePuanInt = flooredContribution(projeNotu, projeAgirlikPct);
        const finalPuanInt = flooredContribution(finalNotu, finalAgirlikPct);
        const toplamPuan = vizePuanInt + projePuanInt + finalPuanInt;

        setText('vizeYuzde-proje-tp', vizeAgirlikPct + '%');
        setText('projeYuzde-proje-tp', projeAgirlikPct + '%');
        setText('finalYuzde-proje-tp', finalAgirlikPct + '%');

        setText('vizePuan-proje-tp', vizePuanInt + ' (Ham: ' + vizeRaw.toFixed(2) + ')');
        setText('projePuan-proje-tp', projePuanInt + ' (Ham: ' + projeRaw.toFixed(2) + ')');
        setText('finalPuan-proje-tp', finalPuanInt + ' (Ham: ' + finalRaw.toFixed(2) + ')');
        setText('toplamPuan-proje-tp', String(toplamPuan));
        setText('gosterilenGecmeNotu-proje-tp', String(gecmeNotu));

        const diff = toplamPuan - gecmeNotu;
        if (toplamPuan >= gecmeNotu) {
            gecmeDurumuElement.textContent = 'GEÇTİ!';
            gecmeDurumuElement.style.color = 'var(--success-color)';
            resultBox.classList.add('box-pass');
            resultIcon.className = 'result-icon fa-solid fa-circle-check';
            marginEl.textContent = diff === 0
                ? 'Tam geçme sınırında dersi geçtiniz.'
                : 'Geçme sınırının +' + diff + ' puan üzerindesiniz.';
        } else {
            gecmeDurumuElement.textContent = 'KALDI!';
            gecmeDurumuElement.style.color = 'var(--fail-color)';
            resultBox.classList.add('box-fail');
            resultIcon.className = 'result-icon fa-solid fa-circle-xmark';
            marginEl.textContent = 'Geçmek için ' + Math.abs(diff) + ' puan daha gerekliydi.';
        }

        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hesaplaProjeFinalIhtiyaci() {
        updateProjeWeights('proje-fi', true);
        showInlineError('error-proje-fi', '');

        const vizeNotu = parseScore('vize-proje-fi');
        const projeNotu = parseScore('proje-proje-fi');
        const hedefToplamPuan = getActiveHedefNotu();

        const vizeAgirlikPct = Number(document.getElementById('vize-agirlik-proje-fi').value);
        const projeAgirlikPct = Number(document.getElementById('proje-agirlik-proje-fi').value);
        const finalAgirlikPct = Number(document.getElementById('final-agirlik-proje-fi').value);

        const resultBox = document.getElementById('sonuc-proje-fi');
        const uyariElementi = document.getElementById('final-uyari-proje');
        const finalScoreElement = document.getElementById('finalIhtiyaci-proje-fi');

        resultBox.classList.remove('show', 'box-pass', 'box-fail');
        uyariElementi.style.display = 'none';

        if (
            isNaN(vizeNotu) || isNaN(projeNotu) ||
            vizeNotu < 0 || vizeNotu > 100 ||
            projeNotu < 0 || projeNotu > 100
        ) {
            showInlineError('error-proje-fi', 'Lütfen geçerli (0 - 100 arası) vize ve proje notları giriniz.');
            return;
        }

        if (finalAgirlikPct <= 0) {
            showInlineError('error-proje-fi', 'Final ağırlığı sıfırdan büyük olmalıdır.');
            return;
        }

        const vizeKatkisiInt = flooredContribution(vizeNotu, vizeAgirlikPct);
        const projeKatkisiInt = flooredContribution(projeNotu, projeAgirlikPct);
        const vpToplamKatkiInt = vizeKatkisiInt + projeKatkisiInt;

        const finaldenGerekenInt = hedefToplamPuan - vpToplamKatkiInt;
        const finalNotuIhtiyaci = requiredFinalScore(finaldenGerekenInt, finalAgirlikPct);

        setText('gosterilenHedefPuan-proje-fi', String(hedefToplamPuan));
        setText('vpKatkisi-proje-fi-int', String(vpToplamKatkiInt));

        const sartliAktif = Boolean(prefs.sartliActive);
        const sartliSinir = clamp(Number(prefs.sartliSinir) || 45, 1, 100);
        const finaldenSartliGereken = sartliSinir - vpToplamKatkiInt;
        const sartliRaw = requiredFinalScore(finaldenSartliGereken, finalAgirlikPct);
        const sartliDisplay = sartliRaw > 100 ? 'İMKANSIZ' : String(Math.max(0, sartliRaw));
        const hedefDisplay = finalNotuIhtiyaci > 100 ? 'İMKANSIZ' : String(Math.max(0, finalNotuIhtiyaci));

        if (sartliAktif) {
            finalScoreElement.innerHTML =
                '<div class="score-item">' +
                    '<span class="label">HEDEF (' + hedefToplamPuan + ') İÇİN</span>' +
                    '<span class="value">' + hedefDisplay + '</span>' +
                '</div>' +
                '<div class="score-item sartli">' +
                    '<span class="label">ŞARTLI (' + sartliSinir + ') İÇİN</span>' +
                    '<span class="value">' + sartliDisplay + '</span>' +
                '</div>';
        } else {
            finalScoreElement.innerHTML =
                '<div class="score-item">' +
                    '<span class="label">GEREKEN FİNAL NOTU</span>' +
                    '<span class="value">' + hedefDisplay + '</span>' +
                '</div>';
        }

        if (finalNotuIhtiyaci > 100) {
            uyariElementi.style.color = 'var(--fail-color)';
            uyariElementi.textContent = '* Gerekli final notu (' + finalNotuIhtiyaci + ') 100\'ün üzerindedir. Bu hedefe ulaşmak matematiksel olarak mümkün değil.';
            uyariElementi.style.display = 'block';
            resultBox.classList.add('box-fail');
        } else if (finalNotuIhtiyaci <= 0) {
            uyariElementi.style.color = 'var(--success-color)';
            uyariElementi.textContent = 'TEBRİKLER! Finalden 0 almanız bile bu hedefe ulaşmanız için yeterli!';
            uyariElementi.style.display = 'block';
            resultBox.classList.add('box-pass');
        } else {
            resultBox.classList.add('box-pass');
        }

        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* =========================================================
       HEDEF DEFTERİNE KAYIT MODALI
       ========================================================= */

    function buildGoalDataString(btn) {
        const parent = btn.closest('.result-box');
        const isProje = parent.id.includes('proje');
        const idSuffix = isProje ? '-proje-fi' : '-fi';

        const vize = document.getElementById('vize' + idSuffix).value;
        const vAg = document.getElementById('vize-agirlik' + idSuffix).value;
        const fAg = document.getElementById('final-agirlik' + idSuffix).value;
        const hedef = String(getActiveHedefNotu());

        let pNot = '';
        let pAg = '';
        if (isProje) {
            pNot = document.getElementById('proje-proje-fi').value;
            pAg = document.getElementById('proje-agirlik-proje-fi').value;
        }

        const sMod = prefs.sartliActive ? 'AKTIF' : 'PASIF';
        const sAlt = String(clamp(Number(prefs.sartliSinir) || 45, 1, 100));

        const scoreItems = parent.querySelectorAll('.score-item .value');
        const gerekenHedef = scoreItems[0] ? scoreItems[0].innerText.trim() : '-';
        const gerekenSartli = (sMod === 'AKTIF' && scoreItems[1]) ? scoreItems[1].innerText.trim() : '';

        return 'T:' + (isProje ? 'PROJ' : 'NORM') +
            '|V:' + vize +
            '|VA:' + vAg +
            '|P:' + pNot +
            '|PA:' + pAg +
            '|FA:' + fAg +
            '|H:' + hedef +
            '|GH:' + gerekenHedef +
            '|GS:' + gerekenSartli +
            '|SALT:' + sAlt;
    }

    function prepareForVault(btn) {
        try {
            pendingSaveGoalPayload = buildGoalDataString(btn);
            const modal = document.getElementById('save-goal-modal');
            const input = document.getElementById('save-goal-course-name');
            if (modal && input) {
                input.value = '';
                modal.classList.add('open');
                setTimeout(function () { input.focus(); }, 60);
            }
        } catch (err) {
            NotmatikCommon.showToast('Hedef hazırlanırken bir hata oluştu.', 'error');
        }
    }

    function closeSaveGoalModal() {
        const modal = document.getElementById('save-goal-modal');
        if (modal) modal.classList.remove('open');
    }

    function confirmSaveGoal(redirectToNotebook) {
        const input = document.getElementById('save-goal-course-name');
        const courseName = input ? input.value.trim() : '';
        if (!courseName) {
            NotmatikCommon.showToast('Lütfen ders adını yazınız.', 'error');
            if (input) input.focus();
            return;
        }
        if (!pendingSaveGoalPayload) return;

        const courses = NotmatikCommon.getSavedGoals();
        courses.unshift({
            id: Date.now(),
            name: courseName.toLocaleUpperCase('tr-TR'),
            data: pendingSaveGoalPayload
        });
        NotmatikCommon.setSavedGoals(courses);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pendingSaveGoalPayload).catch(function () {});
        }

        closeSaveGoalModal();
        NotmatikCommon.showToast('"' + courseName + '" Hedef Defterinize kaydedildi!', 'success');

        if (redirectToNotebook) {
            setTimeout(function () {
                window.location.href = 'not-defteri.html';
            }, 350);
        }
    }

    /* =========================================================
       POPUP REKLAM ZAMANLAYICISI (KORUNDU)
       ========================================================= */

    function closeAdModal() {
        const modal = document.getElementById('first-time-modal');
        const videoElement = document.getElementById('modal-video');
        if (!modal) return;

        modal.style.display = 'none';
        if (videoElement) {
            videoElement.pause();
            videoElement.currentTime = 0;
        }
        localStorage.setItem(POPUP_LAST_CLOSED_TIME_KEY, String(Date.now()));
    }

    function checkAndShowModalWithTimer() {
        const modal = document.getElementById('first-time-modal');
        const closeBtn = document.querySelector('.modal-close-btn');
        const videoElement = document.getElementById('modal-video');
        if (!modal || !closeBtn) return;

        const lastClosedTime = localStorage.getItem(POPUP_LAST_CLOSED_TIME_KEY);
        const currentTime = Date.now();

        if (!lastClosedTime || (currentTime - parseInt(lastClosedTime, 10) > POPUP_DELAY_MS)) {
            modal.style.display = 'block';
            if (videoElement) {
                videoElement.play().catch(function () {});
            }
        }

        closeBtn.addEventListener('click', closeAdModal);
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeAdModal();
            }
        });
    }

    /* =========================================================
       BAŞLANGIÇ VE OLAY DİNLEYİCİLERİ
       ========================================================= */

    document.addEventListener('DOMContentLoaded', function () {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab === 'normal' || urlTab === 'proje') {
            prefs.activeMainTab = urlTab;
        }

        syncAllControlsFromPrefs();
        showMainCalculator(prefs.activeMainTab || 'normal', true);
        hideAllResultBoxes();

        document.querySelectorAll('.calculator-content input').forEach(function (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const activeBtn = document.querySelector('.calculator-content.active .sub-calculator-content.active .calculate-btn');
                    if (activeBtn) activeBtn.click();
                }
            });
        });

        const saveModal = document.getElementById('save-goal-modal');
        if (saveModal) {
            saveModal.addEventListener('click', function (e) {
                if (e.target === saveModal) closeSaveGoalModal();
            });
        }
        const courseInput = document.getElementById('save-goal-course-name');
        if (courseInput) {
            courseInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmSaveGoal(false);
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeSaveGoalModal();
                const adModal = document.getElementById('first-time-modal');
                if (adModal && adModal.style.display === 'block') {
                    closeAdModal();
                }
            }
        });

        checkAndShowModalWithTimer();
    });

    window.showMainCalculator = showMainCalculator;
    window.showSubCalculator = showSubCalculator;
    window.updateFinalWeight = updateFinalWeight;
    window.updateProjeWeights = updateProjeWeights;
    window.handleGecmeSelectChange = handleGecmeSelectChange;
    window.handleGecmeCustomInput = handleGecmeCustomInput;
    window.handleHedefSelectChange = handleHedefSelectChange;
    window.handleHedefCustomInput = handleHedefCustomInput;
    window.updateGecmeNotu = updateGecmeNotu;
    window.toggleSartliUI = toggleSartliUI;
    window.handleSartliSinirInput = handleSartliSinirInput;
    window.hesaplaToplamPuan = hesaplaToplamPuan;
    window.hesaplaFinalIhtiyaci = hesaplaFinalIhtiyaci;
    window.hesaplaProjeToplamPuan = hesaplaProjeToplamPuan;
    window.hesaplaProjeFinalIhtiyaci = hesaplaProjeFinalIhtiyaci;
    window.prepareForVault = prepareForVault;
    window.closeSaveGoalModal = closeSaveGoalModal;
    window.confirmSaveGoal = confirmSaveGoal;
})();
