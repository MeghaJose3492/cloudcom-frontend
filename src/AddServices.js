import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Api, { createItemFormData } from './Api';
import './AddServices.css';

const initialForm = {
  type: 'PRODUCT',
  name: '',
  categoryId: '',
  description: '',
  imageUrl: '',
  rate: '',
  cgstPercentage: '0',
  sgstPercentage: '0',
  stock: '0',
  active: true,
};

function AddServices() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('addServicesTheme') || 'light');
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [imageState, setImageState] = useState('empty');
  const [imageWarning, setImageWarning] = useState('');

  useEffect(() => {
    localStorage.setItem('addServicesTheme', theme);
  }, [theme]);

  useEffect(() => {
    let isCurrent = true;
    const token = sessionStorage.getItem('adminToken');

    fetch(Api.categories, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        const result = await response.json().catch(() => []);
        if (!response.ok) throw new Error(result.message || 'Could not load categories.');
        return result;
      })
      .then((results) => {
        if (isCurrent) setCategories(Array.isArray(results) ? results : []);
      })
      .catch((error) => {
        if (isCurrent) {
          setCategoryError(error.message || 'Could not load categories.');
          setBackendError({
            title: error instanceof TypeError ? 'Server unavailable' : 'Could not load categories',
            message: error instanceof TypeError
              ? 'The server could not be reached. Check your connection and try again.'
              : error.message || 'The server could not load categories.',
          });
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingCategories(false);
      });

    return () => { isCurrent = false; };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    if (field === 'imageUrl') {
      setImageState(value ? 'loading' : 'empty');
      setImageWarning('');
    }
    if (feedback) setFeedback(null);
  }

  function handleImageUpload(event) {
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
    setImageState('loading');
    setForm((current) => ({ ...current, image: file, imageUrl: '' }));

    const objectUrl = URL.createObjectURL(file);
    setForm((current) => ({ ...current, imageUrl: objectUrl }));
  }

  function validate() {
    const nextErrors = {};
    const rate = Number(form.rate);
    const cgst = Number(form.cgstPercentage);
    const sgst = Number(form.sgstPercentage);
    const stock = Number(form.stock);

    if (!form.name.trim()) nextErrors.name = 'Item name is required.';
    if (!form.categoryId) nextErrors.categoryId = 'Please select a category.';
    if (!form.rate || !Number.isFinite(rate) || rate <= 0) nextErrors.rate = 'Rate must be greater than 0.';
    if (!Number.isFinite(cgst) || cgst < 0 || cgst > 100) nextErrors.cgstPercentage = 'CGST must be between 0 and 100.';
    if (!Number.isFinite(sgst) || sgst < 0 || sgst > 100) nextErrors.sgstPercentage = 'SGST must be between 0 and 100.';
    if (form.type === 'PRODUCT' && (!Number.isInteger(stock) || stock < 0)) {
      nextErrors.stock = 'Stock cannot be negative and must be a whole number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveItem(event) {
    event.preventDefault();
    setFeedback(null);
    if (!validate()) return;

    setIsSaving(true);
    const token = sessionStorage.getItem('adminToken');
    const formData = createItemFormData({
      ...form,
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      rate: Number(form.rate),
      cgstPercentage: Number(form.cgstPercentage),
      sgstPercentage: Number(form.sgstPercentage),
      stock: form.type === 'PRODUCT' ? Number(form.stock) : 0,
    });

    try {
      const response = await fetch(Api.items, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || 'Could not save this item.');

      setFeedback({ type: 'success', text: `${form.type === 'PRODUCT' ? 'Product' : 'Service'} added successfully.` });
      setForm({ ...initialForm, categoryId: form.categoryId });
      setImageState('empty');
      setImageWarning('');
      setErrors({});
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Could not save this item.' });
      setBackendError({
        title: error instanceof TypeError ? 'Server unavailable' : 'Could not save item',
        message: error instanceof TypeError
          ? 'The server could not be reached. Check your connection and try again.'
          : error.message || 'The server could not save this item.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={`add-services-page theme-${theme}`}>
      <div className="add-services-layout">
        <header className="add-services-topbar">
          <a className="add-services-brand" href="/view">
            <span className="add-services-mark" aria-hidden="true">CS</span>
            <span><strong>Computer Sales &amp; Service</strong><small>MANAGEMENT SYSTEM</small></span>
          </a>
          <div className="add-services-header-actions">
            <button
              className="add-theme-toggle"
              type="button"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>
              )}
            </button>
            <button className="add-back-link" type="button" onClick={() => navigate('/view')}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12.5 4.5-5.5 5.5 5.5 5.5M7.5 10H17" /></svg>
              Back to catalog
            </button>
          </div>
        </header>

        <section className="add-services-heading">
          <p className="add-services-eyebrow">CATALOG MANAGEMENT</p>
          <h1>Add Product / Service</h1>
          <p>Create and manage products and services available to your customers.</p>
        </section>

        {feedback && <div className={`add-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}
        {feedback?.type === 'success' && (
          <div className="success-actions">
            <button type="button" className="success-link" onClick={() => navigate('/view')}>Back to catalog</button>
            <button type="button" className="success-link" onClick={() => { setFeedback(null); setForm({ ...initialForm, categoryId: form.categoryId }); }}>Add another item</button>
          </div>
        )}

        <form className="add-services-form" onSubmit={saveItem} noValidate>
          <div className="form-columns">
            <section className="form-column" aria-label="Basic information">
              <div className="form-section-heading">
                <span className="section-index">01</span>
                <div><h2>Basic information</h2><p>Identify and classify the catalog item.</p></div>
              </div>

              <fieldset className="type-fieldset">
                <legend>Item type</legend>
                <div className="item-type-segment" role="group" aria-label="Item type">
                  {['PRODUCT', 'SERVICE'].map((type) => (
                    <button
                      className={form.type === type ? 'type-option selected' : 'type-option'}
                      key={type}
                      type="button"
                      aria-pressed={form.type === type}
                      onClick={() => updateField('type', type)}
                    >
                      <span className="type-option-icon" aria-hidden="true">{type === 'PRODUCT' ? 'P' : 'S'}</span>
                      {type === 'PRODUCT' ? 'Product' : 'Service'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="add-form-field">
                <span>Item name <b>*</b></span>
                <input
                  type="text"
                  maxLength="100"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Enter product or service name"
                  aria-invalid={Boolean(errors.name)}
                />
                <small className="field-meta">{form.name.length}/100 characters</small>
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>

              <label className="add-form-field">
                <span>Category <b>*</b></span>
                <select
                  value={form.categoryId}
                  onChange={(event) => updateField('categoryId', event.target.value)}
                  aria-invalid={Boolean(errors.categoryId)}
                  disabled={isLoadingCategories || categories.length === 0}
                >
                  <option value="">{isLoadingCategories ? 'Loading categories...' : 'Select category'}</option>
                  {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
                </select>
                {categoryError && <small className="field-error">{categoryError}</small>}
                {errors.categoryId && <small className="field-error">{errors.categoryId}</small>}
              </label>

              <label className="add-form-field">
                <span>Description <small>Optional</small></span>
                <textarea
                  rows="4"
                  maxLength="200"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Enter a short description"
                />
                <small className="field-meta">{form.description.length}/200 characters</small>
              </label>

              <div className="add-form-field image-field">
                <label htmlFor="service-image-file"><span>Image file <small>Optional</small></span></label>
                <input
                  id="service-image-file"
                  type="file"
                  accept=".jpg,.jpeg,.webp,.png,image/jpeg,image/webp,image/png"
                  onChange={handleImageUpload}
                />
                <small className="upload-guidance">JPG, JPEG, WEBP, or PNG. Maximum file size: 2 MB.</small>
                {imageWarning && <small className="field-error" role="alert">{imageWarning}</small>}
                {form.imageUrl && <button className="remove-image-button" type="button" onClick={() => setForm((current) => ({ ...current, image: null, imageUrl: '' }))}>Remove image</button>}
                <div className={`image-preview${imageState === 'empty' ? ' is-empty' : ''}`} aria-label="Image preview">
                  {form.imageUrl && imageState !== 'failed' ? (
                    <img
                      src={form.imageUrl}
                      alt="Product or service preview"
                      onLoad={() => setImageState('loaded')}
                      onError={() => {
                        setImageState('failed');
                        setImageWarning('This file is not a valid image. Choose a JPG, JPEG, PNG, or WEBP file.');
                        setForm((current) => ({ ...current, imageUrl: '' }));
                      }}
                    />
                  ) : (
                    <span className="preview-placeholder">
                      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="3" /><circle cx="10" cy="11" r="2" /><path d="m5 21 6-6 4 4 3-3 5 5" /></svg>
                      <span>{imageState === 'failed' ? 'Image could not be loaded' : 'Image preview'}</span>
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="form-column detail-column" aria-label="Pricing and availability">
              <div className="form-section-heading">
                <span className="section-index">02</span>
                <div><h2>Pricing &amp; availability</h2><p>Set the rate, taxes and stock details.</p></div>
              </div>

              <div className="detail-section">
                <h3>Pricing</h3>
                <label className="add-form-field">
                  <span>Rate <b>*</b></span>
                  <div className="currency-input"><span>₹</span><input type="number" min="0.01" step="0.01" value={form.rate} onChange={(event) => updateField('rate', event.target.value)} placeholder="0.00" aria-invalid={Boolean(errors.rate)} /></div>
                  {errors.rate && <small className="field-error">{errors.rate}</small>}
                </label>
                <div className="tax-fields">
                  <label className="add-form-field">
                    <span>CGST (%)</span>
                    <input type="number" min="0" max="100" step="0.01" value={form.cgstPercentage} onChange={(event) => updateField('cgstPercentage', event.target.value)} aria-invalid={Boolean(errors.cgstPercentage)} />
                    {errors.cgstPercentage && <small className="field-error">{errors.cgstPercentage}</small>}
                  </label>
                  <label className="add-form-field">
                    <span>SGST (%)</span>
                    <input type="number" min="0" max="100" step="0.01" value={form.sgstPercentage} onChange={(event) => updateField('sgstPercentage', event.target.value)} aria-invalid={Boolean(errors.sgstPercentage)} />
                    {errors.sgstPercentage && <small className="field-error">{errors.sgstPercentage}</small>}
                  </label>
                </div>
              </div>

              <div className="detail-section inventory-section">
                <h3>Inventory</h3>
                {form.type === 'PRODUCT' ? (
                  <>
                    <label className="add-form-field">
                      <span>Stock quantity</span>
                      <input type="number" min="0" step="1" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} placeholder="Enter stock quantity" aria-invalid={Boolean(errors.stock)} />
                      {errors.stock && <small className="field-error">{errors.stock}</small>}
                    </label>
                    <p className="inventory-hint"><span aria-hidden="true">i</span> Low-stock alert threshold: <strong>3</strong></p>
                  </>
                ) : (
                  <div className="stock-not-applicable"><span className="stock-dash">—</span><span><strong>Stock: Not Applicable</strong><small>Services are not tracked as inventory.</small></span></div>
                )}
              </div>

              <div className="detail-section active-section">
                <h3>Active status</h3>
                <label className="active-status-control">
                  <input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />
                  <span className="active-switch" aria-hidden="true"><i /></span>
                  <span className="active-copy"><strong>{form.active ? 'Active' : 'Inactive'}</strong><small>Active items will be visible to customers.</small></span>
                </label>
              </div>
            </section>
          </div>

          <footer className="add-form-footer">
            <p><span>*</span> Required fields</p>
            <div className="add-form-actions">
              <button className="cancel-form-button" type="button" onClick={() => navigate('/view')}>Cancel</button>
              <button className="save-form-button" type="submit" disabled={isSaving || isLoadingCategories || categories.length === 0}>
                {isSaving ? 'Saving...' : `Save ${form.type === 'PRODUCT' ? 'Product' : 'Service'}`}
              </button>
            </div>
          </footer>
        </form>
      </div>
      {backendError && (
        <div className="backend-error-backdrop">
          <section className="backend-error-dialog" role="alertdialog" aria-modal="true" aria-labelledby="backend-error-title" aria-describedby="backend-error-message">
            <span className="backend-error-mark" aria-hidden="true">!</span>
            <p className="backend-error-eyebrow">BACKEND RESPONSE</p>
            <h2 id="backend-error-title">{backendError.title}</h2>
            <p id="backend-error-message">{backendError.message}</p>
            <button autoFocus type="button" onClick={() => setBackendError(null)}>Dismiss</button>
          </section>
        </div>
      )}
    </main>
  );
}

export default AddServices;