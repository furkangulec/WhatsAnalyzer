function createResponse({ success = true, message = '', data = null }) {
  return {
    success,
    message,
    data,
  };
}

module.exports = { createResponse }; 