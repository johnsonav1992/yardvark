import type { FeedbackEmailData } from "../services/email.service";

export const generateFeedbackEmailHtml = (data: FeedbackEmailData): string => {
	const feedbackTypeConfig = {
		general: { icon: "💬", label: "General Feedback", color: "#3b82f6" },
		bug: { icon: "🐛", label: "Bug Report", color: "#ef4444" },
		enhancement: { icon: "💡", label: "Feature Request", color: "#8b5cf6" },
	};

	const typeInfo = feedbackTypeConfig[data.feedbackType];

	return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Yardvark Feedback from ${data.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              color: #1a1a1a;
              margin: 0;
              padding: 24px;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: #22c55e;
              color: white;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 600;
            }
            .content {
              padding: 24px;
            }
            .feedback-type {
              display: inline-flex;
              align-items: center;
              background: ${typeInfo.color}10;
              color: ${typeInfo.color};
              padding: 6px 12px;
              border-radius: 6px;
              font-weight: 500;
              font-size: 14px;
              margin-bottom: 24px;
              border: 1px solid ${typeInfo.color}30;
            }
            .feedback-type-icon {
              margin-right: 6px;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: 600;
              color: #374151;
              margin-bottom: 4px;
              font-size: 14px;
            }
            .field-value {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
            }
            .message-content {
              white-space: pre-wrap;
              background: #f8fafc;
              padding: 16px;
              border-radius: 6px;
              border-left: 3px solid ${typeInfo.color};
              font-size: 15px;
              line-height: 1.6;
            }
            .url-link {
              color: #3b82f6;
              text-decoration: none;
            }
            .metadata {
              background: #f1f5f9;
              padding: 12px;
              border-radius: 6px;
              font-size: 13px;
              color: #6b7280;
              font-family: monospace;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Yardvark Feedback</h1>
            </div>
            <div class="content">
              <div class="feedback-type">
                <span class="feedback-type-icon">${typeInfo.icon}</span>
                ${typeInfo.label}
              </div>

              <div class="field">
                <div class="field-label">From</div>
                <div class="field-value">${data.name} (${data.email})</div>
              </div>

              <div class="field">
                <div class="field-label">Message</div>
                <div class="field-value">
                  <div class="message-content">${data.message}</div>
                </div>
              </div>

              ${
								data.url
									? `
                <div class="field">
                  <div class="field-label">Page URL</div>
                  <div class="field-value">
                    <a href="${data.url}" class="url-link">${data.url}</a>
                  </div>
                </div>
              `
									: ""
							}

              ${
								data.userAgent
									? `
                <div class="field">
                  <div class="field-label">Browser Info</div>
                  <div class="field-value">
                    <div class="metadata">${data.userAgent}</div>
                  </div>
                </div>
              `
									: ""
							}
            </div>
          </div>
        </body>
      </html>
    `;
};
