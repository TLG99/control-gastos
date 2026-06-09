// js/dialogs.js
// Dialogos visuales reutilizables para reemplazar alert/prompt/confirm nativos.

let resolverActual = null;

function refs() {
  return {
    modal: document.getElementById('modal-dialogo'),
    icon: document.getElementById('dlg-icon'),
    title: document.getElementById('dlg-title'),
    message: document.getElementById('dlg-message'),
    inputWrap: document.getElementById('dlg-input-wrap'),
    input: document.getElementById('dlg-input'),
    options: document.getElementById('dlg-options'),
    cancel: document.getElementById('dlg-cancel'),
    ok: document.getElementById('dlg-ok'),
  };
}

function closeDialog(value) {
  const { modal, inputWrap, input, options } = refs();
  const result = value === true && inputWrap.style.display === 'block'
    ? input.value.trim()
    : value;
  modal.style.display = 'none';
  input.value = '';
  options.innerHTML = '';

  if (resolverActual) {
    resolverActual(result);
    resolverActual = null;
  }
}

function openDialog({
  type = 'info',
  title,
  message,
  okText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
  input = false,
  placeholder = '',
  options = [],
  danger = false,
}) {
  const r = refs();
  const icons = { info: 'i', success: '✓', warning: '!', danger: '!' };

  r.modal.className = 'app-dialog ' + (danger ? 'dialog-danger' : 'dialog-' + type);
  r.icon.textContent = icons[type] || icons.info;
  r.title.textContent = title;
  r.message.textContent = message;
  r.inputWrap.style.display = input ? 'block' : 'none';
  r.input.value = '';
  r.input.placeholder = placeholder;
  r.cancel.textContent = cancelText;
  r.cancel.style.display = showCancel ? 'inline-flex' : 'none';
  r.ok.textContent = okText;
  r.ok.classList.toggle('btn-dialog-danger', danger);

  r.options.innerHTML = '';
  r.options.style.display = options.length ? 'grid' : 'none';
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dialog-option';
    btn.textContent = option;
    btn.addEventListener('click', () => {
      r.input.value = option;
      r.input.focus();
    });
    r.options.appendChild(btn);
  });

  r.modal.style.display = 'flex';
  if (input) setTimeout(() => r.input.focus(), 0);

  return new Promise(resolve => {
    resolverActual = resolve;
  });
}

export function showAlert(title, message, options = {}) {
  return openDialog({
    type: options.type || 'info',
    title,
    message,
    okText: options.okText || 'Entendido',
  });
}

export function showConfirm(title, message, options = {}) {
  return openDialog({
    type: options.type || 'warning',
    title,
    message,
    okText: options.okText || 'Confirmar',
    cancelText: options.cancelText || 'Cancelar',
    showCancel: true,
    danger: Boolean(options.danger),
  });
}

export async function showPrompt(title, message, options = {}) {
  const value = await openDialog({
    type: options.type || 'info',
    title,
    message,
    okText: options.okText || 'Guardar',
    cancelText: options.cancelText || 'Cancelar',
    showCancel: true,
    input: true,
    placeholder: options.placeholder || '',
    options: options.options || [],
  });
  if (value === false) return null;
  return value;
}

export function initDialogs() {
  const r = refs();
  r.cancel.addEventListener('click', () => closeDialog(false));
  r.ok.addEventListener('click', () => closeDialog(true));
  r.modal.addEventListener('click', (event) => {
    if (event.target === r.modal) closeDialog(false);
  });
  r.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') closeDialog(true);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && r.modal.style.display === 'flex') closeDialog(false);
  });
}
