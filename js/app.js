/**
 * Trading Playbook - Application Logic & Controllers
 * Top-Down Multi-Timeframe Analysis Architecture
 */

(function () {
  'use strict';

  // State
  let currentPlaybooks = [];
  let currentDetailPlaybook = null;
  let activeMobileFrameIndex = 1;
  let currentZoom = 1;
  let isDraggingZoom = false;
  let zoomStartX = 0;
  let zoomStartY = 0;
  let zoomTranslateX = 0;
  let zoomTranslateY = 0;

  // DOM Elements
  const viewList = document.getElementById('view-list');
  const viewDetail = document.getElementById('view-detail');
  const viewEditor = document.getElementById('view-editor');

  const playbooksContainer = document.getElementById('playbooks-container');
  const emptyState = document.getElementById('empty-state');
  const listCountBadge = document.getElementById('list-count-badge');

  // Filters
  const filterSearch = document.getElementById('filter-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const filterPair = document.getElementById('filter-pair');
  const filterPosition = document.getElementById('filter-position');
  const filterOutcome = document.getElementById('filter-outcome');

  // Header
  const btnBrandHome = document.getElementById('btn-brand-home');
  const btnHeaderAdd = document.getElementById('btn-header-add');
  const btnMoreMenu = document.getElementById('btn-more-menu');
  const dropdownMore = document.getElementById('dropdown-more');
  const btnActionExport = document.getElementById('btn-action-export');
  const inputImportFile = document.getElementById('input-import-file');
  const btnActionClearAll = document.getElementById('btn-action-clear-all');

  // Detail View elements
  const btnDetailBack = document.getElementById('btn-detail-back');
  const detailTitle = document.getElementById('detail-title');
  const detailBadgePair = document.getElementById('detail-badge-pair');
  const detailBadgePosition = document.getElementById('detail-badge-position');
  const detailBadgeOutcome = document.getElementById('detail-badge-outcome');
  const detailDate = document.getElementById('detail-date');
  const btnDetailEdit = document.getElementById('btn-detail-edit');
  const btnDetailDelete = document.getElementById('btn-detail-delete');
  const detailFramesGrid = document.getElementById('detail-frames-grid');
  const mobileTabsBar = document.getElementById('mobile-tabs-bar');

  // Editor View elements
  const editorForm = document.getElementById('editor-form');
  const editorHeading = document.getElementById('editor-heading');
  const editId = document.getElementById('edit-id');
  const editTitle = document.getElementById('edit-title');
  const editPair = document.getElementById('edit-pair');
  const editPosition = document.getElementById('edit-position');
  const editOutcome = document.getElementById('edit-outcome');
  const btnEditorCancel = document.getElementById('btn-editor-cancel');
  const btnEditorCancelBottom = document.getElementById('btn-editor-cancel-bottom');

  // Lightbox
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxBadge = document.getElementById('lightbox-badge');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnLightboxClose = document.getElementById('btn-lightbox-close');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  async function init() {
    bindGlobalEvents();
    bindEditorEvents();
    bindLightboxEvents();
    bindSwipeEvents();

    try {
      // Xóa sạch toàn bộ dữ liệu cũ theo yêu cầu người dùng để bắt đầu đồng bộ Firebase mới
      const RESET_FLAG = 'tp_reset_firebase_sync_2026';
      if (!localStorage.getItem(RESET_FLAG)) {
        await window.playbookDB.clearAll();
        localStorage.setItem(RESET_FLAG, 'true');
      }

      // Khởi tạo Cloud Sync Engine
      if (window.cloudSync) {
        await window.cloudSync.init(async () => {
          await loadAndRenderList();
        });
      }

      await loadAndRenderList();
    } catch (err) {
      console.error('Lỗi khởi tạo cơ sở dữ liệu:', err);
      showToast('Khởi tạo cơ sở dữ liệu thất bại', 'error');
    }
  }

  // =========================================================================
  // ROUTING & VIEW NAVIGATION
  // =========================================================================
  function showView(viewName) {
    viewList.classList.remove('active');
    viewDetail.classList.remove('active');
    viewEditor.classList.remove('active');

    // Close any opened menu
    dropdownMore.classList.add('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (viewName === 'list') {
      viewList.classList.add('active');
      loadAndRenderList();
    } else if (viewName === 'detail') {
      viewDetail.classList.add('active');
    } else if (viewName === 'editor') {
      viewEditor.classList.add('active');
    }
  }

  // =========================================================================
  // VIEW 1: PLAYBOOKS LIST
  // =========================================================================
  async function loadAndRenderList() {
    try {
      currentPlaybooks = await window.playbookDB.getAll();
      applyFilters();
    } catch (err) {
      console.error('Lỗi tải danh sách:', err);
    }
  }

  function applyFilters() {
    const query = (filterSearch.value || '').trim().toLowerCase();
    const pair = filterPair.value;
    const position = filterPosition.value;
    const outcome = filterOutcome.value;

    const filtered = currentPlaybooks.filter(item => {
      // Pair
      if (pair !== 'ALL' && item.pair !== pair) return false;
      // Position
      if (position !== 'ALL' && item.position !== position) return false;
      // Outcome
      if (outcome !== 'ALL' && item.outcome !== outcome) return false;
      // Search
      if (query) {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const notesMatch = Object.values(item.frames || {}).some(f => (f.note || '').toLowerCase().includes(query));
        if (!titleMatch && !notesMatch) return false;
      }
      return true;
    });

    renderGrid(filtered);
    listCountBadge.textContent = `${filtered.length} / ${currentPlaybooks.length} mô hình`;
  }

  function renderGrid(items) {
    playbooksContainer.innerHTML = '';

    if (items.length === 0) {
      emptyState.classList.remove('hidden');
      const emptyTitleEl = document.getElementById('empty-title');
      const emptyDescEl = document.getElementById('empty-desc');
      if (emptyTitleEl && emptyDescEl) {
        if (currentPlaybooks.length === 0) {
          emptyTitleEl.textContent = 'Chưa có mô hình nào';
          emptyDescEl.textContent = 'Hãy thêm mô hình đầu tiên của bạn để bắt đầu lưu trữ và ôn tập.';
        } else {
          emptyTitleEl.textContent = 'Chưa có mô hình nào phù hợp';
          emptyDescEl.textContent = 'Thử đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc xem sao nhé.';
        }
      }
      return;
    }

    emptyState.classList.add('hidden');

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'playbook-summary-card';
      card.dataset.id = item.id;

      // Extract timeframes
      const f1 = item.frames?.f1?.timeframe || '1D';
      const f2 = item.frames?.f2?.timeframe || 'H4';
      const f3 = item.frames?.f3?.timeframe || 'H1';
      const f4 = item.frames?.f4?.timeframe || 'M15';
      const tfSeq = `${f1} • ${f2} • ${f3} • ${f4}`;

      // Date string
      const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : '';

      // Outcomes class
      const outcomeClass = getOutcomeClass(item.outcome);
      const pairClass = (item.pair || '').toLowerCase();
      const posClass = (item.position || '').toLowerCase();

      // Mini 4-Quadrant Preview
      const img1 = item.frames?.f1?.image || '';
      const img2 = item.frames?.f2?.image || '';
      const img3 = item.frames?.f3?.image || '';
      const img4 = item.frames?.f4?.image || '';

      card.innerHTML = `
        <div class="card-top-badges">
          <span class="badge badge-pair ${pairClass}">${escapeHtml(item.pair || 'XAU')}</span>
          <span class="badge badge-pos ${posClass}">${escapeHtml(item.position || 'BUY')}</span>
          <span class="badge badge-outcome ${outcomeClass}">${escapeHtml(item.outcome || 'Thắng')}</span>
        </div>

        <h3 class="card-title-text">${escapeHtml(item.title || 'Mô hình không tên')}</h3>

        <div class="card-tf-sequence">${tfSeq}</div>

        <div class="card-mini-preview">
          <div class="mini-preview-cell">
            ${img1 ? `<img src="${img1}" alt="F1" class="mini-preview-img" loading="lazy">` : '<div class="mini-preview-empty">F1</div>'}
          </div>
          <div class="mini-preview-cell">
            ${img2 ? `<img src="${img2}" alt="F2" class="mini-preview-img" loading="lazy">` : '<div class="mini-preview-empty">F2</div>'}
          </div>
          <div class="mini-preview-cell">
            ${img3 ? `<img src="${img3}" alt="F3" class="mini-preview-img" loading="lazy">` : '<div class="mini-preview-empty">F3</div>'}
          </div>
          <div class="mini-preview-cell">
            ${img4 ? `<img src="${img4}" alt="F4" class="mini-preview-img" loading="lazy">` : '<div class="mini-preview-empty">F4</div>'}
          </div>
        </div>

        <div class="card-footer">
          <span class="card-date">${dateStr}</span>
          <div class="card-actions-row">
            <button class="btn-card-action btn-card-view" data-id="${item.id}" type="button">Chi tiết</button>
            <button class="btn-card-action btn-card-edit" data-id="${item.id}" type="button">Sửa</button>
            <button class="btn-card-action danger btn-card-del" data-id="${item.id}" type="button">Xóa</button>
          </div>
        </div>
      `;

      // Click card body to view details
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-card-action')) return; // Handle buttons separately
        openDetailView(item.id);
      });

      // Actions
      card.querySelector('.btn-card-view').addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailView(item.id);
      });

      card.querySelector('.btn-card-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditorView(item.id);
      });

      card.querySelector('.btn-card-del').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeletePlaybook(item.id, item.title);
      });

      playbooksContainer.appendChild(card);
    });
  }

  // =========================================================================
  // VIEW 2: DETAIL VIEW
  // =========================================================================
  async function openDetailView(id) {
    try {
      const item = await window.playbookDB.getById(id);
      if (!item) {
        showToast('Không tìm thấy mô hình này', 'error');
        showView('list');
        return;
      }

      currentDetailPlaybook = item;

      // Header Meta
      detailTitle.textContent = item.title || 'Mô hình không tên';

      // Pair Badge
      detailBadgePair.textContent = item.pair || 'XAU';
      detailBadgePair.className = `badge badge-pair ${(item.pair || '').toLowerCase()}`;

      // Position Badge
      detailBadgePosition.textContent = item.position || 'BUY';
      detailBadgePosition.className = `badge badge-pos ${(item.position || '').toLowerCase()}`;

      // Outcome Badge
      detailBadgeOutcome.textContent = item.outcome || 'Thắng';
      detailBadgeOutcome.className = `badge badge-outcome ${getOutcomeClass(item.outcome)}`;

      // Date
      detailDate.textContent = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : '';

      // Populate 4 Frames
      const frames = item.frames || {};
      for (let i = 1; i <= 4; i++) {
        const key = `f${i}`;
        const frameData = frames[key] || {};

        // Badge TF
        const tfBadge = document.getElementById(`detail-tf-${i}`);
        if (tfBadge) tfBadge.textContent = frameData.timeframe || '-';

        // Image
        const img = document.getElementById(`detail-img-${i}`);
        const placeholder = document.querySelector(`#detail-card-${i} .tf-img-empty-placeholder`);

        if (frameData.image) {
          img.src = frameData.image;
          img.classList.remove('hidden');
          if (placeholder) placeholder.classList.add('hidden');
        } else {
          img.src = '';
          img.classList.add('hidden');
          if (placeholder) placeholder.classList.remove('hidden');
        }

        // Note
        const noteEl = document.getElementById(`detail-note-${i}`);
        if (noteEl) {
          noteEl.textContent = frameData.note || 'Không có ghi chú cho khung này.';
        }
      }

      // Reset mobile active tab to 1
      setActiveMobileFrame(1);

      showView('detail');
    } catch (err) {
      console.error('Lỗi mở chi tiết mô hình:', err);
    }
  }

  function setActiveMobileFrame(index) {
    activeMobileFrameIndex = index;
    const tabBtns = mobileTabsBar.querySelectorAll('.m-tab-btn');
    tabBtns.forEach(btn => {
      const btnIndex = parseInt(btn.dataset.frameIndex, 10);
      if (btnIndex === index) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        btn.classList.remove('active');
      }
    });

    // Scroll carousel to target card if on mobile
    if (window.innerWidth < 768) {
      const targetCard = document.getElementById(`detail-card-${index}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    }
  }

  // =========================================================================
  // VIEW 3: EDITOR VIEW (CREATE / EDIT)
  // =========================================================================
  async function openEditorView(id = null) {
    editorForm.reset();

    // Reset previews and hidden image data
    for (let i = 1; i <= 4; i++) {
      clearImagePreview(i);
      document.getElementById(`edit-note-${i}`).value = '';
    }

    if (id) {
      // EDIT MODE
      const item = await window.playbookDB.getById(id);
      if (!item) {
        showToast('Không tìm thấy mô hình để chỉnh sửa', 'error');
        return;
      }

      editorHeading.textContent = 'Chỉnh Sửa Mô Hình';
      editId.value = item.id;
      editTitle.value = item.title || '';
      editPair.value = item.pair || 'XAU';
      editPosition.value = item.position || 'BUY';
      editOutcome.value = item.outcome || 'Thắng';

      const frames = item.frames || {};
      for (let i = 1; i <= 4; i++) {
        const frameData = frames[`f${i}`] || {};
        if (frameData.timeframe) {
          document.getElementById(`edit-tf-${i}`).value = frameData.timeframe;
        }
        if (frameData.note) {
          document.getElementById(`edit-note-${i}`).value = frameData.note;
        }
        if (frameData.image) {
          setImagePreview(i, frameData.image);
        }
      }
    } else {
      // CREATE MODE
      editorHeading.textContent = 'Thêm Mới Mô Hình';
      editId.value = '';
      editTitle.value = '';
      editPair.value = 'XAU';
      editPosition.value = 'BUY';
      editOutcome.value = 'Thắng';

      // Default Swing preset
      applyPreset('swing');
    }

    showView('editor');
  }

  function applyPreset(presetType) {
    const presets = {
      swing: ['1D', 'H4', 'H1', 'M15'],
      intraday: ['H4', 'H1', 'M15', 'M5'],
      scalp: ['H1', 'M30', 'M15', 'M5']
    };

    const tfList = presets[presetType];
    if (tfList) {
      for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`edit-tf-${i}`);
        if (select) select.value = tfList[i - 1];
      }
      showToast(`Đã áp dụng bộ khung ${presetType.toUpperCase()}`, 'info');
    }
  }

  // Handle Form Submission
  async function handleEditorSubmit(e) {
    e.preventDefault();

    const title = editTitle.value.trim();
    if (!title) {
      showToast('Vui lòng nhập tiêu đề mẫu', 'error');
      editTitle.focus();
      return;
    }

    const playbook = {
      id: editId.value || null,
      title: title,
      pair: editPair.value,
      position: editPosition.value,
      outcome: editOutcome.value,
      frames: {
        f1: {
          role: 'Xu Hướng',
          timeframe: document.getElementById('edit-tf-1').value,
          image: document.getElementById('img-data-1').value || '',
          note: document.getElementById('edit-note-1').value.trim()
        },
        f2: {
          role: 'Mô Hình',
          timeframe: document.getElementById('edit-tf-2').value,
          image: document.getElementById('img-data-2').value || '',
          note: document.getElementById('edit-note-2').value.trim()
        },
        f3: {
          role: 'Liền Kề',
          timeframe: document.getElementById('edit-tf-3').value,
          image: document.getElementById('img-data-3').value || '',
          note: document.getElementById('edit-note-3').value.trim()
        },
        f4: {
          role: 'Cấu Trúc',
          timeframe: document.getElementById('edit-tf-4').value,
          image: document.getElementById('img-data-4').value || '',
          note: document.getElementById('edit-note-4').value.trim()
        }
      }
    };

    try {
      const saved = await window.playbookDB.save(playbook);
      if (window.cloudSync) {
        window.cloudSync.pushPlaybook(saved);
      }
      showToast('Đã lưu mô hình thành công!', 'success');
      openDetailView(saved.id);
    } catch (err) {
      console.error('Lỗi khi lưu mô hình:', err);
      showToast('Lỗi khi lưu vào cơ sở dữ liệu', 'error');
    }
  }

  // =========================================================================
  // IMAGE HANDLING: PASTE (CTRL+V), UPLOAD, PREVIEW
  // =========================================================================
  function setImagePreview(frameIndex, dataUrl) {
    const dropzone = document.getElementById(`dropzone-${frameIndex}`);
    const idleState = document.getElementById(`upload-idle-${frameIndex}`);
    const previewState = document.getElementById(`upload-preview-${frameIndex}`);
    const previewImg = document.getElementById(`preview-img-${frameIndex}`);
    const hiddenInput = document.getElementById(`img-data-${frameIndex}`);

    hiddenInput.value = dataUrl;
    previewImg.src = dataUrl;

    idleState.classList.add('hidden');
    previewState.classList.remove('hidden');
  }

  function clearImagePreview(frameIndex) {
    const idleState = document.getElementById(`upload-idle-${frameIndex}`);
    const previewState = document.getElementById(`upload-preview-${frameIndex}`);
    const previewImg = document.getElementById(`preview-img-${frameIndex}`);
    const hiddenInput = document.getElementById(`img-data-${frameIndex}`);
    const fileInput = document.getElementById(`file-input-${frameIndex}`);

    hiddenInput.value = '';
    previewImg.src = '';
    if (fileInput) fileInput.value = '';

    previewState.classList.add('hidden');
    idleState.classList.remove('hidden');
  }

  function handleImageFile(file, frameIndex) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Tệp được chọn không phải là hình ảnh', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(frameIndex, e.target.result);
      showToast(`Đã nạp ảnh cho Khung ${frameIndex}`, 'success');
    };
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // LIGHTBOX ZOOM MODAL
  // =========================================================================
  function openLightbox(src, roleTitle, timeframe) {
    if (!src) return;

    lightboxImg.src = src;
    lightboxTitle.textContent = roleTitle || 'Biểu đồ chi tiết';
    lightboxBadge.textContent = timeframe || '';

    currentZoom = 1;
    zoomTranslateX = 0;
    zoomTranslateY = 0;
    updateLightboxTransform();

    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.add('hidden');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  function updateLightboxTransform() {
    lightboxImg.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(${currentZoom})`;
    if (currentZoom > 1) {
      lightboxImg.classList.add('zoomed');
    } else {
      lightboxImg.classList.remove('zoomed');
    }
  }

  // =========================================================================
  // SWIPE DETECTION (MOBILE GESTURES)
  // =========================================================================
  function bindSwipeEvents() {
    let touchStartX = 0;
    let touchStartY = 0;

    detailFramesGrid.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    detailFramesGrid.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: true });
  }

  function handleSwipeGesture(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Must be predominantly horizontal and at least 45px
    if (Math.abs(diffX) > Math.abs(diffY) * 1.3 && Math.abs(diffX) > 45) {
      if (diffX < 0) {
        // Swiped Left -> Next frame
        if (activeMobileFrameIndex < 4) {
          setActiveMobileFrame(activeMobileFrameIndex + 1);
        }
      } else {
        // Swiped Right -> Previous frame
        if (activeMobileFrameIndex > 1) {
          setActiveMobileFrame(activeMobileFrameIndex - 1);
        }
      }
    }
  }

  // =========================================================================
  // GLOBAL EVENT BINDINGS
  // =========================================================================
  function bindGlobalEvents() {
    // Navigation
    btnBrandHome.addEventListener('click', () => showView('list'));
    btnHeaderAdd.addEventListener('click', () => openEditorView(null));
    btnDetailBack.addEventListener('click', () => showView('list'));

    // Empty state buttons
    document.getElementById('btn-empty-add').addEventListener('click', () => openEditorView(null));

    // Search and Filters
    filterSearch.addEventListener('input', () => {
      btnClearSearch.classList.toggle('hidden', !filterSearch.value);
      applyFilters();
    });

    btnClearSearch.addEventListener('click', () => {
      filterSearch.value = '';
      btnClearSearch.classList.add('hidden');
      applyFilters();
    });

    filterPair.addEventListener('change', applyFilters);
    filterPosition.addEventListener('change', applyFilters);
    filterOutcome.addEventListener('change', applyFilters);

    // More dropdown
    btnMoreMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMore.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      dropdownMore.classList.add('hidden');
    });

    // Cloud Sync Buttons
    const btnCloudSync = document.getElementById('btn-cloud-sync');
    if (btnCloudSync) {
      btnCloudSync.addEventListener('click', async () => {
        showToast('Đang kiểm tra và đồng bộ Firebase Cloud...', 'info');
        if (window.cloudSync) {
          await window.cloudSync.syncAll();
          showToast('Đã hoàn tất đồng bộ Cloud!', 'success');
        }
      });
    }

    const btnActionSyncNow = document.getElementById('btn-action-sync-now');
    if (btnActionSyncNow) {
      btnActionSyncNow.addEventListener('click', async () => {
        dropdownMore.classList.add('hidden');
        showToast('Đang đồng bộ dữ liệu đám mây...', 'info');
        if (window.cloudSync) {
          await window.cloudSync.syncAll();
          showToast('Đã hoàn tất đồng bộ Cloud!', 'success');
        }
      });
    }

    // Export JSON
    btnActionExport.addEventListener('click', exportBackupData);

    // Import JSON
    inputImportFile.addEventListener('change', importBackupData);

    // Clear All Data
    btnActionClearAll.addEventListener('click', clearAllPlaybooks);

    // Detail View Actions
    btnDetailEdit.addEventListener('click', () => {
      if (currentDetailPlaybook) openEditorView(currentDetailPlaybook.id);
    });

    btnDetailDelete.addEventListener('click', () => {
      if (currentDetailPlaybook) {
        confirmDeletePlaybook(currentDetailPlaybook.id, currentDetailPlaybook.title);
      }
    });

    // Mobile Tabs Click
    mobileTabsBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.m-tab-btn');
      if (btn) {
        const index = parseInt(btn.dataset.frameIndex, 10);
        setActiveMobileFrame(index);
      }
    });

    // Click frame image in Detail View to zoom in lightbox
    for (let i = 1; i <= 4; i++) {
      const box = document.getElementById(`detail-img-box-${i}`);
      if (box) {
        box.addEventListener('click', () => {
          const img = document.getElementById(`detail-img-${i}`);
          const tf = document.getElementById(`detail-tf-${i}`).textContent;
          const roleLabel = document.querySelector(`#detail-card-${i} .tf-role-label`).textContent;
          if (img && img.src && !img.classList.contains('hidden')) {
            openLightbox(img.src, `${roleLabel} - ${detailTitle.textContent}`, tf);
          }
        });
      }
    }
  }

  // =========================================================================
  // EDITOR EVENT BINDINGS
  // =========================================================================
  function bindEditorEvents() {
    editorForm.addEventListener('submit', handleEditorSubmit);
    btnEditorCancel.addEventListener('click', () => {
      if (currentDetailPlaybook) showView('detail');
      else showView('list');
    });
    btnEditorCancelBottom.addEventListener('click', () => {
      if (currentDetailPlaybook) showView('detail');
      else showView('list');
    });

    // Preset buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        applyPreset(btn.dataset.preset);
      });
    });

    // Setup 4 Upload Dropzones
    for (let i = 1; i <= 4; i++) {
      setupDropzone(i);
    }

    // Global Paste Event Listener (for Desktop convenience)
    document.addEventListener('paste', (e) => {
      // Only process when in Editor view
      if (!viewEditor.classList.contains('active')) return;

      // If user is focused on a textarea or input, allow normal text paste
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && activeEl.type === 'text'))) {
        return;
      }

      // Check for image data in clipboard
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let imageFile = null;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          imageFile = item.getAsFile();
          break;
        }
      }

      if (imageFile) {
        e.preventDefault();
        // Determine target frame: check if user has focused a dropzone
        let targetFrame = 1;
        const focusedDropzone = document.querySelector('.upload-dropzone:focus, .upload-dropzone:focus-within');
        if (focusedDropzone) {
          targetFrame = parseInt(focusedDropzone.dataset.frame || focusedDropzone.id.replace('dropzone-', ''), 10);
        } else {
          // If no dropzone focused, fill the first empty frame
          for (let f = 1; f <= 4; f++) {
            if (!document.getElementById(`img-data-${f}`).value) {
              targetFrame = f;
              break;
            }
          }
        }

        handleImageFile(imageFile, targetFrame);
      }
    });
  }

  function setupDropzone(frameIndex) {
    const dropzone = document.getElementById(`dropzone-${frameIndex}`);
    const fileInput = document.getElementById(`file-input-${frameIndex}`);

    // Click trigger for file input button
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.btn-file-pick') || e.target.closest('.btn-change-img')) {
        fileInput.click();
      } else if (e.target.closest('.btn-remove-img')) {
        clearImagePreview(frameIndex);
      } else {
        // Focus the dropzone so Ctrl+V targets it
        dropzone.focus();
      }
    });

    // File Input change
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleImageFile(fileInput.files[0], frameIndex);
      }
    });

    // Drag and Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFile(e.dataTransfer.files[0], frameIndex);
      }
    });

    // Dropzone Paste Event
    dropzone.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          e.preventDefault();
          e.stopPropagation();
          const file = item.getAsFile();
          handleImageFile(file, frameIndex);
          break;
        }
      }
    });
  }

  // =========================================================================
  // LIGHTBOX CONTROLS BINDING
  // =========================================================================
  function bindLightboxEvents() {
    btnLightboxClose.addEventListener('click', closeLightbox);

    btnZoomIn.addEventListener('click', () => {
      currentZoom = Math.min(currentZoom + 0.3, 4);
      updateLightboxTransform();
    });

    btnZoomOut.addEventListener('click', () => {
      currentZoom = Math.max(currentZoom - 0.3, 0.5);
      updateLightboxTransform();
    });

    btnZoomReset.addEventListener('click', () => {
      currentZoom = 1;
      zoomTranslateX = 0;
      zoomTranslateY = 0;
      updateLightboxTransform();
    });

    // Double click to toggle 100% / 200%
    lightboxImg.addEventListener('dblclick', () => {
      if (currentZoom > 1) {
        currentZoom = 1;
        zoomTranslateX = 0;
        zoomTranslateY = 0;
      } else {
        currentZoom = 2;
      }
      updateLightboxTransform();
    });

    // Drag to pan when zoomed
    lightboxImg.addEventListener('mousedown', (e) => {
      if (currentZoom > 1) {
        isDraggingZoom = true;
        zoomStartX = e.clientX - zoomTranslateX;
        zoomStartY = e.clientY - zoomTranslateY;
        lightboxImg.classList.add('dragging');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingZoom) {
        zoomTranslateX = e.clientX - zoomStartX;
        zoomTranslateY = e.clientY - zoomStartY;
        updateLightboxTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingZoom) {
        isDraggingZoom = false;
        lightboxImg.classList.remove('dragging');
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !lightboxModal.classList.contains('hidden')) {
        closeLightbox();
      }
    });
  }

  // =========================================================================
  // BACKUP & RESTORE / EXPORT & IMPORT
  // =========================================================================
  async function exportBackupData() {
    try {
      const data = await window.playbookDB.exportAll();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const timeStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `trading_playbook_backup_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Đã xuất file sao lưu thành công', 'success');
    } catch (err) {
      console.error('Lỗi xuất dữ liệu:', err);
      showToast('Lỗi khi xuất file sao lưu', 'error');
    }
  }

  async function importBackupData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        const count = await window.playbookDB.importAll(jsonData, false);
        if (window.cloudSync && Array.isArray(jsonData.data)) {
          for (const item of jsonData.data) {
            window.cloudSync.pushPlaybook(item);
          }
        }
        showToast(`Đã nhập thành công ${count} mô hình!`, 'success');
        inputImportFile.value = '';
        await loadAndRenderList();
        showView('list');
      } catch (err) {
        console.error('Lỗi nạp file:', err);
        showToast('File sao lưu không hợp lệ', 'error');
      }
    };
    reader.readAsText(file);
  }

  async function clearAllPlaybooks() {
    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ mô hình không? Thao tác này không thể hoàn tác.')) {
      await window.playbookDB.clearAll();
      if (window.cloudSync) {
        await window.cloudSync.clearAll();
      }
      showToast('Đã xóa tất cả dữ liệu', 'info');
      await loadAndRenderList();
      showView('list');
    }
  }

  async function confirmDeletePlaybook(id, title) {
    if (confirm(`Bạn có chắc muốn xóa mô hình "${title || 'này'}" không?`)) {
      await window.playbookDB.delete(id);
      if (window.cloudSync) {
        window.cloudSync.deletePlaybook(id);
      }
      showToast('Đã xóa mô hình', 'info');
      if (currentDetailPlaybook && currentDetailPlaybook.id === id) {
        currentDetailPlaybook = null;
        showView('list');
      } else {
        loadAndRenderList();
      }
    }
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================
  function getOutcomeClass(outcome) {
    switch (outcome) {
      case 'Thắng': return 'outcome-win';
      case 'Thua': return 'outcome-loss';
      case 'Hòa': return 'outcome-be';
      case 'Quan sát': return 'outcome-obs';
      default: return 'outcome-win';
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Boot on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);
})();
