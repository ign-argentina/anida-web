/**
 * searchHistory.js - Módulo para gestionar historial de búsquedas
 * ANIDA - Atlas Digital de Argentina
 * 
 * Funcionalidad:
 * - Guarda las últimas 5 búsquedas del usuario en localStorage
 * - Proporciona API simple para save, get, clear
 * - Implementa FIFO (First In, First Out)
 */

const STORAGE_KEY = 'anida_search_history';
const MAX_HISTORY_ITEMS = 5;

/**
 * Módulo de historial de búsquedas
 */
const SearchHistory = {
  /**
   * Guarda una búsqueda en el historial
   * @param {string} query - Término de búsqueda
   */
  save(query) {
    if (!query || typeof query !== 'string') return;
    
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    
    try {
      let history = this.get();
      
      // Remover si ya existe (para moverlo al inicio)
      history = history.filter(item => item !== trimmed);
      
      // Agregar al inicio
      history.unshift(trimmed);
      
      // Limitar a MAX_HISTORY_ITEMS (FIFO)
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      
      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      
      return true;
    } catch (error) {
      console.error('Error guardando historial de búsqueda:', error);
      return false;
    }
  },
  
  /**
   * Obtiene el historial de búsquedas
   * @returns {Array<string>} - Array de búsquedas recientes
   */
  get() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      
      // Validar que sea un array
      if (!Array.isArray(history)) return [];
      
      // Filtrar elementos válidos (strings no vacíos)
      return history.filter(item => 
        typeof item === 'string' && item.trim().length > 0
      );
    } catch (error) {
      console.error('Error leyendo historial de búsqueda:', error);
      return [];
    }
  },
  
  /**
   * Limpia todo el historial
   * @returns {boolean} - true si se limpió correctamente
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error limpiando historial de búsqueda:', error);
      return false;
    }
  },
  
  /**
   * Obtiene la cantidad de elementos en el historial
   * @returns {number} - Cantidad de búsquedas guardadas
   */
  count() {
    return this.get().length;
  },
  
  /**
   * Verifica si hay historial disponible
   * @returns {boolean} - true si hay al menos una búsqueda guardada
   */
  hasHistory() {
    return this.count() > 0;
  }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchHistory;
}
