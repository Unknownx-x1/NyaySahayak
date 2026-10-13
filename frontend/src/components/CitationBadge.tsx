import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle, XCircle } from 'lucide-react';

interface CitationBadgeProps {
  status: 'VERIFIED' | 'PARTIAL' | 'CONTESTED' | 'UNVERIFIED' | 'NOT_FOUND' | string;
  onClick?: () => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ status, onClick }) => {
  const renderIcon = () => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle2 size={14} />;
      case 'PARTIAL':
        return <AlertTriangle size={14} />;
      case 'CONTESTED':
        return <ShieldAlert size={14} />;
      case 'NOT_FOUND':
        return <XCircle size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  return (
    <span
      className={`badge badge-${status.toLowerCase().replace('_', '-')}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: status === 'NOT_FOUND' ? 'rgba(239, 68, 68, 0.15)' : undefined,
        color: status === 'NOT_FOUND' ? '#f87171' : undefined,
        borderColor: status === 'NOT_FOUND' ? 'rgba(239, 68, 68, 0.35)' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontWeight: 600,
        fontSize: '0.75rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        border: '1px solid',
      }}
      title={`Citation Status: ${status}`}
    >
      {renderIcon()}
      {status === 'NOT_FOUND' ? 'NOT FOUND IN CORPUS' : status}
    </span>
  );
};
