# Chola Assist - AI Document Assistant

An intelligent AI-powered document assistant built with Next.js, CopilotKit, and Groq/OpenAI. Upload documents, analyze data, and chat with AI about your files.

## Features

✨ **Multi-Format File Support**
- 📄 PDF documents (with text extraction)
- 📊 Excel files (.xlsx, .xls) with data preview
- 📈 CSV files with automatic parsing
- 📝 Word documents (.docx)
- 🖼️ Images (with optional vision analysis)
- 📃 Text files (.txt, .md, .json)

🤖 **AI Capabilities**
- Natural language chat interface
- Document content analysis
- CSV/Excel data insights
- Contextual responses based on uploaded files
- Powered by Llama 3.3 (via Groq) or GPT models (via OpenAI)

🎨 **Modern UI**
- Clean, ChatGPT-like interface
- Warm gradient design
- Responsive layout
- File attachment preview
- Real-time message streaming

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **AI Integration:** CopilotKit
- **LLM Provider:** Groq (free) or OpenAI (paid)
- **Styling:** Tailwind CSS
- **File Processing:** 
  - PDF: pdf-parse
  - Excel: xlsx
  - CSV: papaparse
  - Word: mammoth

## Getting Started

### Prerequisites

- Node.js 18+ or pnpm
- Groq API key (free) or OpenAI API key (paid)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-copilot-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# For free AI (recommended)
GROQ_API_KEY=your_groq_api_key_here

# OR for OpenAI (paid, with vision support)
# OPENAI_API_KEY=your_openai_api_key_here

# For development (if behind proxy)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Get API Keys:**
- Groq (Free): https://console.groq.com/keys
- OpenAI (Paid): https://platform.openai.com/api-keys

4. Add your logo (optional):

Place your logo file at `public/logo.png`

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000/chat](http://localhost:3000/chat) in your browser

## Usage

### Uploading Files

1. Click the 📎 (paperclip) button at the bottom-left of the chat input
2. Select your file (PDF, Excel, CSV, Word, Image, or Text)
3. Wait for the file to process
4. The file will appear in the "Attachments" section
5. Ask questions about your uploaded files!

### Example Queries

**For CSV/Excel files:**
- "Summarize the data in this file"
- "How many rows are in the dataset?"
- "What are the top 5 entries?"
- "Analyze the trends in this data"

**For PDF/Word documents:**
- "What is this document about?"
- "Summarize the key points"
- "Find information about [topic]"

**For Images:**
- "Describe this image" (requires OpenAI API key)
- "What do you see in this picture?"

## Configuration

### Using Groq (Free & Fast)

Groq provides free access to Llama 3.3 70B model:
- Fast inference
- No cost
- Great for text analysis
- No image analysis support

### Using OpenAI (Paid)

OpenAI provides GPT models with vision capabilities:
- Image analysis with GPT-4 Vision
- Higher quality responses
- Requires credits
- To enable: Comment out `GROQ_API_KEY` and use `OPENAI_API_KEY`

## Project Structure

```
my-copilot-app/
├── app/
│   ├── api/
│   │   ├── copilotkit/       # Main AI endpoint
│   │   └── analyze-image/    # Image analysis endpoint
│   ├── chat/
│   │   └── page.tsx          # Main chat interface
│   ├── layout.tsx            # Root layout with CopilotKit provider
│   └── globals.css           # Global styles
├── public/
│   └── logo.png              # Your logo (optional)
├── .env.local                # Environment variables (create this)
└── package.json
```

## Customization

### Branding

Update the header in `app/chat/page.tsx`:
```tsx
<h1>Your App Name</h1>
<p>Powered by Your Company</p>
```

### AI Instructions

Modify the AI behavior in `app/chat/page.tsx`:
```tsx
<CopilotChat 
  instructions="Your custom instructions here..."
/>
```

### Styling

- Colors: Update gradient in header logo
- Layout: Modify styles in `app/chat/page.tsx`
- Global styles: Edit `app/globals.css`

## Troubleshooting

**Issue: "insufficient_quota" error**
- Solution: Add credits to your OpenAI account or switch to Groq (free)

**Issue: SSL certificate errors**
- Solution: Set `NODE_TLS_REJECT_UNAUTHORIZED=0` in `.env.local` (development only)

**Issue: PDF text extraction fails**
- Solution: PDF might be image-based. Use OCR tools or GPT-4 Vision

**Issue: Messages not showing**
- Solution: Hard refresh browser (Ctrl+Shift+R) or restart dev server

## Performance Tips

- Use Groq for faster responses (free)
- Limit file sizes for faster processing
- CSV files: First 10 rows are sent to AI for analysis
- PDF files: First 5000 characters are sent to AI

## Security Notes

- Never commit `.env.local` to version control
- API keys are server-side only
- File processing happens in browser (client-side)
- Uploaded files are not stored on server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues and questions:
- Check the troubleshooting section
- Review CopilotKit docs: https://docs.copilotkit.ai
- Check Groq docs: https://console.groq.com/docs

## Acknowledgments

- Built with [CopilotKit](https://copilotkit.ai)
- Powered by [Groq](https://groq.com) and [OpenAI](https://openai.com)
- UI inspired by ChatGPT and Claude
