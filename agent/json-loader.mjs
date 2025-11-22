export async function load(url, context, nextLoad) {
  // Handle JSON imports from node_modules (like agent0-sdk)
  if (url.endsWith('.json') || url.includes('.json')) {
    try {
      // Try to load with type: "json" attribute
      const result = await nextLoad(url, { 
        ...context, 
        importAttributes: context.importAttributes || { type: 'json' }
      });
      return result;
    } catch (error) {
      // Fallback: try loading as JSON without strict checking
      if (error.code === 'ERR_IMPORT_ATTRIBUTE_MISSING') {
        const result = await nextLoad(url, { 
          ...context, 
          importAttributes: { type: 'json' }
        });
        return result;
      }
      throw error;
    }
  }
  return nextLoad(url, context);
}

