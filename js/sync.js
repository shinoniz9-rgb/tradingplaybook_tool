/**
 * Trading Playbook - Firebase Realtime Cloud Sync Engine
 * Server: Singapore (asia-southeast1)
 * Multi-device instant synchronization (PC <-> iPad <-> iPhone)
 */

const FIREBASE_DB_URL = 'https://aihoctap-4722c-default-rtdb.asia-southeast1.firebasedatabase.app';
const FIREBASE_COLLECTION = 'tradingplaybook/playbooks';

class CloudSyncEngine {
  constructor() {
    this.activeSse = null;
    this.isSyncing = false;
    this.status = 'idle'; // 'synced' | 'syncing' | 'error' | 'offline'
    this.onDataChangeCallback = null;
    this.suppressOutbound = false;
  }

  updateStatusUi(status, detail) {
    this.status = status;
    const btn = document.getElementById('btn-cloud-sync');
    const label = document.getElementById('sync-status-label');
    if (!btn || !label) return;

    btn.classList.remove('synced', 'syncing', 'error', 'offline');

    if (status === 'synced') {
      btn.classList.add('synced');
      label.textContent = detail || '☁️ Đã đồng bộ Cloud';
    } else if (status === 'syncing') {
      btn.classList.add('syncing');
      label.textContent = detail || '⏳ Đang đồng bộ...';
    } else if (status === 'error') {
      btn.classList.add('error');
      label.textContent = detail || '⚠️ Lỗi kết nối Cloud';
    } else if (status === 'offline') {
      btn.classList.add('offline');
      label.textContent = detail || '⚡ Ngoại tuyến (Đã lưu máy)';
    }
  }

  async init(onDataChange) {
    this.onDataChangeCallback = onDataChange;

    window.addEventListener('online', () => {
      this.updateStatusUi('syncing', 'Đã kết nối lại...');
      this.syncAll();
      this.initRealtimeListener();
    });

    window.addEventListener('offline', () => {
      this.updateStatusUi('offline');
    });

    // 1. Tải và đồng bộ ban đầu với Firebase Cloud
    await this.syncAll();

    // 2. Khởi tạo SSE lắng nghe trực tiếp để cập nhật ngay khi thiết bị khác thay đổi
    this.initRealtimeListener();
  }

