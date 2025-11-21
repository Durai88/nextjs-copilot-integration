"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function ChatPage() {
  const [documents, setDocuments] = useState<Array<{name: string, content: string, type: string}>>([]);
  const [images, setImages] = useState<Array<{name: string, url: string}>>([]);
  
  // Make documents readable by the copilot
  useCopilotReadable({
    description: "User uploaded documents and images",
    value: documents.map(doc => `File: ${doc.name} (${doc.type})\n${doc.content}`).join("\n\n"),
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    try {
      // Handle images with vision analysis
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const url = e.target?.result as string;
          setImages(prev => [...prev, { name: file.name, url }]);
          
          // Try to analyze image using vision API
          try {
            const response = await fetch('/api/analyze-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: url, filename: file.name })
            });
            
            if (response.ok) {
              const data = await response.json();
              setDocuments(prev => [...prev, {
                name: file.name,
                content: `Image: ${file.name}\n\nAnalysis:\n${data.description}`,
                type: 'Image'
              }]);
            } else {
              setDocuments(prev => [...prev, {
                name: file.name,
                content: `Image file: ${file.name}. Vision analysis not available with current model.`,
                type: 'Image'
              }]);
            }
          } catch (error) {
            setDocuments(prev => [...prev, {
              name: file.name,
              content: `Image file: ${file.name}. Vision analysis not available.`,
              type: 'Image'
            }]);
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // Handle Excel files (.xlsx, .xls)
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          let content = `Excel File: ${file.name}\n\n`;
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            content += `Sheet: ${sheetName}\nRows: ${jsonData.length}\n`;
            if (jsonData.length > 0 && jsonData[0]) {
              content += `Columns: ${Object.keys(jsonData[0] as object).join(', ')}\n`;
              content += `Data Preview:\n${JSON.stringify(jsonData.slice(0, 5), null, 2)}\n`;
              if (jsonData.length > 5) content += `... and ${jsonData.length - 5} more rows\n`;
            }
            content += '\n';
          });
          
          setDocuments(prev => [...prev, {
            name: file.name,
            content,
            type: 'Excel'
          }]);
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // Handle CSV files
      if (fileName.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          Papa.parse(content, {
            header: true,
            complete: (results) => {
              const firstRow = results.data[0] as Record<string, unknown> | undefined;
              const summary = `CSV File: ${file.name}\nRows: ${results.data.length}\nColumns: ${firstRow ? Object.keys(firstRow).join(', ') : 'N/A'}\n\nData Preview:\n${JSON.stringify(results.data.slice(0, 10), null, 2)}${results.data.length > 10 ? '\n... and ' + (results.data.length - 10) + ' more rows' : ''}`;
              setDocuments(prev => [...prev, {
                name: file.name,
                content: summary,
                type: 'CSV'
              }]);
            }
          });
        };
        reader.readAsText(file);
        return;
      }

      // Handle PDF files
      if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            // Try to extract text using pdf-parse
            const pdfParseModule = await import('pdf-parse');
            const pdfParse = (pdfParseModule as any).default || pdfParseModule;
            const pdfData = await pdfParse(Buffer.from(arrayBuffer));
            setDocuments(prev => [...prev, {
              name: file.name,
              content: `PDF: ${file.name}\nPages: ${pdfData.numpages}\n\nContent:\n${pdfData.text.slice(0, 5000)}${pdfData.text.length > 5000 ? '\n... (truncated)' : ''}`,
              type: 'PDF'
            }]);
          } catch (error) {
            setDocuments(prev => [...prev, {
              name: file.name,
              content: `PDF document: ${file.name} (${(file.size / 1024).toFixed(2)} KB). Text extraction failed - PDF may be image-based.`,
              type: 'PDF'
            }]);
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // Handle Word documents (.docx)
      if (fileName.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            const mammoth = (await import('mammoth')).default;
            const result = await mammoth.extractRawText({ arrayBuffer });
            setDocuments(prev => [...prev, {
              name: file.name,
              content: `Word Document: ${file.name}\n\nContent:\n${result.value}`,
              type: 'Word'
            }]);
          } catch (error) {
            setDocuments(prev => [...prev, {
              name: file.name,
              content: `Word document: ${file.name}. Text extraction failed.`,
              type: 'Word'
            }]);
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }
      
      // Handle text files (txt, md, json, etc.)
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDocuments(prev => [...prev, {
          name: file.name,
          content,
          type: file.type || 'text'
        }]);
      };
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${file.name}`);
    }
  };

  return (
    <div style={{ 
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f7f7f8"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        {/* Logo */}
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "white",
          boxShadow: "0 2px 8px rgba(255,107,107,0.3)"
        }}>
          <img src="/logo.png" alt="Logo" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#1a1a1a", margin: 0 }}>Chola Assist</h1>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Assist by KyberAI</p>
        </div>
      </div>

      {/* Main Chat Area - Fixed Size */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        maxWidth: "900px",
        width: "100%",
        margin: "0 auto",
        overflow: "hidden"
      }}>
        {/* Floating Attachments */}
        {(documents.length > 0 || images.length > 0) && (
          <div style={{
            padding: "12px 24px",
            backgroundColor: "white",
            borderBottom: "1px solid #e5e5e5",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
            maxHeight: "120px",
            overflowY: "auto"
          }}>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "500" }}>Attachments:</span>
            {documents.map((doc, idx) => (
              <div key={idx} style={{
                backgroundColor: "#f3f4f6",
                padding: "6px 12px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.85rem",
                color: "#374151",
                border: "1px solid #e5e7eb"
              }}>
                <span>📄</span>
                <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.name}
                </span>
              </div>
            ))}
            {images.map((img, idx) => (
              <div key={idx} style={{
                backgroundColor: "#f3f4f6",
                padding: "4px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <img src={img.url} alt={img.name} style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }} />
                <span style={{ fontSize: "0.85rem", color: "#374151", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                  {img.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Chat Messages - Fixed Height with Scroll */}
        <div style={{ 
          flex: 1,
          overflowY: "auto",
          backgroundColor: "white",
          position: "relative"
        }}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CopilotChat 
              instructions="You are a helpful AI assistant. You can help users with their questions and analyze any documents or images they upload."
              labels={{
                title: "AI Assistant",
                initial: "Hi! I'm your AI assistant. Upload documents and ask me anything!"
              }}
            />
          </div>
        </div>
        
        {/* Custom Input Area with Upload Button */}
        <div style={{
          backgroundColor: "white",
          borderTop: "1px solid #e5e5e5",
          padding: "16px 24px",
          position: "relative"
        }}>
          <label style={{
            position: "absolute",
            bottom: "24px",
            left: "32px",
            cursor: "pointer",
            padding: "8px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            border: "1px solid #e5e7eb",
            transition: "background-color 0.2s"
          }}>
            <input 
              type="file" 
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv,.xlsx,.xls,.pdf,.docx,.doc,image/*"
              style={{ display: "none" }}
            />
            <span style={{ fontSize: "1.3rem" }}>📎</span>
          </label>
        </div>
        
        <style jsx global>{`
          /* Hide CopilotChat's default input and use custom one */
          .copilotKitMessages {
            max-height: calc(100vh - 300px);
            overflow-y: auto !important;
          }
          .copilotKitInput {
            padding-left: 60px !important;
          }
        `}</style>
      </div>
    </div>
  );
}
