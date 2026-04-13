export default function Modal({ isOpen, title, message, icon, iconClass, onConfirm, onCancel, confirmText, cancelText, confirmClass, loading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} id="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()} id="modal-dialog">
        {icon && (
          <div className={`modal-icon ${iconClass || ''}`}>
            {icon}
          </div>
        )}
        <h3 className="modal-title" id="modal-title">{title}</h3>
        <p className="modal-message" id="modal-message">{message}</p>
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
            id="modal-cancel-btn"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            className={`btn ${confirmClass || 'btn-danger'}`}
            onClick={onConfirm}
            disabled={loading}
            id="modal-confirm-btn"
          >
            {loading && <span className="spinner"></span>}
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
