// ExportPDFButton.jsx
import React from 'react';

const ExportPDFButton = ({ onExport }) => {
  return (
    <button onClick={onExport}>Export PDF</button>
  );
};

export default ExportPDFButton;
