import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Api, { createItemFormData, resolveImageUrl } from './Api';
import './View.css';

const PAGE_SIZE = 10;

async function apiRequest(url, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.error || 'The request could not be completed.');
  }
  return result;
}

function Icon({ name, size = 18 }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const shapes = {
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="m14.5 5.5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></>,
    trash: <><path d="M4 7h16M10 11v5m4-5v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    moon: <path d="M20 15.2A8.1 8.1 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8m-9 5v9" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    left: <path d="m14 18-6-6 6-6" />,
    right: <path d="m10 18 6-6-6-6" />,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {shapes[name]}
    </svg>
  );
}

function formatPrice(value) {
  const amount = Number(value || 0);
  return `₹ ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}

function emptyForm() {
  return {
    name: '',
    type: 'PRODUCT',
    categoryId: '',
    rate: '',
    stock: '0',
    description: '',
    imageUrl: '',
    cgstPercentage: '0',
    sgstPercentage: '0',
    active: true,
  };
}

function View() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState(() => localStorage.getItem('productTheme') || 'dark');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState(() => new Set());
  const [imageWarning, setImageWarning] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    Promise.all([apiRequest(Api.items), apiRequest(Api.categories)])
      .then(([itemResults, categoryResults]) => {
        if (!isCurrent) return;
        setItems(Array.isArray(itemResults) ? itemResults : []);
        setCategories(Array.isArray(categoryResults) ? categoryResults : []);
        setLoadError('');
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message || 'Could not load products and services.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('productTheme', theme);
  }, [theme]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchesCategory = categoryFilter === 'ALL' || String(item.categoryId) === categoryFilter;
      const matchesQuery = !query
        || item.name?.toLowerCase().includes(query)
        || item.categoryName?.toLowerCase().includes(query);
      return matchesType && matchesCategory && matchesQuery;
    });
  }, [items, search, typeFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstItem = filteredItems.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(currentPage * PAGE_SIZE, filteredItems.length);

  function updateFilter(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  function openCreateForm() {
    navigate('/add-services');
  }

  function openEditForm(item) {
    setEditingItem(item);
    setImageWarning('');
    setForm({
      name: item.name || '',
      type: item.type || 'PRODUCT',
      categoryId: String(item.categoryId || ''),
      rate: String(item.rate ?? ''),
      stock: String(item.stock ?? 0),
      description: item.description || '',
      imageUrl: resolveImageUrl(item.imageUrl || ''),
      cgstPercentage: String(item.cgstPercentage ?? 0),
      sgstPercentage: String(item.sgstPercentage ?? 0),
      active: Boolean(item.active),
    });
    setModalOpen(true);
  }

  function handleEditImageUpload(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const allowedTypes = {
      '.jpg': ['image/jpeg', 'image/jpg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.webp': ['image/webp'],
    };
    const mimeTypes = allowedTypes[extension];

    if (!mimeTypes || (file.type && !mimeTypes.includes(file.type.toLowerCase()))) {
      setImageWarning('Invalid image. Choose a JPG, JPEG, PNG, or WEBP file.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageWarning('Image file must be 2 MB or smaller.');
      input.value = '';
      return;
    }

    setImageWarning('');
    setForm((current) => ({ ...current, image: file, imageUrl: '' }));

    const objectUrl = URL.createObjectURL(file);
    setForm((current) => ({ ...current, imageUrl: objectUrl }));
  }

  async function saveItem(event) {
    event.preventDefault();
    setIsSaving(true);
    setNotice('');
    const formData = createItemFormData({
      ...form,
      categoryId: Number(form.categoryId),
      rate: Number(form.rate),
      stock: form.type === 'SERVICE' ? 0 : Number(form.stock),
      cgstPercentage: Number(form.cgstPercentage),
      sgstPercentage: Number(form.sgstPercentage),
    });

    try {
      const savedItem = await apiRequest(
        editingItem ? `${Api.items}/${editingItem.id}` : Api.items,
        { method: editingItem ? 'PUT' : 'POST', body: formData },
      );
      setItems((currentItems) => editingItem
        ? currentItems.map((item) => item.id === savedItem.id ? savedItem : item)
        : [savedItem, ...currentItems]);
      setModalOpen(false);
      setNotice(editingItem ? 'Item updated.' : 'Item added.');
    } catch (error) {
      setNotice(error.message || 'Could not save this item.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem() {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await apiRequest(`${Api.items}/${deletingItem.id}`, { method: 'DELETE' });
      setItems((currentItems) => currentItems.filter((item) => item.id !== deletingItem.id));
      setDeletingItem(null);
      setNotice('Item deleted.');
    } catch (error) {
      setNotice(error.message || 'Could not delete this item.');
      setDeletingItem(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleItemStatus(item) {
    const active = !item.active;
    setUpdatingStatusIds((currentIds) => new Set(currentIds).add(item.id));
    setNotice('');

    try {
      await apiRequest(`${Api.items}/${item.id}/status?active=${active}`, { method: 'PATCH' });
      setItems((currentItems) => currentItems.map((currentItem) => (
        currentItem.id === item.id ? { ...currentItem, active } : currentItem
      )));
      setNotice(`${item.name} is now ${active ? 'active' : 'inactive'}.`);
    } catch (error) {
      setNotice(error.message || 'Could not update item status.');
    } finally {
      setUpdatingStatusIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(item.id);
        return nextIds;
      });
    }
  }

  function logout() {
    sessionStorage.removeItem('adminToken');
    navigate('/login', { replace: true });
  }

  return (
    <main className={`view-page theme-${theme}`}>
      <div className="night-sky" aria-hidden="true">
        <span className="sky-particle particle-one" />
        <span className="sky-particle particle-two" />
        <span className="sky-particle particle-three" />
        <span className="sky-particle particle-four" />
        <span className="sky-particle particle-five" />
        <span className="sky-particle particle-six" />
        <span className="sky-particle particle-seven" />
        <span className="sky-particle particle-eight" />
        <span className="sky-particle particle-nine" />
        <span className="sky-particle particle-ten" />
        <span className="sky-particle particle-eleven" />
        <span className="sky-particle particle-twelve" />
      </div>

      <div className="view-layout">
        <header className="view-topbar">
          <a className="view-brand" href="#home" aria-label="Computer Sales and Service home">
            <span className="view-brand-icon"><Icon name="box" size={20} /></span>
            <span><strong>COMPUTER SALES</strong><small>&amp; SERVICE</small></span>
          </a>
          <div className="view-top-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
            <button className="logout-button" type="button" onClick={logout}>
              <Icon name="logout" size={16} /><span>Sign out</span>
            </button>
          </div>
        </header>

        <section className="view-heading" id="home">
          <div>
            <p className="view-eyebrow">INVENTORY WORKSPACE</p>
            <h1>Products &amp; Services</h1>
            <p className="view-description">Manage products, services, categories and pricing</p>
          </div>
          <button className="add-item-button" type="button" onClick={openCreateForm}>
            <Icon name="plus" size={18} />
            <span>Add Product / Service</span>
          </button>
          <button className="manage-categories-button" type="button" onClick={() => navigate('/categories')}>
            Manage categories
          </button>
        </section>

        <section className="catalog-section" id="products" aria-label="Product and service catalog">
          <div className="catalog-toolbar">
            <label className="catalog-search">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Search products or services..."
                value={search}
                onChange={(event) => updateFilter(setSearch, event.target.value)}
                aria-label="Search products or services"
              />
              {search && <span className="result-count">{filteredItems.length} results</span>}
            </label>
            <label className="filter-control">
              <span>Item Type</span>
              <select value={typeFilter} onChange={(event) => updateFilter(setTypeFilter, event.target.value)}>
                <option value="ALL">All types</option>
                <option value="PRODUCT">Products</option>
                <option value="SERVICE">Services</option>
              </select>
            </label>
            <label className="filter-control category-filter">
              <span>Category</span>
              <select value={categoryFilter} onChange={(event) => updateFilter(setCategoryFilter, event.target.value)}>
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
            </label>
          </div>

          {loadError && <div className="view-alert" role="alert">{loadError}</div>}
          {notice && <div className="view-notice" role="status">{notice}</div>}

          <div className="table-frame" aria-busy={isLoading}>
            <table className="items-table">
              <thead>
                <tr>
                  <th scope="col">Actions</th>
                  <th scope="col">Item Name</th>
                  <th scope="col">Item Type</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="table-message" colSpan="7">Loading catalog...</td></tr>
                ) : visibleItems.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Actions">
                      <div className="row-actions">
                        <button type="button" className="row-action edit-action" onClick={() => openEditForm(item)} aria-label={`Edit ${item.name}`} title="Edit">
                          <Icon name="edit" size={16} />
                        </button>
                        <button type="button" className="row-action delete-action" onClick={() => setDeletingItem(item)} aria-label={`Delete ${item.name}`} title="Delete">
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                    <td data-label="Item Name"><span className="item-name">{item.name}</span></td>
                    <td data-label="Item Type"><span className={`type-badge ${item.type === 'SERVICE' ? 'service-badge' : 'product-badge'}`}>{item.type}</span></td>
                    <td data-label="Category"><span className="category-name">{item.categoryName || 'Uncategorized'}</span></td>
                    <td data-label="Price"><span className="item-price">{formatPrice(item.rate)}</span></td>
                    <td data-label="Stock">
                      {item.type === 'SERVICE' ? <span className="stock-dash">—</span> : item.stock <= 0
                        ? <span className="stock-badge stock-empty">Out of stock</span>
                        : item.stock < 3
                          ? <span className="stock-badge stock-low"><span className="stock-dot" />{item.stock} · Low stock</span>
                          : <span className="stock-normal">{item.stock}</span>}
                    </td>
                    <td data-label="Status">
                      <button
                        type="button"
                        className={`status-badge status-toggle ${item.active ? 'is-active' : 'is-inactive'}`}
                        onClick={() => toggleItemStatus(item)}
                        disabled={updatingStatusIds.has(item.id)}
                        aria-label={`${item.active ? 'Deactivate' : 'Activate'} ${item.name}`}
                        aria-pressed={Boolean(item.active)}
                        title={`Set ${item.name} ${item.active ? 'inactive' : 'active'}`}
                      >
                        <span />{item.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && visibleItems.length === 0 && (
                  <tr>
                    <td className="empty-cell" colSpan="7">
                      <div className="empty-state">
                        <span className="empty-icon"><Icon name="box" size={26} /></span>
                        <h2>No products or services found</h2>
                        <p>Try changing your filters or add a new product/service.</p>
                        <button type="button" className="empty-add-button" onClick={openCreateForm}>
                          <Icon name="plus" size={16} /> Add Product / Service
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="table-footer">
            <p>Showing <strong>{firstItem}–{lastItem}</strong> of <strong>{filteredItems.length}</strong> items</p>
            <nav className="pagination" aria-label="Catalog pages">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous page">
                <Icon name="left" size={16} /><span>Previous</span>
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" className={page === currentPage ? 'current-page' : ''} onClick={() => setCurrentPage(page)} aria-current={page === currentPage ? 'page' : undefined}>{page}</button>
              ))}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Next page">
                <span>Next</span><Icon name="right" size={16} />
              </button>
            </nav>
          </footer>
        </section>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
            <header className="modal-header">
              <div>
                <p className="modal-eyebrow">CATALOG ITEM</p>
                <h2 id="item-modal-title">{editingItem ? 'Edit item' : 'Add Product / Service'}</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Close form"><Icon name="close" /></button>
            </header>
            <form className="item-form" onSubmit={saveItem}>
              <label className="form-field form-field-wide">
                <span>Item name</span>
                <input autoFocus maxLength="100" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Business Laptop" />
              </label>
              <label className="form-field">
                <span>Item type</span>
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option value="PRODUCT">Product</option>
                  <option value="SERVICE">Service</option>
                </select>
              </label>
              <label className="form-field">
                <span>Category</span>
                <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                  <option value="" disabled>Select category</option>
                  {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Price (₹)</span>
                <input type="number" min="0" step="0.01" required value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} placeholder="0.00" />
              </label>
              {form.type === 'PRODUCT' && (
                <label className="form-field">
                  <span>Stock quantity</span>
                  <input type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
                </label>
              )}
              <label className="form-field">
                <span>CGST (%)</span>
                <input type="number" min="0" step="0.01" value={form.cgstPercentage} onChange={(event) => setForm({ ...form, cgstPercentage: event.target.value })} />
              </label>
              <label className="form-field">
                <span>SGST (%)</span>
                <input type="number" min="0" step="0.01" value={form.sgstPercentage} onChange={(event) => setForm({ ...form, sgstPercentage: event.target.value })} />
              </label>
              <label className="form-field form-field-wide">
                <span>Description</span>
                <textarea maxLength="200" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short product or service details" />
              </label>
              <div className="form-field form-field-wide edit-image-field">
                <label htmlFor="edit-item-image"><span>Product image <small>Optional</small></span></label>
                <input
                  id="edit-item-image"
                  type="file"
                  accept=".jpg,.jpeg,.webp,.png,image/jpeg,image/webp,image/png"
                  onChange={handleEditImageUpload}
                />
                <small className="edit-image-guidance">JPG, JPEG, WEBP, or PNG. Maximum file size: 2 MB.</small>
                {imageWarning && <small className="edit-image-warning" role="alert">{imageWarning}</small>}
                {form.imageUrl && (
                  <button type="button" className="edit-image-remove" onClick={() => { setForm({ ...form, image: null, imageUrl: '' }); setImageWarning(''); }}>
                    Remove image
                  </button>
                )}
                <div className="edit-image-preview">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Product or service preview"
                      onError={() => {
                        setImageWarning('The saved image could not be previewed. Choose a replacement image or remove it.');
                      }}
                    />
                  ) : <span>No image selected</span>}
                </div>
              </div>
              <label className="active-toggle form-field-wide">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                <span className="toggle-track" />
                <span>Available for sale or service</span>
              </label>
              <footer className="modal-actions form-field-wide">
                <button className="secondary-button" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="add-item-button modal-save" type="submit" disabled={isSaving || categories.length === 0}>
                  {isSaving ? 'Saving...' : editingItem ? 'Save changes' : 'Add Product / Service'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deletingItem && (
        <div className="modal-backdrop">
          <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <span className="confirm-icon"><Icon name="trash" size={21} /></span>
            <h2 id="delete-title">Delete this item?</h2>
            <p id="delete-description"><strong>{deletingItem.name}</strong> will be permanently removed from the catalog.</p>
            <div className="confirm-actions">
              <button className="secondary-button" type="button" onClick={() => setDeletingItem(null)}>Cancel</button>
              <button className="danger-button" type="button" onClick={deleteItem} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete item'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default View;