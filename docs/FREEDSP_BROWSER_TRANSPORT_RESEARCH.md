# Browser transport capability
WebHID Output transmission alone does not prove command completion. FreeDSP CAF requires matching replies obtained by native Input GET_REPORT. No verified pure browser workflow exists on Windows for this exact descriptor.
The loopback helper remains required. Feature GET_REPORT is not equivalent to Input GET_REPORT. WebUSB availability must not be inferred from a native handle or driver experiment.
