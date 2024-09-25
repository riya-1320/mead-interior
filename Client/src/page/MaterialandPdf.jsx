import React, { useRef } from 'react';
import MaterialSelection from './MaterialSelection';
import { Quotation } from './Pdf';
import { useParams } from 'react-router-dom';
 

const ParentComponent = () => {
  const quotationRef = useRef();
  const {id} = useParams();

  const exportPDF = () => {
    if (quotationRef.current) {
      quotationRef.current.exportPDF(); // Call the export function from Quotation component
    }
  };

  return (
    <div>
      <MaterialSelection id={id} onExportPDF={exportPDF} />
      <Quotation id={id} ref={quotationRef} />
    </div>
  );
};

export default ParentComponent;