  // Tải toàn bộ dữ liệu từ Firebase về và cập nhật vào IndexedDB
  async syncAll() {
    if (!navigator.onLine) {
      this.updateStatusUi('offline');
      return;
    }

    try {
      this.updateStatusUi('syncing', 'Đang nạp dữ liệu Cloud...');
      const res = await fetch(`${FIREBASE_DB_URL}/${FIREBASE_COLLECTION}.json`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const cloudPlaybooks = await res.json();
      this.suppressOutbound = true;

      if (!cloudPlaybooks || Object.keys(cloudPlaybooks).length === 0) {
        // Cloud trống - Kiểm tra nếu local có mô hình hợp lệ thì đẩy lên
        const localList = await window.playbookDB.getAll();
        if (localList.length > 0) {
          for (const item of localList) {
            await this.pushPlaybook(item);
          }
        }
      } else {
        // Cloud có dữ liệu - Đồng bộ vào IndexedDB
        const cloudItems = Object.values(cloudPlaybooks).filter(p => p && p.id);
        const cloudIds = new Set(cloudItems.map(p => p.id));
        const localItems = await window.playbookDB.getAll();

        // Xóa các mục local không tồn tại trên cloud
        for (const local of localItems) {
          if (!cloudIds.has(local.id)) {
            await window.playbookDB.delete(local.id);
          }
        }

        // Lưu hoặc cập nhật các mục từ cloud
        for (const item of cloudItems) {
          await window.playbookDB.save(item);
        }
      }

      this.suppressOutbound = false;
      this.updateStatusUi('synced', '☁️ Đã đồng bộ Cloud');

      if (this.onDataChangeCallback) {
        this.onDataChangeCallback();
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ Firebase:', err);
      this.suppressOutbound = false;
      this.updateStatusUi('error', 'Chưa thể kết nối Cloud');
    }
  }

  // Đẩy 1 playbook lên Firebase Cloud
  async pushPlaybook(playbook) {
    if (this.suppressOutbound || !playbook || !playbook.id) return;
    try {
      this.updateStatusUi('syncing', 'Đang lưu lên Cloud...');
      const url = `${FIREBASE_DB_URL}/${FIREBASE_COLLECTION}/${playbook.id}.json`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playbook)
      });
      if (res.ok) {
        this.updateStatusUi('synced', '☁️ Đã lưu lên Cloud');
      } else {
        this.updateStatusUi('error', 'Lỗi lưu Cloud');
      }
    } catch (err) {
      console.warn('Lỗi push playbook lên Cloud:', err);
      this.updateStatusUi('offline');
    }
  }

  // Xóa 1 playbook khỏi Firebase Cloud
  async deletePlaybook(id) {
    if (this.suppressOutbound || !id) return;
    try {
      this.updateStatusUi('syncing', 'Đang xóa trên Cloud...');
      const url = `${FIREBASE_DB_URL}/${FIREBASE_COLLECTION}/${id}.json`;
      await fetch(url, { method: 'DELETE' });
      this.updateStatusUi('synced', '☁️ Đã đồng bộ Cloud');
    } catch (err) {
      console.warn('Lỗi xóa trên Cloud:', err);
    }
  }

  // Xóa toàn bộ dữ liệu trên Firebase Cloud
  async clearAll() {
    try {
      this.updateStatusUi('syncing', 'Đang dọn sạch Cloud...');
      const url = `${FIREBASE_DB_URL}/${FIREBASE_COLLECTION}.json`;
      await fetch(url, { method: 'DELETE' });
      this.updateStatusUi('synced', '☁️ Đã dọn sạch Cloud');
    } catch (err) {
      console.warn('Lỗi xóa toàn bộ trên Cloud:', err);
    }
  }

  // Lắng nghe cập nhật thời gian thực (SSE) để đa thiết bị tự cập nhật nhau
  initRealtimeListener() {
    if (this.activeSse) {
      try { this.activeSse.close(); } catch (e) {}
    }

    try {
      const sseUrl = `${FIREBASE_DB_URL}/${FIREBASE_COLLECTION}.json`;
      this.activeSse = new EventSource(sseUrl);

      this.activeSse.addEventListener('put', async (e) => {
        if (this.suppressOutbound) return;
        try {
          const payload = JSON.parse(e.data);
          if (!payload) return;

          this.suppressOutbound = true;

          if (payload.path === '/') {
            if (payload.data === null) {
              await window.playbookDB.clearAll();
            } else if (typeof payload.data === 'object') {
              await window.playbookDB.clearAll();
              for (const item of Object.values(payload.data)) {
                if (item && item.id) await window.playbookDB.save(item);
              }
            }
          } else {
            const id = payload.path.replace(/^\//, '').split('/')[0];
            if (id) {
              if (payload.data === null) {
                await window.playbookDB.delete(id);
              } else if (payload.path === `/${id}`) {
                await window.playbookDB.save(payload.data);
              } else {
                const itemRes = await fetch(`${FIREBASE_DB_URL}/${FIREBASE_COLLECTION}/${id}.json`);
                if (itemRes.ok) {
                  const itemData = await itemRes.json();
                  if (itemData) await window.playbookDB.save(itemData);
                }
              }
            }
          }

          this.suppressOutbound = false;
          this.updateStatusUi('synced', '☁️ Đã đồng bộ Cloud');
          if (this.onDataChangeCallback) {
            this.onDataChangeCallback();
          }
        } catch (err) {
          this.suppressOutbound = false;
          console.warn('Lỗi xử lý sự kiện SSE:', err);
        }
      });

      this.activeSse.onerror = () => {
        // Trình duyệt sẽ tự động kết nối lại
      };
    } catch (err) {
      console.warn('Không thể khởi tạo SSE Firebase:', err);
    }
  }
}

window.cloudSync = new CloudSyncEngine();
