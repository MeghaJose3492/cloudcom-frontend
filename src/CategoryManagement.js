import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from './Api';
import './CategoryManagement.css';

const PAGE_SIZE = 10;
const EMPTY_CATEGORY = { name: '', description: '', active: true };

async function request(url, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.error || 'The request could not be completed.');
  return result;
}

function Icon({ name, size = 17 }) {
  const paths = {
    edit: <><path d="m14.5 5.5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></>,
    trash: <><path d="M4 7h16M10 11v5m4-5v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8m-9 5v9" /></>,
    back: <path d="m14 18-6-6 6-6" />,
    next: <path d="m10 18 6-6-6-6" />,
    moon: <path d="M20 15.2A8.1 8.1 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function CategoryManagement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyCategoryId, setBusyCategoryId] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('categoryTheme') || 'light');

  useEffect(() => {
    localStorage.setItem('categoryTheme', theme);
  }, [theme]);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      request(Api.categoriesAll),
      request(Api.items).catch(() => null),
    ])
      .then(([categoryResults, itemResults]) => {
        if (!isCurrent) return;
        setCategories(Array.isArray(categoryResults) ? categoryResults : []);
        setItems(Array.isArray(itemResults) ? itemResults : null);
        setLoadError('');
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message || 'Could not load categories.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesName = !query || category.name?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' ? category.active : !category.active);
      return matchesName && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const pageCategories = filteredCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstCategory = filteredCategories.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastCategory = Math.min(currentPage * PAGE_SIZE, filteredCategories.length);

  function resetPage(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  function openAddForm() {
    setEditingCategory(null);
    setForm(EMPTY_CATEGORY);
    setFormError('');
    setModalOpen(true);
  }

  function openEditForm(category) {
    setEditingCategory(category);
    setForm({ name: category.name || '', description: category.description || '', active: Boolean(category.active) });
    setFormError('');
    setModalOpen(true);
  }

  async function saveCategory(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError('Category name is required.');
      return;
    }
    if (name.length > 100) {
      setFormError('Category name cannot exceed 100 characters.');
      return;
    }
    if (form.description.length > 200) {
      setFormError('Description cannot exceed 200 characters.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    const payload = { name, description: form.description.trim(), active: form.active };
    try {
      const savedCategory = await request(
        editingCategory ? `${Api.categoriesAll}/${editingCategory.id}` : Api.categoriesAll,
        { method: editingCategory ? 'PUT' : 'POST', body: JSON.stringify(payload) },
      );
      setCategories((current) => editingCategory
        ? current.map((category) => category.id === savedCategory.id ? savedCategory : category)
        : [savedCategory, ...current]);
      setModalOpen(false);
      setNotice({ type: 'success', text: editingCategory ? 'Category updated.' : 'Category created.' });
    } catch (error) {
      setFormError(error.message || 'Could not save this category.');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(category) {
    setBusyCategoryId(category.id);
    try {
      const updated = await request(`${Api.categoriesAll}/${category.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: category.name, description: category.description || '', active: !category.active }),
      });
      setCategories((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setNotice({ type: 'success', text: `${category.name} is now ${updated.active ? 'active' : 'inactive'}.` });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Could not update category status.' });
    } finally {
      setBusyCategoryId(null);
    }
  }

  const associatedItemCount = deletingCategory && items
    ? items.filter((item) => String(item.categoryId) === String(deletingCategory.id)).length
    : null;
  const canSafelyDelete = associatedItemCount === 0;

  async function deactivateCategory(category) {
    setBusyCategoryId(category.id);
    try {
      const updated = await request(`${Api.categoriesAll}/${category.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: category.name, description: category.description || '', active: false }),
      });
      setCategories((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setDeletingCategory(null);
      setNotice({ type: 'success', text: 'Category deactivated. Existing products and services were preserved.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Could not deactivate category.' });
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function deleteCategory() {
    if (!deletingCategory || !canSafelyDelete) return;
    setBusyCategoryId(deletingCategory.id);
    try {
      await request(`${Api.categoriesAll}/${deletingCategory.id}`, { method: 'DELETE' });
      setCategories((current) => current.map((category) => category.id === deletingCategory.id
        ? { ...category, active: false }
        : category));
      setDeletingCategory(null);
      setNotice({ type: 'success', text: 'Category deactivated. It is no longer available for new items.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Could not deactivate category.' });
      setDeletingCategory(null);
    } finally {
      setBusyCategoryId(null);
    }
  }

  return (
    <main className={`category-page${theme === 'dark' ? ' category-theme-dark' : ''}`}>
      <div className="category-layout">
        <header className="category-topbar">
          <a className="category-brand" href="/view" aria-label="Computer Sales and Service catalog">
            <span className="category-brand-mark">CS</span>
            <span><strong>Computer Sales &amp; Service</strong><small>MANAGEMENT SYSTEM</small></span>
          </a>
          <div className="category-header-actions">
            <button
              className="category-theme-toggle"
              type="button"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
            <button className="category-back-link" type="button" onClick={() => navigate('/view')}>
              <Icon name="back" size={17} /> Back to catalog
            </button>
          </div>
        </header>

        <section className="category-heading">
          <div>
            <p className="category-eyebrow">CATALOG CONFIGURATION</p>
            <h1>Category Management</h1>
            <p>Create and manage categories used for products and services.</p>
          </div>
          <button className="category-primary-button" type="button" onClick={openAddForm}>
            <Icon name="plus" size={17} /> Add Category
          </button>
        </section>

        {notice && <div className={`category-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</div>}

        <section className="category-panel" aria-label="Categories">
          <div className="category-toolbar">
            <label className="category-search">
              <Icon name="search" size={17} />
              <input type="search" value={search} placeholder="Search categories..." aria-label="Search categories" onChange={(event) => resetPage(setSearch, event.target.value)} />
            </label>
            <label className="category-filter">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => resetPage(setStatusFilter, event.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>

          {loadError && <div className="category-error-banner" role="alert">{loadError}</div>}

          <div className="category-table-frame" aria-busy={isLoading}>
            <table className="category-table">
              <thead><tr><th scope="col">Actions</th><th scope="col">Category</th><th scope="col">Description</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="category-table-message" colSpan="4">Loading categories...</td></tr>
                ) : pageCategories.map((category) => (
                  <tr key={category.id}>
                    <td data-label="Actions">
                      <div className="category-actions">
                        <button type="button" className="category-icon-button edit" title="Edit Category" aria-label={`Edit ${category.name}`} onClick={() => openEditForm(category)}><Icon name="edit" size={16} /></button>
                        <button type="button" className="category-icon-button delete" title="Delete Category" aria-label={`Delete ${category.name}`} onClick={() => setDeletingCategory(category)}><Icon name="trash" size={16} /></button>
                      </div>
                    </td>
                    <td data-label="Category"><strong className="category-title">{category.name}</strong></td>
                    <td data-label="Description"><span className="category-description">{category.description || '—'}</span></td>
                    <td data-label="Status">
                      <div className="category-status-cell">
                        <span className={`category-status-badge ${category.active ? 'active' : 'inactive'}`}><i />{category.active ? 'ACTIVE' : 'INACTIVE'}</span>
                        <button
                          type="button"
                          className={`category-status-toggle${category.active ? ' on' : ''}`}
                          role="switch"
                          aria-checked={category.active}
                          aria-label={`${category.active ? 'Deactivate' : 'Activate'} ${category.name}`}
                          disabled={busyCategoryId === category.id}
                          onClick={() => toggleCategory(category)}
                        ><i /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && pageCategories.length === 0 && (
                  <tr><td className="category-empty-cell" colSpan="4">
                    <div className="category-empty-state">
                      <span className="category-empty-icon"><Icon name="box" size={25} /></span>
                      <h2>No categories found</h2>
                      <p>Create a category to organize your products and services.</p>
                      <button className="category-primary-button" type="button" onClick={openAddForm}><Icon name="plus" size={16} /> Add Category</button>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="category-table-footer">
            <p>Showing <strong>{firstCategory}–{lastCategory}</strong> of <strong>{filteredCategories.length}</strong> categories</p>
            <nav className="category-pagination" aria-label="Category pages">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><Icon name="back" size={15} /> Previous</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button key={page} type="button" className={page === currentPage ? 'current' : ''} aria-current={page === currentPage ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>)}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next <Icon name="next" size={15} /></button>
            </nav>
          </footer>
        </section>
      </div>

      {modalOpen && (
        <div className="category-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <header className="category-modal-header">
              <div><p>CATEGORY DETAILS</p><h2 id="category-modal-title">{editingCategory ? 'Edit Category' : 'Add Category'}</h2></div>
              <button type="button" className="category-modal-close" aria-label="Close form" onClick={() => setModalOpen(false)}><Icon name="close" /></button>
            </header>
            <form className="category-form" onSubmit={saveCategory} noValidate>
              <label className="category-form-field">
                <span>Category Name <b>*</b></span>
                <input autoFocus maxLength="100" value={form.name} placeholder="Enter category name" aria-invalid={Boolean(formError && !form.name.trim())} onChange={(event) => { setForm({ ...form, name: event.target.value }); setFormError(''); }} />
              </label>
              <label className="category-form-field">
                <span>Category Description <small>Optional</small></span>
                <textarea rows="3" maxLength="200" value={form.description} placeholder="Enter a short description" onChange={(event) => { setForm({ ...form, description: event.target.value }); setFormError(''); }} />
                <small className="category-character-count">{form.description.length}/200</small>
              </label>
              <div className="category-active-block">
                <label className="category-active-toggle">
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                  <span className="category-switch-track"><i /></span>
                  <span className="category-active-label">{form.active ? 'Active' : 'Inactive'}</span>
                </label>
                <p>Active categories can be assigned to products and services.</p>
              </div>
              {formError && <p className="category-form-error" role="alert">{formError}</p>}
              <footer className="category-form-actions">
                <button type="button" className="category-cancel-button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="category-primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Save Category'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deletingCategory && (
        <div className="category-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeletingCategory(null); }}>
          <section className="category-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="category-delete-title" aria-describedby="category-delete-description">
            <span className="category-delete-icon"><Icon name="trash" size={20} /></span>
            <h2 id="category-delete-title">Delete this category?</h2>
            {associatedItemCount === null ? (
              <p id="category-delete-description">Products and services could not be checked. To protect existing records, you can deactivate this category instead.</p>
            ) : associatedItemCount > 0 ? (
              <p id="category-delete-description">This category is currently assigned to {associatedItemCount} existing {associatedItemCount === 1 ? 'product or service' : 'products or services'}. Deactivate it to prevent new assignments while preserving those records.</p>
            ) : (
              <p id="category-delete-description">This category is not currently assigned to any products or services. The backend will deactivate it rather than permanently remove the record.</p>
            )}
            <div className="category-confirm-actions">
              <button type="button" className="category-cancel-button" onClick={() => setDeletingCategory(null)}>Cancel</button>
              {canSafelyDelete ? (
                <button type="button" className="category-delete-button" disabled={busyCategoryId === deletingCategory.id} onClick={deleteCategory}>{busyCategoryId === deletingCategory.id ? 'Working...' : 'Delete'}</button>
              ) : (
                <button type="button" className="category-primary-button" disabled={busyCategoryId === deletingCategory.id || !deletingCategory.active} onClick={() => deactivateCategory(deletingCategory)}>{busyCategoryId === deletingCategory.id ? 'Working...' : 'Deactivate Category'}</button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default CategoryManagement;