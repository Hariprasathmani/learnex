import './auth-guard.js';
import { supabase, showMessage, escapeHtml } from './supabase.js';
import { renderSidebar } from './nav.js';

let pendingFiles = [];     // New files to upload
let existingFiles = [];    // Existing files on the note
let filesToDelete = [];    // Existing files marked for deletion

async function initNotes() {
  renderSidebar('notes');
  await fetchNotes();
  bindModalEvents();
}

async function fetchNotes() {
  const gridEl = document.getElementById('notes-grid');
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select(`
      *,
      note_files (id, file_name, file_url, file_type, file_size)
    `)
    .eq('user_id', window.currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Notes error:', error);
    gridEl.innerHTML = `<p class="text-danger" style="color:var(--danger)">Failed to load notes: ${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!notes || notes.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-title">No notes yet</div>
        <div class="empty-sub">Click "+ Create Note" to get started</div>
      </div>
    `;
    return;
  }

  gridEl.innerHTML = notes.map(note => {
    const fileCount = note.note_files?.length || 0;
    const fileBadge = fileCount > 0 
      ? `<span class="file-badge">📎 ${fileCount} file${fileCount > 1 ? 's' : ''}</span>` 
      : '';
      
    let filesPanel = '';
    if (fileCount > 0) {
      filesPanel = `<div class="files-panel" style="margin-top: 12px; font-size: 0.85rem;">
        ${note.note_files.map(f => `
          <div class="file-entry" style="margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            📎 <a href="#" class="preview-trigger" data-url="${escapeHtml(f.file_url)}" data-name="${escapeHtml(f.file_name)}" data-type="${escapeHtml(f.file_type || '')}" style="color: var(--accent); text-decoration: none;">${escapeHtml(f.file_name)}</a>
          </div>
        `).join('')}
      </div>`;
    }

    return `
      <div class="note-card">
        <div class="note-card-title">${escapeHtml(note.title)}</div>
        <div class="note-card-date">${new Date(note.created_at).toLocaleString()}</div>
        <div class="note-card-content" style="max-height: 80px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${escapeHtml(note.content || '')}</div>
        ${filesPanel}
        <div class="note-card-actions" style="margin-top: 15px;">
          <button class="btn btn-primary btn-sm" onclick="viewNote('${note.id}')">View</button>
          <button class="btn btn-ghost btn-sm" onclick="editNote('${note.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteNote('${note.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Global functions for inline onclick handlers
window.deleteNote = async (id) => {
  if (!confirm('Are you sure you want to delete this note?')) return;
  
  // Note: note_files deleted via ON DELETE CASCADE in postgres
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) {
    showMessage('notes-message', 'Failed to delete note', 'error');
  } else {
    fetchNotes();
  }
};

window.editNote = async (id) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_files(*)')
    .eq('id', id)
    .single();

  if (error) return;

  document.getElementById('note-id').value = id;
  document.getElementById('note-title-input').value = data.title;
  document.getElementById('note-content-input').value = data.content || '';
  
  existingFiles = data.note_files || [];
  pendingFiles = [];
  filesToDelete = [];
  
  document.getElementById('note-modal-title').textContent = 'Edit Note';
  renderFilePreviews();
  openModal();
};

window.viewNote = async (id) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_files(*)')
    .eq('id', id)
    .single();

  if (error) return;

  document.getElementById('view-modal-title').textContent = data.title;
  document.getElementById('view-modal-date').textContent = new Date(data.created_at).toLocaleString();
  document.getElementById('view-modal-content').textContent = data.content || 'No content written.';
  
  const filesWrap = document.getElementById('view-modal-attachments-wrap');
  const filesContainer = document.getElementById('view-modal-files');
  
  if (data.note_files && data.note_files.length > 0) {
    filesWrap.style.display = 'block';
    filesContainer.innerHTML = data.note_files.map(f => {
      let icon = f.file_type?.startsWith('image/') && f.file_url 
        ? `<img src="${f.file_url}" alt="preview">` 
        : `<div class="file-preview-icon">📄</div>`;
      return `
        <a href="#" class="file-preview-item preview-trigger" data-url="${escapeHtml(f.file_url)}" data-name="${escapeHtml(f.file_name)}" data-type="${escapeHtml(f.file_type || '')}" style="text-decoration:none;">
          ${icon}
          <div class="file-preview-name" title="${escapeHtml(f.file_name)}">${escapeHtml(f.file_name)}</div>
        </a>
      `;
    }).join('');
  } else {
    filesWrap.style.display = 'none';
    filesContainer.innerHTML = '';
  }
  
  document.getElementById('view-modal-wrap').classList.add('open');
};
window.previewFile = (url, name, type) => {
  const modalWrap = document.getElementById('preview-modal-wrap');
  const titleEl = document.getElementById('preview-modal-title');
  const bodyEl = document.getElementById('preview-modal-body');
  const downloadBtn = document.getElementById('preview-modal-download');
  
  titleEl.textContent = name;
  downloadBtn.href = url;
  
  let viewerHtml = '';
  if (type && type.startsWith('image/')) {
    viewerHtml = `<img src="${escapeHtml(url)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
  } else if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    viewerHtml = `<iframe src="${escapeHtml(url)}#toolbar=0" style="width: 100%; height: 100%; border: none;"></iframe>`;
  } else {
    viewerHtml = `<div style="color: white; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 20px;">📄</div>
      <p style="margin-bottom: 20px;">Preview not supported for this file type.</p>
      <a href="${escapeHtml(url)}" target="_blank" class="btn btn-primary">Download File</a>
    </div>`;
  }
  
  bodyEl.innerHTML = viewerHtml;
  modalWrap.classList.add('open');
};

