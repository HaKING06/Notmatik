/* =========================================================
   NOTMATİK - Hedef Defterim Sayfası Mantığı
   ========================================================= */

(function () {
    'use strict';

    let activeSearchQuery = '';
    let pendingGoalNameText = '';

    function parseCourseData(raw) {
        const parts = {};
        if (!raw) return parts;
        raw.split('|').forEach(function (entry) {
            const index = entry.indexOf(':');
            if (index !== -1) {
                const k = entry.substring(0, index);
                const v = entry.substring(index + 1);
                parts[k] = v;
            }
        });
        return parts;
    }

    function loadCards() {
        const list = document.getElementById('courseList');
        const countEl = document.getElementById('goal-total-count');
        if (!list) return;

        const allCourses = NotmatikCommon.getSavedGoals();
        if (countEl) countEl.textContent = String(allCourses.length);

        const query = activeSearchQuery.trim().toLocaleLowerCase('tr-TR');
        const filtered = query
            ? allCourses.filter(function (c) {
                return String(c.name || '').toLocaleLowerCase('tr-TR').includes(query);
            })
            : allCourses;

        if (allCourses.length === 0) {
            list.innerHTML =
                '<div class="empty-state">' +
                    '<i class="fa-solid fa-clipboard-list fa-3x"></i>' +
                    '<p>Henüz kayıtlı bir ders hedefiniz bulunmuyor.</p>' +
                    '<a href="index.html" class="btn-smart-paste" style="text-decoration:none;">' +
                        '<i class="fa-solid fa-calculator"></i> Hesaplayıcıya Git' +
                    '</a>' +
                '</div>';
            return;
        }

        if (filtered.length === 0) {
            list.innerHTML =
                '<div class="empty-state">' +
                    '<i class="fa-solid fa-magnifying-glass fa-3x"></i>' +
                    '<p>Aramanızla eşleşen ders bulunamadı.</p>' +
                '</div>';
            return;
        }

        list.innerHTML = filtered.map(function (course) {
            const parts = parseCourseData(course.data);
            const safeName = NotmatikCommon.escapeHtml(course.name || 'DERS');
            const isProj = parts.T === 'PROJ';
            const badgeText = isProj ? 'Proje Dahil' : 'Vize - Final';

            const safeV = NotmatikCommon.escapeHtml(parts.V || '-');
            const safeVA = NotmatikCommon.escapeHtml(parts.VA || '0');
            const safeP = NotmatikCommon.escapeHtml(parts.P || '');
            const safePA = NotmatikCommon.escapeHtml(parts.PA || '0');
            const safeH = NotmatikCommon.escapeHtml(parts.H || '-');
            const safeGH = NotmatikCommon.escapeHtml(parts.GH || '-');
            const safeGS = NotmatikCommon.escapeHtml(parts.GS || '');
            const safeSALT = NotmatikCommon.escapeHtml(parts.SALT || '45');

            let displayNote = '';
            if (parts.GS && parts.GS !== '') {
                displayNote =
                    '<div>' +
                        '<span class="target-label">HEDEF (' + safeH + ') İÇİN</span>' +
                        '<span class="target-main-value">' + safeGH + '</span>' +
                    '</div>' +
                    '<div class="target-sartli-divider">' +
                        '<span class="target-sartli-label">ŞARTLI (' + safeSALT + ') İÇİN</span>' +
                        '<span class="target-sartli-value">' + safeGS + '</span>' +
                    '</div>';
            } else {
                displayNote =
                    '<span class="target-label">GEREKEN FİNAL NOTU</span>' +
                    '<span class="target-main-value">' + safeGH + '</span>';
            }

            return (
                '<article class="course-card">' +
                    '<div class="course-card-header">' +
                        '<div>' +
                            '<h3>' + safeName + '</h3>' +
                            '<span class="course-type-badge">' + badgeText + '</span>' +
                        '</div>' +
                        '<button type="button" class="delete-btn" onclick="deleteItem(' + Number(course.id) + ')" title="Dersi Sil" aria-label="Dersi Sil">' +
                            '<i class="fa-solid fa-trash-can"></i>' +
                        '</button>' +
                    '</div>' +
                    '<div class="grid-info">' +
                        '<div class="info-item">' +
                            '<label>VİZE (%' + safeVA + ')</label>' +
                            '<span>' + safeV + '</span>' +
                        '</div>' +
                        (safeP !== ''
                            ? '<div class="info-item"><label>PROJE (%' + safePA + ')</label><span>' + safeP + '</span></div>'
                            : '') +
                        '<div class="info-item">' +
                            '<label>HEDEF</label>' +
                            '<span>' + safeH + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="target-box">' + displayNote + '</div>' +
                '</article>'
            );
        }).join('');
    }

    async function handleSmartPaste() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                NotmatikCommon.showToast('Tarayıcınız pano okuma özelliğini desteklemiyor. Manuel eklemeyi kullanabilirsiniz.', 'error');
                return;
            }
            const text = await navigator.clipboard.readText();
            if (!text || !text.includes('|') || !text.startsWith('T:')) {
                NotmatikCommon.showToast('Panoda geçerli bir NOTMATİK hedef verisi bulunamadı.', 'error');
                return;
            }

            pendingGoalNameText = text;
            const modal = document.getElementById('paste-name-modal');
            const input = document.getElementById('paste-course-name-input');
            if (modal && input) {
                input.value = '';
                modal.classList.add('open');
                setTimeout(function () { input.focus(); }, 60);
            }
        } catch (err) {
            NotmatikCommon.showToast('Pano erişim izni reddedildi.', 'error');
        }
    }

    function closePasteNameModal() {
        const modal = document.getElementById('paste-name-modal');
        if (modal) modal.classList.remove('open');
    }

    function confirmPasteSave() {
        const input = document.getElementById('paste-course-name-input');
        const dersAdi = input ? input.value.trim() : '';
        if (!dersAdi) {
            NotmatikCommon.showToast('Lütfen ders adını yazınız.', 'error');
            if (input) input.focus();
            return;
        }
        if (!pendingGoalNameText) return;

        const courses = NotmatikCommon.getSavedGoals();
        courses.unshift({
            id: Date.now(),
            name: dersAdi.toLocaleUpperCase('tr-TR'),
            data: pendingGoalNameText
        });
        NotmatikCommon.setSavedGoals(courses);
        pendingGoalNameText = '';

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('').catch(function () {});
        }

        closePasteNameModal();
        loadCards();
        NotmatikCommon.showToast('Ders hedefi başarıyla kaydedildi!', 'success');
    }

    function openManualAddModal() {
        const modal = document.getElementById('manual-goal-modal');
        if (modal) {
            modal.classList.add('open');
            const nameEl = document.getElementById('manual-course-name');
            if (nameEl) setTimeout(function () { nameEl.focus(); }, 60);
        }
    }

    function closeManualAddModal() {
        const modal = document.getElementById('manual-goal-modal');
        if (modal) modal.classList.remove('open');
    }

    function saveManualGoal() {
        const name = (document.getElementById('manual-course-name').value || '').trim();
        const vize = parseFloat(document.getElementById('manual-vize').value);
        const vizeAgirlik = parseFloat(document.getElementById('manual-vize-agirlik').value);
        const hedef = parseFloat(document.getElementById('manual-hedef').value);

        if (!name) {
            NotmatikCommon.showToast('Lütfen ders adını giriniz.', 'error');
            return;
        }
        if (isNaN(vize) || vize < 0 || vize > 100 || isNaN(vizeAgirlik) || vizeAgirlik < 0 || vizeAgirlik >= 100 || isNaN(hedef) || hedef < 1 || hedef > 100) {
            NotmatikCommon.showToast('Lütfen geçerli not ve ağırlık değerleri giriniz.', 'error');
            return;
        }

        const finalAgirlik = 100 - vizeAgirlik;
        const vizeKatki = Math.floor(Number(((vize * vizeAgirlik) / 100).toFixed(6)));
        const req = Math.ceil(Number((((hedef - vizeKatki) * 100) / finalAgirlik).toFixed(6)));
        const gh = req > 100 ? 'İMKANSIZ' : String(Math.max(0, req));

        const dataString = 'T:NORM|V:' + vize + '|VA:' + vizeAgirlik + '|P:|PA:|FA:' + finalAgirlik + '|H:' + hedef + '|GH:' + gh + '|GS:|SALT:45';
        const courses = NotmatikCommon.getSavedGoals();
        courses.unshift({
            id: Date.now(),
            name: name.toLocaleUpperCase('tr-TR'),
            data: dataString
        });
        NotmatikCommon.setSavedGoals(courses);

        document.getElementById('manual-course-name').value = '';
        document.getElementById('manual-vize').value = '';
        closeManualAddModal();
        loadCards();
        NotmatikCommon.showToast('"' + name + '" eklendi!', 'success');
    }

    function deleteItem(id) {
        if (confirm('Bu dersi defterden silmek istediğinize emin misiniz?')) {
            const courses = NotmatikCommon.getSavedGoals().filter(function (c) {
                return Number(c.id) !== Number(id);
            });
            NotmatikCommon.setSavedGoals(courses);
            loadCards();
            NotmatikCommon.showToast('Ders silindi.', 'info');
        }
    }

    function clearAllGoals() {
        const courses = NotmatikCommon.getSavedGoals();
        if (courses.length === 0) {
            NotmatikCommon.showToast('Silinecek kayıtlı ders bulunmuyor.', 'info');
            return;
        }
        if (confirm('Tüm kayıtlı ders hedeflerinizi silmek istediğinize emin misiniz?')) {
            NotmatikCommon.setSavedGoals([]);
            loadCards();
            NotmatikCommon.showToast('Tüm kayıtlı hedefler temizlendi.', 'info');
        }
    }

    function filterCourses(value) {
        activeSearchQuery = value || '';
        loadCards();
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadCards();

        const pasteModal = document.getElementById('paste-name-modal');
        if (pasteModal) {
            pasteModal.addEventListener('click', function (e) {
                if (e.target === pasteModal) closePasteNameModal();
            });
        }
        const pasteInput = document.getElementById('paste-course-name-input');
        if (pasteInput) {
            pasteInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmPasteSave();
                }
            });
        }

        const manualModal = document.getElementById('manual-goal-modal');
        if (manualModal) {
            manualModal.addEventListener('click', function (e) {
                if (e.target === manualModal) closeManualAddModal();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closePasteNameModal();
                closeManualAddModal();
            }
        });
    });

    window.handleSmartPaste = handleSmartPaste;
    window.closePasteNameModal = closePasteNameModal;
    window.confirmPasteSave = confirmPasteSave;
    window.openManualAddModal = openManualAddModal;
    window.closeManualAddModal = closeManualAddModal;
    window.saveManualGoal = saveManualGoal;
    window.deleteItem = deleteItem;
    window.clearAllGoals = clearAllGoals;
    window.filterCourses = filterCourses;
})();
