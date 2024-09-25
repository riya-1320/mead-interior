import React, { useRef } from 'react'; 
import { useParams } from 'react-router-dom';
import ViesMaterialSelection from './ViewQuotatioin';
import { QuotationPdf } from './Quotatiopdf';
 

const View = () => {
  const quotationRef = useRef();
  const {id} = useParams();

  const exportPDF = () => {
    if (quotationRef.current) {
      quotationRef.current.exportPDF(); // Call the export function from Quotation component
    }
  };

  return (
    <div>
      <ViesMaterialSelection id={id} onExportPDF={exportPDF} />
      <QuotationPdf id={id} ref={quotationRef} />
    </div>
  );
};

export default View;