/* Modal and File UI */
const modal = document.getElementById('note-modal-wrap');
const btnCreate = document.getElementById('btn-create-note');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel-note');
const form = document.getElementById('note-form');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewGrid = document.getElementById('file-preview-grid');

function resetModal() {
  document.getElementById('note-id').value = '';
  document.getElementById('note-title-input').value = '';
  document.getElementById('note-content-input').value = '';
  pendingFiles = [];
  existingFiles = [];
  filesToDelete = [];
  renderFilePreviews();
}

function openModal() { modal.classList.add('open'); }
function closeModal() { modal.classList.remove('open'); resetModal(); }

btnCreate.addEventListener('click', () => { resetModal(); document.getElementById('note-modal-title').textContent = 'Create Note'; openModal(); });
btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

// View modal specific closes
document.getElementById('btn-close-view-modal').addEventListener('click', () => {
  document.getElementById('view-modal-wrap').classList.remove('open');
});
document.getElementById('btn-done-view').addEventListener('click', () => {
  document.getElementById('view-modal-wrap').classList.remove('open');
});

document.getElementById('btn-close-preview-modal').addEventListener('click', () => {
  document.getElementById('preview-modal-wrap').classList.remove('open');
  document.getElementById('preview-modal-body').innerHTML = ''; // clear iframe/image
});

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.preview-trigger');
  if (trigger) {
    e.preventDefault();
    const { url, name, type } = trigger.dataset;
    if (url) window.previewFile(url, name, type);
  }
});

// Drag and drop
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFiles(fileInput.files);
  fileInput.value = ''; // Reset
});

function handleFiles(files) {
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(`File ${file.name} is too large (>10MB)`);
      continue;
    }
    file.previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    pendingFiles.push(file);
  }
  renderFilePreviews();
}

function removePendingFile(index) {
  pendingFiles.splice(index, 1);
  renderFilePreviews();
}

function removeExistingFile(index) {
  filesToDelete.push(existingFiles[index].id); // Track for DB deletion
  existingFiles.splice(index, 1);
  renderFilePreviews();
}

window.onRemovePending = removePendingFile;
window.onRemoveExisting = removeExistingFile;

function renderFilePreviews() {
  const totalFiles = pendingFiles.length + existingFiles.length;
  document.getElementById('file-count-label').textContent = totalFiles;
  
  let html = '';
  
  // Existing files
  existingFiles.forEach((file, index) => {
    let icon = file.file_type?.startsWith('image/') && file.file_url 
      ? `<img src="${file.file_url}" alt="preview">` 
      : `<div class="file-preview-icon">📄</div>`;
      
    html += `
      <div class="file-preview-item">
        ${icon}
        <div class="file-preview-name" title="${file.file_name}">${escapeHtml(file.file_name)}</div>
        <button type="button" class="file-remove-btn" onclick="onRemoveExisting(${index})">×</button>
      </div>
    `;
  });

  // Pending files
  pendingFiles.forEach((file, index) => {
    let icon = file.previewUrl 
      ? `<img src="${file.previewUrl}" alt="preview">` 
      : `<div class="file-preview-icon">📄</div>`;
      
    html += `
      <div class="file-preview-item">
        ${icon}
        <div class="file-preview-name" title="${file.name}">${escapeHtml(file.name)}</div>
        <div class="file-preview-size">${(file.size/1024/1024).toFixed(1)}MB</div>
        <button type="button" class="file-remove-btn" onclick="onRemovePending(${index})">×</button>
      </div>
    `;
  });

  previewGrid.innerHTML = html;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btnSave = document.getElementById('btn-save-note');
  btnSave.disabled = true;
  btnSave.textContent = 'Saving...';

  const title = document.getElementById('note-title-input').value;
  const content = document.getElementById('note-content-input').value;
  const noteId = document.getElementById('note-id').value;
  
  try {
    let finalNoteId = noteId;

    if (noteId) {
      // Update info
      const { error } = await supabase.from('notes').update({ title, content, updated_at: new Date() }).eq('id', noteId);
      if (error) throw error;
      
      // Delete requested files
      if (filesToDelete.length > 0) {
        await supabase.from('note_files').delete().in('id', filesToDelete);
      }
    } else {
      // Create new
      const { data, error } = await supabase.from('notes').insert({
        user_id: window.currentUser.id,
        title, content
      }).select().single();
      if (error) throw error;
      finalNoteId = data.id;
    }

    // Upload pending files
    for (const file of pendingFiles) {
      const path = `${window.currentUser.id}/${finalNoteId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('note-files')
        .upload(path, file);
        
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('note-files').getPublicUrl(path);
        await supabase.from('note_files').insert({
          note_id: finalNoteId,
          user_id: window.currentUser.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size
        });
      } else {
        console.error('Storage upload error:', uploadErr);
        throw new Error('Could not upload file "' + file.name + '": Make sure your "note-files" storage bucket is created and public in Supabase.');
      }
    }

    closeModal();
    fetchNotes();
  } catch(err) {
    console.error('Save error:', err);
    showMessage('notes-message', err.message || 'Error saving note', 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Save Note';
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotes);
} else {
  initNotes();
}
