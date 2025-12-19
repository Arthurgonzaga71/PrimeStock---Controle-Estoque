import React from 'react';

const ExportButton = ({ 
  onExport, 
  loading = false, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  icon = '📊'
}) => {
  const getButtonStyles = () => {
    const baseStyle = {
      padding: size === 'large' ? '12px 24px' : size === 'small' ? '6px 12px' : '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      opacity: loading || disabled ? 0.6 : 1,
      fontSize: size === 'large' ? '16px' : size === 'small' ? '12px' : '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      fontWeight: '500'
    };

    const variants = {
      primary: {
        backgroundColor: '#1976d2',
        color: 'white',
        border: '1px solid #1976d2'
      },
      secondary: {
        backgroundColor: 'transparent',
        color: '#1976d2',
        border: '1px solid #1976d2'
      },
      success: {
        backgroundColor: '#28a745',
        color: 'white',
        border: '1px solid #28a745'
      },
      warning: {
        backgroundColor: '#ffc107',
        color: '#212529',
        border: '1px solid #ffc107'
      }
    };

    return { ...baseStyle, ...variants[variant] };
  };

  return (
    <button 
      style={getButtonStyles()}
      onClick={onExport}
      disabled={loading || disabled}
      title={loading ? 'Exportando...' : 'Exportar dados'}
    >
      <span>{loading ? '⏳' : icon}</span>
      {loading ? 'Exportando...' : children}
    </button>
  );
};

export default ExportButton;